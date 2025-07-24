import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { ConversationStore, ContextManager, AgentRouter } from '@/src/lib/agents';
import prisma from '@/lib/db';
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

// Custom context manager for streaming
class StreamPersistentContextManager extends ContextManager {
  private conversationStore: ConversationStore;
  
  constructor(conversationStore: ConversationStore) {
    super();
    this.conversationStore = conversationStore;
  }

  async getContext(conversationId: string): Promise<any> {
    const conversation = await this.conversationStore.loadConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    return conversation.context;
  }

  async setContext(conversationId: string, context: any): Promise<void> {
    await this.conversationStore.updateContext(conversationId, context);
  }

  async addMessage(conversationId: string, message: any): Promise<void> {
    const conversation = await this.conversationStore.loadConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    await this.conversationStore.addMessage(conversationId, message);
  }
}

// Services initialization
let conversationStore: ConversationStore;
let contextManager: StreamPersistentContextManager;
let router: AgentRouter;
let servicesInitialized = false;

async function initializeServices() {
  if (servicesInitialized) return;
  
  try {
  conversationStore = new ConversationStore(prisma);
  contextManager = new StreamPersistentContextManager(conversationStore);
  router = new AgentRouter({ contextManager });

  // Register all agents (handle async ones)
  const agentPromises = [
    createOrchestratorAgent(),
    createOnboardingAgent(),
    createDiscoveryAgent(),
    createAssessmentAgent(), // This returns a Promise
    createAlignmentAgent(),
    createLearningAgent(),
    createNudgeAgent(),
    createProgressMonitor(),
    createRecognitionAgent()
  ];

  const agents = await Promise.all(agentPromises);
  
  agents.forEach(agent => {
    if (agent) {
      router.registerAgent(agent);
      console.log(`Successfully registered ${agent.name}`);
    }
  });
  
  servicesInitialized = true;
  } catch (error) {
    console.error('Failed to initialize chat services:', error);
    throw error;
  }
}

// Initialize on module load
initializeServices().catch(console.error);

export async function POST(req: NextRequest) {
  try {
    // Ensure services are initialized
    await initializeServices();
    
    // Check if services are initialized
    if (!conversationStore || !contextManager || !router) {
      return new Response(
        JSON.stringify({ error: 'Chat service is temporarily unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Please sign in to chat' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await req.json();
    const { message: messageContent, conversationId, agentName } = body;

    if (!messageContent || typeof messageContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { Team_Team_managerIdToUser: true }
    });

    if (!dbUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process the message in the background
    (async () => {
      try {
        // Load or create context
        let context;
        if (conversationId) {
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
          const teamId = dbUser.Team_Team_managerIdToUser.length > 0 
            ? dbUser.Team_Team_managerIdToUser[0].id 
            : dbUser.id;
          
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
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to create conversation' })}\n\n`));
            await writer.close();
            return;
          }
          context = conversationData.context;
        }

        // Send initial metadata
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'metadata',
          conversationId: context.conversationId,
          currentAgent: context.currentAgent
        })}\n\n`));

        // Add user message
        await contextManager.addMessage(context.conversationId, {
          role: 'user',
          content: messageContent,
        });

        // Process extraction in parallel
        const extractionPromise = (async () => {
          if (context.currentAgent === 'OnboardingAgent' && context.metadata?.onboarding) {
            const config = await prisma.agentConfiguration.findFirst({
              where: { agentName: 'OnboardingAgent', active: true },
            });
            
            if (config?.extractionRules) {
              const { ExtractionProcessor } = await import('@/src/lib/agents/extraction/extraction-processor');
              const extractionResults = await ExtractionProcessor.extractAndTrack(
                messageContent,
                config.extractionRules as any,
                {
                  conversationId: context.conversationId,
                  agentName: 'OnboardingAgent',
                  enableLLMFallback: true,
                }
              );
              
              // Send extraction data
              await writer.write(encoder.encode(`data: ${JSON.stringify({
                type: 'extraction',
                extractedData: extractionResults.extracted
              })}\n\n`));
            }
          }
        })();

        // Route message to agent (this would need to be modified to support streaming)
        const response = await router.routeMessage(messageContent, context);

        // Wait for extraction to complete
        await extractionPromise;

        // Send the complete message
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'message',
          content: response.message,
          metadata: response.metadata
        })}\n\n`));

        // Send done signal
        await writer.write(encoder.encode(`data: [DONE]\n\n`));
        
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          error: 'An error occurred while processing your message' 
        })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    // Return the streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('Chat stream API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}