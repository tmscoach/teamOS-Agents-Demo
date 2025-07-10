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

// Initialize services with error handling
let conversationStore: ConversationStore;
let contextManager: PersistentContextManager;
let router: AgentRouter;

try {
  conversationStore = new ConversationStore(prisma);
  contextManager = new PersistentContextManager(conversationStore);
  router = new AgentRouter({ contextManager });

  // Register all agents with error handling
  const agents = [
    { name: 'OrchestratorAgent', create: createOrchestratorAgent },
    { name: 'OnboardingAgent', create: createOnboardingAgent },
    { name: 'DiscoveryAgent', create: createDiscoveryAgent },
    { name: 'AssessmentAgent', create: createAssessmentAgent },
    { name: 'AlignmentAgent', create: createAlignmentAgent },
    { name: 'LearningAgent', create: createLearningAgent },
    { name: 'NudgeAgent', create: createNudgeAgent },
    { name: 'ProgressMonitor', create: createProgressMonitor },
    { name: 'RecognitionAgent', create: createRecognitionAgent }
  ];

  for (const agentDef of agents) {
    try {
      const agent = agentDef.create();
      router.registerAgent(agent);
      console.log(`Successfully registered ${agentDef.name}`);
    } catch (error) {
      console.error(`Failed to register ${agentDef.name}:`, error);
      // Continue with other agents
    }
  }
} catch (error) {
  console.error('Failed to initialize chat services:', error);
  // These will be checked in the request handler
}

export async function POST(req: NextRequest) {
  try {
    // Check if services are initialized
    if (!conversationStore || !contextManager || !router) {
      console.error('Chat services not initialized');
      return NextResponse.json(
        { 
          error: 'Chat service is temporarily unavailable',
          details: 'Services are still initializing or database connection failed'
        },
        { status: 503 }
      );
    }

    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to chat' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, conversationId, agentName } = body;

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
          initialAgent: agentName || 'OrchestratorAgent',
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
          data: guardrailEvents.map(event => {
            const guardrailEvent = event as { 
              guardrailName?: string; 
              result?: { passed?: boolean; severity?: string | null };
              agent: string;
              timestamp: Date;
            };
            return {
              conversationId: context.conversationId,
              agentName: guardrailEvent.agent,
              guardrailType: guardrailEvent.guardrailName || 'unknown',
              input: message,
              passed: guardrailEvent.result?.passed || false,
              severity: guardrailEvent.result?.severity || null,
              reasoning: JSON.stringify(guardrailEvent.result),
              timestamp: guardrailEvent.timestamp
            };
          })
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
  } catch (error: any) {
    console.error('Chat API error:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
    
    // Handle specific database errors
    if (error?.code === 'P2021') {
      return NextResponse.json(
        {
          error: 'Database configuration error',
          message: 'The database schema is not properly initialized. Please run migrations.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    if (error?.code === 'P2022') {
      return NextResponse.json(
        {
          error: 'Database schema mismatch',
          message: 'The database schema is out of sync. Some columns may be missing.',
          details: error.message
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error?.code
      },
      { status: 500 }
    );
  }
}