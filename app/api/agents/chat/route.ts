/**
 * API route for agent chat interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  AgentRouter,
  ContextManager,
  ConversationStore,
  AgentContext,
  Message,
} from '@/src/lib/agents';
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
import { prisma } from '@/lib/db/prisma';

// Request validation schema
const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(4000),
  teamId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Response type
interface ChatResponse {
  conversationId: string;
  message?: string;
  currentAgent: string;
  handoff?: {
    targetAgent: string;
    reason: string;
  };
  events: Array<{
    type: string;
    timestamp: string;
    [key: string]: any;
  }>;
}

// Initialize services - using a custom context manager that integrates with persistence
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

const conversationStore = new ConversationStore(prisma);
const contextManager = new PersistentContextManager(conversationStore);
const router = new AgentRouter({ contextManager });

// Register all available agents
function registerAgents() {
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
}

// Initialize agents on startup
registerAgents();

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { conversationId, message, teamId, metadata } = validationResult.data;

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

      // Verify user has access to this conversation
      // TODO: Add proper authorization check based on user's relationship to the team/conversation
    } else {
      // Create new conversation
      if (!teamId) {
        return NextResponse.json(
          { error: 'Team ID required for new conversation' },
          { status: 400 }
        );
      }

      // Get user details from database
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        include: { team: true, managedTeams: true },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user is a manager of the specified team
      const isManager = dbUser.managedTeams.some(team => team.id === teamId);
      
      if (!isManager && dbUser.teamId !== teamId) {
        return NextResponse.json(
          { error: 'Access denied to this team' },
          { status: 403 }
        );
      }

      // Create new conversation (default to OnboardingAgent)
      const newConversationId = await conversationStore.createConversation(
        teamId,
        isManager ? dbUser.id : dbUser.team?.managerId || dbUser.id,
        {
          initialAgent: 'OnboardingAgent',
          metadata: {
            ...metadata,
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
    }

    // Process message with router
    const response = await router.processConversationMessage(
      context.conversationId,
      message
    );

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

    // Format response
    const chatResponse: ChatResponse = {
      conversationId: context.conversationId,
      message: response.message,
      currentAgent: response.context.currentAgent,
      handoff: response.handoff,
      events: response.events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
      })),
    };

    return NextResponse.json(chatResponse);
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

// GET endpoint to retrieve conversation history
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const teamId = searchParams.get('teamId');

    if (conversationId) {
      // Get specific conversation
      const conversation = await conversationStore.loadConversation(conversationId);
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // TODO: Verify user has access to this conversation

      return NextResponse.json({
        conversation: {
          id: conversation.context.conversationId,
          currentAgent: conversation.context.currentAgent,
          phase: conversation.context.transformationPhase,
          messages: conversation.messages,
          events: conversation.events,
        },
      });
    } else if (teamId) {
      // Get team conversations
      const conversations = await conversationStore.getTeamConversations(teamId, {
        limit: 20,
        offset: 0,
      });

      return NextResponse.json({ conversations });
    } else {
      return NextResponse.json(
        { error: 'Either conversationId or teamId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Chat GET API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}