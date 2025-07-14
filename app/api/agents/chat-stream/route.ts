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

  async addMessage(conversationId: string, message: Message): Promise<void> {
    console.log(`[PersistentContextManager] Adding message to conversation ${conversationId}:`, {
      role: message.role,
      content: message.content.substring(0, 50) + '...',
      agent: message.agent
    });
    
    // Add to in-memory context
    const context = this.getContext(conversationId);
    if (context) {
      context.messageHistory.push(message);
    }
    
    // Persist to database
    try {
      await this.conversationStore.addMessage(conversationId, message);
      console.log(`[PersistentContextManager] Successfully saved message to database`);
    } catch (error) {
      console.error(`[PersistentContextManager] Failed to save message:`, error);
      throw error;
    }
  }
}

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
    const { message, conversationId, agentName } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process in background
    (async () => {
      try {
        // Initialize services
        const conversationStore = new ConversationStore(prisma);
        const contextManager = new PersistentContextManager(conversationStore);
        const router = new AgentRouter({ contextManager });

        // Register agents
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
          } catch (error) {
            console.error(`Failed to register ${agentDef.name}:`, error);
          }
        }

        // Get or create user
        let dbUser = await prisma.user.findUnique({
          where: { clerkId: user.id },
          include: { managedTeams: true }
        });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              clerkId: user.id,
              email: user.emailAddresses?.[0]?.emailAddress || `${user.id}@demo.com`,
              name: user.fullName || user.firstName || 'Demo User',
              role: 'MANAGER',
            },
            include: { managedTeams: true }
          });
        }

        let context: AgentContext;
        
        if (conversationId) {
          // Load existing conversation
          const conversationData = await conversationStore.loadConversation(conversationId);
          if (!conversationData) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Conversation not found' })}\n\n`));
            await writer.close();
            return;
          }
          context = conversationData.context;
          await contextManager.setContext(conversationId, context);
        } else {
          // Create new conversation
          let teamId = dbUser.managedTeams[0]?.id;
          
          if (!teamId) {
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

          const newConversationId = await conversationStore.createConversation(
            teamId,
            dbUser.id,
            {
              initialAgent: agentName || 'OrchestratorAgent',
              metadata: {
                initiatedBy: dbUser.id,
                step: req.headers.get('x-journey-step') || undefined
              }
            }
          );

          context = await contextManager.createContext({
            conversationId: newConversationId,
            teamId: teamId,
            managerId: dbUser.id,
            transformationPhase: 'discovery',
            metadata: { 
              currentAgent: agentName || 'OrchestratorAgent',
              conversationStarted: new Date()
            }
          });

          await contextManager.setContext(newConversationId, context);
          
          // Send conversation ID to client
          await writer.write(encoder.encode(`data: ${JSON.stringify({ conversationId: newConversationId })}\n\n`));
        }

        // Get the agent
        const agent = router.agents.get(agentName || context.metadata?.currentAgent || 'OrchestratorAgent');
        if (!agent) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Agent not found' })}\n\n`));
          await writer.close();
          return;
        }

        // Check if agent supports streaming
        if ('streamMessage' in agent && typeof agent.streamMessage === 'function') {
          // Stream the response
          const stream = agent.streamMessage(message, context);
          let fullMessage = '';
          
          for await (const chunk of stream) {
            fullMessage += chunk;
            await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }

          // Save the complete message
          await contextManager.addMessage(context.conversationId, {
            role: 'assistant',
            content: fullMessage,
            agent: agent.name,
            timestamp: new Date()
          });

          // Send completion signal
          await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } else {
          // Fallback to non-streaming
          const response = await router.routeMessage(message, context);
          
          // Save events
          for (const event of response.events) {
            await conversationStore.addEvent(context.conversationId, event);
          }

          // Send the complete message
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            message: response.message,
            done: true 
          })}\n\n`));
        }

      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    // Return streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}