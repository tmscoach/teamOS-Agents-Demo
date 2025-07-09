/**
 * Simplified chat API that auto-creates users and teams
 * This is for demo purposes to make it easier to test
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AgentRouter, ContextManager, ConversationStore, AgentContext, Message } from '@/src/lib/agents';
import { 
  createOnboardingAgent,
  createOrchestratorAgent,
  createDiscoveryAgent,
  createAssessmentAgent,
  createAlignmentAgent,
  createLearningAgent,
  createNudgeAgent,
  createProgressMonitor,
  createRecognitionAgent
} from '@/src/lib/agents/implementations';
import prisma from '@/lib/db';

// Custom context manager that integrates with persistence
class PersistentContextManager extends ContextManager {
  private conversationStore: ConversationStore;

  constructor(conversationStore: ConversationStore) {
    super();
    this.conversationStore = conversationStore;
  }

  async getContext(conversationId: string): Promise<AgentContext | null> {
    // First check in-memory cache
    let context = await super.getContext(conversationId);
    
    if (!context) {
      // Load from database
      const conversationData = await this.conversationStore.loadConversation(conversationId);
      if (conversationData) {
        context = conversationData.context;
        // Set in memory for future use
        await this.setContext(conversationId, context);
      }
    }
    
    return context;
  }

  async addMessage(conversationId: string, message: Message): Promise<void> {
    console.log(`[PersistentContextManager] Adding message to conversation ${conversationId}:`, {
      role: message.role,
      content: message.content.substring(0, 50) + '...',
      agent: message.agent
    });
    
    // Add to in-memory context
    await super.addMessage(conversationId, message);
    
    // Also save to database immediately
    try {
      await this.conversationStore.addMessage(conversationId, message);
      console.log(`[PersistentContextManager] Successfully saved message to database`);
    } catch (error) {
      console.error(`[PersistentContextManager] Failed to save message:`, error);
      throw error;
    }
  }
}

// Initialize services
const conversationStore = new ConversationStore(prisma);
const contextManager = new PersistentContextManager(conversationStore);
const router = new AgentRouter({ contextManager });

// Register all agents
router.registerAgent(createOrchestratorAgent());
router.registerAgent(createOnboardingAgent());
router.registerAgent(createDiscoveryAgent());
router.registerAgent(createAssessmentAgent());
router.registerAgent(createAlignmentAgent());
router.registerAgent(createLearningAgent());
router.registerAgent(createNudgeAgent());
router.registerAgent(createProgressMonitor());
router.registerAgent(createRecognitionAgent());

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to chat' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Auto-create or get user
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { managedTeams: true }
    });

    if (!dbUser) {
      console.log('Creating new user for Clerk ID:', user.id);
      
      // Create user
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress || `${user.id}@demo.com`,
          name: user.fullName || user.firstName || 'Demo User',
          role: 'MANAGER',
        },
        include: { managedTeams: true }
      });

      // Create a demo team for the user
      const demoTeam = await prisma.team.create({
        data: {
          name: `${dbUser.name}'s Team`,
          department: 'Engineering',
          managerId: dbUser.id,
          transformationStatus: 'active',
          maturityIndicators: {
            teamSize: 8,
            communicationScore: 3.5,
            collaborationScore: 4.0,
            trustScore: 3.8
          },
        },
      });

      console.log('Created demo team:', demoTeam.name);
    }

    // Get or create conversation
    let context;
    
    if (conversationId) {
      // Load existing conversation
      const conversationData = await conversationStore.loadConversation(conversationId);
      
      if (!conversationData) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      context = conversationData.context;
      
      // Set the context in the context manager so it can track messages
      await contextManager.setContext(conversationId, context);
    } else {
      // Get the user's team (first managed team or create one)
      let teamId = dbUser.managedTeams[0]?.id;
      
      if (!teamId) {
        // If user has no teams, find or create a demo team
        const existingTeam = await prisma.team.findFirst({
          where: { managerId: dbUser.id }
        });

        if (existingTeam) {
          teamId = existingTeam.id;
        } else {
          const newTeam = await prisma.team.create({
            data: {
              name: `${dbUser.name}'s Team`,
              department: 'General',
              managerId: dbUser.id,
              transformationStatus: 'active',
            },
          });
          teamId = newTeam.id;
        }
      }

      // Create new conversation
      const newConversationId = await conversationStore.createConversation(
        teamId,
        dbUser.id,
        {
          initialAgent: 'OnboardingAgent',
          metadata: {
            initiatedBy: dbUser.id,
            userRole: dbUser.role,
          },
        }
      );

      const conversationData = await conversationStore.loadConversation(newConversationId);
      if (!conversationData) {
        throw new Error('Failed to create conversation');
      }

      context = conversationData.context;
      
      // Set the context in the context manager so it can track messages
      await contextManager.setContext(newConversationId, context);
    }

    // Process message with router using the routeMessage method directly
    const response = await router.routeMessage(message, context);

    // Save events to database (messages are already saved by PersistentContextManager)
    for (const event of response.events) {
      await conversationStore.addEvent(context.conversationId, event);
    }

    // Update conversation metadata
    await conversationStore.updateContext(context.conversationId, {
      currentAgent: response.context.currentAgent,
      transformationPhase: response.context.transformationPhase,
      metadata: response.context.metadata,
    });

    // Also save guardrail checks to the GuardrailCheck table for admin visibility
    const guardrailEvents = response.events.filter(event => event.type === 'guardrail');
    if (guardrailEvents.length > 0) {
      try {
        await prisma.guardrailCheck.createMany({
          data: guardrailEvents.map(event => ({
            conversationId: context.conversationId,
            agentName: event.agent,
            guardrailType: (event as any).guardrailName || 'unknown',
            input: message,
            passed: (event as any).result?.passed || false,
            severity: (event as any).result?.severity || null,
            reasoning: JSON.stringify((event as any).result),
            timestamp: event.timestamp
          }))
        });
      } catch (error) {
        console.error('Failed to save guardrail checks:', error);
      }
    }

    // Format response
    return NextResponse.json({
      conversationId: context.conversationId,
      message: response.message,
      currentAgent: response.context.currentAgent,
      handoff: response.handoff,
      events: response.events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}