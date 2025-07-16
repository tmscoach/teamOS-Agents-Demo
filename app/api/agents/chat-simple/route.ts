/**
 * Simplified chat API that auto-creates users and teams
 * This is for demo purposes to make it easier to test
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
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
import { JourneyTracker } from '@/lib/orchestrator/journey-tracker';
import { User as PrismaUser, Team as PrismaTeam } from '@/lib/generated/prisma';

// Type definitions
interface AuthUser {
  id: string;
  emailAddresses?: Array<{ emailAddress: string }>;
  fullName?: string | null;
  firstName?: string | null;
}

interface DatabaseUser extends PrismaUser {
  managedTeams: PrismaTeam[];
}

interface RouteEvent {
  type: string;
  timestamp: Date;
  agent?: string;
  guardrailName?: string;
  result?: {
    passed?: boolean;
    severity?: string | null;
  };
}

interface PrismaError extends Error {
  code?: string;
}

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

// Helper functions for POST handler
async function findOrCreateUser(user: AuthUser): Promise<DatabaseUser> {
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    include: { managedTeams: true }
  });

  if (!dbUser) {
    console.log('Creating new user for Clerk ID:', user.id);
    
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

  return dbUser;
}

async function findOrCreateTeamId(dbUser: DatabaseUser): Promise<string> {
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

  return teamId;
}

async function loadOrCreateContext(
  conversationId: string | undefined,
  dbUser: DatabaseUser,
  agentName: string | undefined,
  conversationStore: ConversationStore,
  contextManager: PersistentContextManager
): Promise<AgentContext> {
  let context;
  
  if (conversationId) {
    // Load existing conversation
    const conversationData = await conversationStore.loadConversation(conversationId);
    
    if (!conversationData) {
      throw new Error('Conversation not found');
    }

    context = conversationData.context;
    
    // Set the context in the context manager so it can track messages
    await contextManager.setContext(conversationId, context);
  } else {
    // Get team ID
    const teamId = await findOrCreateTeamId(dbUser);

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

  return context;
}

async function saveGuardrailChecks(
  events: RouteEvent[],
  context: AgentContext,
  message: string
): Promise<void> {
  const guardrailEvents = events.filter(event => event.type === 'guardrail');
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
}

async function extractOnboardingData(
  context: AgentContext, 
  dbUser: DatabaseUser, 
  contextManager: PersistentContextManager
): Promise<{ extractedData: Record<string, any>; onboardingState: any }> {
  let extractedData = {};
  let onboardingState = {
    isComplete: false,
    requiredFieldsCount: 0,
    capturedFieldsCount: 0
  };

  if (context.currentAgent === 'OnboardingAgent' && context.metadata?.onboarding) {
    const onboardingMetadata = context.metadata.onboarding;
    extractedData = onboardingMetadata.capturedFields || {};
    
    console.log('[API] Onboarding metadata:', {
      capturedFields: extractedData,
      isComplete: onboardingMetadata.isComplete,
      state: onboardingMetadata.state
    });
    
    // Count required fields and captured fields
    const requiredFieldsStatus = onboardingMetadata.requiredFieldsStatus || {};
    onboardingState.requiredFieldsCount = Object.keys(requiredFieldsStatus).length;
    onboardingState.capturedFieldsCount = Object.values(requiredFieldsStatus).filter(Boolean).length;
    onboardingState.isComplete = onboardingMetadata.isComplete || false;
    
    // Update journey status when onboarding completes
    if (onboardingState.isComplete && !context.metadata?.journeyUpdated) {
      try {
        console.log('[Journey] Onboarding complete, updating journey status for user:', dbUser.id);
        const journeyTracker = await JourneyTracker.getOrCreateJourneyForUser(dbUser.id);
        await journeyTracker.completeOnboarding();
        
        // Update onboarding data with captured fields
        await journeyTracker.updateJourneyProgress('onboarding_complete', {
          capturedFields: extractedData,
          completedAt: new Date()
        });
        
        // Mark journey as updated to prevent duplicate updates
        context.metadata.journeyUpdated = true;
        await contextManager.setContext(context.conversationId, context);
        
        console.log('[Journey] Successfully updated journey to ASSESSMENT phase');
      } catch (error) {
        console.error('[Journey] Failed to update journey status:', error);
      }
    }
  }

  return { extractedData, onboardingState };
}

function handleDatabaseError(error: PrismaError): NextResponse | null {
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
  
  return null;
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

    // Authenticate user (handles both Clerk and dev auth)
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to chat' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, conversationId, agentName } = body;

    // Allow empty message for initial greeting
    const messageContent = message || "";

    // Auto-create or get user
    const dbUser = await findOrCreateUser(user);

    // Get or create conversation context
    let context;
    try {
      context = await loadOrCreateContext(
        conversationId,
        dbUser,
        agentName,
        conversationStore,
        contextManager
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'Conversation not found') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Process message with router using the routeMessage method directly
    const response = await router.routeMessage(messageContent, context);

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

    // Save guardrail checks for admin visibility
    await saveGuardrailChecks(response.events as RouteEvent[], context, messageContent);

    // Extract onboarding data and update journey if needed
    const { extractedData, onboardingState } = await extractOnboardingData(context, dbUser, contextManager);

    // Format response
    return NextResponse.json({
      conversationId: context.conversationId,
      message: response.message,
      currentAgent: response.context.currentAgent,
      handoff: response.handoff,
      extractedData,
      onboardingState,
      metadata: response.metadata, // Include response metadata (contains suggestedValues)
      events: response.events.map(event => ({
        ...event,
        timestamp: event.timestamp.toISOString(),
      })),
    });
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as PrismaError).code
    };
    
    console.error('Chat API error:', errorDetails);
    
    // Check for specific database errors
    const dbErrorResponse = handleDatabaseError(error as PrismaError);
    if (dbErrorResponse) {
      return dbErrorResponse;
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorDetails.message,
        code: errorDetails.code
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's recent conversations
export async function GET(req: NextRequest) {
  try {
    // Check if services are initialized
    if (!conversationStore) {
      return NextResponse.json(
        { error: 'Chat service is temporarily unavailable' },
        { status: 503 }
      );
    }

    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to view conversations' },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { managedTeams: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get conversations for user's teams
    const teamIds = dbUser.managedTeams.map(team => team.id);
    if (dbUser.teamId) {
      teamIds.push(dbUser.teamId);
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { managerId: dbUser.id },
          { teamId: { in: teamIds } }
        ]
      },
      select: {
        id: true,
        teamId: true,
        managerId: true,
        currentAgent: true,
        phase: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      conversations: conversations.map(conv => ({
        id: conv.id,
        teamId: conv.teamId,
        managerId: conv.managerId,
        currentAgent: conv.currentAgent,
        phase: conv.phase,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messageCount: conv._count.messages
      }))
    });
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