import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { AgentRouter, ContextManager, ConversationStore, AgentContext } from '@/src/lib/agents';
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
import { streamText } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import OpenAI from 'openai';
import { ExtractionProcessor } from '@/src/lib/agents/extraction/extraction-processor';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize services
let conversationStore: ConversationStore;
let contextManager: ContextManager;
let router: AgentRouter;

try {
  conversationStore = new ConversationStore(prisma);
  contextManager = new ContextManager();
  router = new AgentRouter({ contextManager });

  // Register all agents
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
} catch (error) {
  console.error('Failed to initialize chat services:', error);
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { messages, conversationId, agentName } = body;
    
    // Get the latest message
    const message = messages?.[messages.length - 1]?.content || '';

    // Get or create user
    // For dev auth, use email to find/create user
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    let dbUser;
    
    if (userEmail) {
      // Try to find by email first (for dev auth users)
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { managedTeams: true }
      });
    }
    
    if (!dbUser) {
      // Try by clerkId
      dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        include: { managedTeams: true }
      });
    }

    if (!dbUser) {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email: userEmail || `${user.id}@demo.com`,
          name: user.fullName || user.firstName || userEmail?.split('@')[0] || 'Demo User',
          role: 'MANAGER',
          journeyStatus: 'ONBOARDING',
          journeyPhase: 'ONBOARDING'
        },
        include: { managedTeams: true }
      });
    }

    // Load or create context
    let context: AgentContext;
    
    if (conversationId) {
      const conversationData = await conversationStore.loadConversation(conversationId);
      if (!conversationData) {
        return new Response('Conversation not found', { status: 404 });
      }
      context = conversationData.context;
    } else {
      // Create new conversation
      const teamId = dbUser.managedTeams[0]?.id || dbUser.teamId || '';
      const newConversationId = await conversationStore.createConversation(
        teamId,
        dbUser.id,
        {
          initialAgent: agentName || 'OnboardingAgent',
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
      
      // Initialize onboarding metadata for new conversations
      if (agentName === 'OnboardingAgent' && !context.metadata.onboarding) {
        const requiredFields = await getRequiredFields('OnboardingAgent');
        console.log(`[Streaming] Initializing onboarding with required fields:`, requiredFields);
        
        const requiredFieldsStatus: Record<string, boolean> = {};
        for (const field of requiredFields) {
          requiredFieldsStatus[field] = false;
        }
        
        context.metadata.onboarding = {
          capturedFields: {},
          requiredFieldsStatus,
          isComplete: false
        };
        
        await conversationStore.updateContext(context.conversationId, {
          metadata: context.metadata
        });
      }
    }
    
    await contextManager.setContext(context.conversationId, context);

    // Add user message to context and database
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    await contextManager.addMessage(context.conversationId, userMessage);
    await conversationStore.addMessage(context.conversationId, userMessage);

    // Extract information in parallel while streaming response
    const extractionPromise = extractInformation(message, context, dbUser.id);

    // Get the current agent
    const agent = router.getAgent(context.currentAgent);
    if (!agent) {
      return new Response('Agent not found', { status: 404 });
    }

    // Clear cache to ensure we get the latest configuration
    AgentConfigLoader.clearCache(context.currentAgent);

    // Force reload configuration
    // @ts-expect-error - accessing protected method for streaming
    if (agent.loadConfiguration) {
      await agent.loadConfiguration();
    }

    // Ensure the agent's configuration is loaded
    // @ts-expect-error - accessing protected method for streaming
    if (agent.ensureConfigLoaded) {
      await agent.ensureConfigLoaded();
    }

    // Check if agent has loaded configuration
    // @ts-ignore - accessing protected property
    console.log(`[${context.currentAgent}] Loaded config:`, agent.loadedConfig?.systemPrompt ? 'Has system prompt' : 'No system prompt');

    // Build system prompt using the agent's method which includes loaded configuration
    // @ts-expect-error - accessing protected method for streaming
    const systemPrompt = agent.buildSystemMessage ? 
      agent.buildSystemMessage(context) : 
      (typeof agent.instructions === 'function' 
        ? agent.instructions(context) 
        : agent.instructions);

    console.log(`[${context.currentAgent}] System prompt preview:`, systemPrompt.substring(0, 200) + '...');

    // Add extraction context to prompt
    const extractionContext = await buildExtractionContext(context);
    const enhancedPrompt = `${systemPrompt}\n\n${extractionContext}`;

    // Build messages for the conversation
    const conversationMessages = context.messageHistory.slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Handle empty message (initial greeting)
    const userMessageContent = message || '[User joined the conversation]';

    console.log(`[${context.currentAgent}] Message history:`, conversationMessages.length, 'messages');
    console.log(`[${context.currentAgent}] User message:`, userMessageContent);

    // Use the new AI SDK streaming approach
    const result = await streamText({
      model: aiOpenai('gpt-4o-mini'),
      system: enhancedPrompt,
      messages: [
        ...conversationMessages,
        { role: 'user', content: userMessageContent }
      ],
      temperature: 0.7,
      maxTokens: 500,
      onFinish: async ({ text }) => {
        // Save the complete message after streaming is done
        const assistantMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: text,
          agent: context.currentAgent,
          timestamp: new Date()
        };
        
        await contextManager.addMessage(context.conversationId, assistantMessage);
        await conversationStore.addMessage(context.conversationId, assistantMessage);

        // Wait for extraction to complete
        const extractedData = await extractionPromise;
        
        // Special handling: If the agent greets the user by name in the response,
        // and we haven't captured it yet, extract it from the agent's response
        const metadata = context.metadata.onboarding || {};
        if (!metadata.capturedFields?.user_name && !extractedData.user_name) {
          // Look for patterns like "Great to meet you, [Name]!" or "Nice to meet you, [Name]"
          const greetingMatch = text.match(/(?:great|nice|good|pleased)\s+to\s+meet\s+you,?\s+([A-Za-z]+)[!.,]?/i);
          if (greetingMatch) {
            const extractedName = greetingMatch[1];
            // Check if this matches the user's input (case-insensitive)
            if (message.toLowerCase() === extractedName.toLowerCase()) {
              extractedData.user_name = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
              console.log('[Streaming] Captured name from agent greeting:', extractedData.user_name);
            }
          }
        }
        
        // Update context with extracted data
        if (extractedData && Object.keys(extractedData).length > 0) {
          metadata.capturedFields = { ...metadata.capturedFields, ...extractedData };
          
          // Update required fields status
          const requiredFields = await getRequiredFields(context.currentAgent);
          
          // Initialize requiredFieldsStatus with all required fields if not already initialized
          if (!metadata.requiredFieldsStatus || Object.keys(metadata.requiredFieldsStatus).length === 0) {
            metadata.requiredFieldsStatus = {};
            for (const field of requiredFields) {
              metadata.requiredFieldsStatus[field] = false;
            }
          }
          
          // Update status for captured fields
          for (const field of requiredFields) {
            if (metadata.capturedFields[field]) {
              metadata.requiredFieldsStatus[field] = true;
            }
          }
          
          // Check if onboarding is complete
          const capturedCount = Object.values(metadata.requiredFieldsStatus).filter(Boolean).length;
          const requiredCount = requiredFields.length;
          
          if (capturedCount === requiredCount && requiredCount > 0) {
            metadata.isComplete = true;
            
            // Update journey status when onboarding completes
            if (!context.metadata?.journeyUpdated) {
              try {
                console.log('[Journey] Onboarding complete, updating journey status for user:', dbUser.id);
                const { JourneyTracker } = await import('@/lib/orchestrator/journey-tracker');
                const journeyTracker = new JourneyTracker(dbUser.id);
                await journeyTracker.completeOnboarding();
                
                // Update onboarding data with captured fields
                await journeyTracker.updateJourneyProgress('onboarding_complete', {
                  capturedFields: metadata.capturedFields,
                  completedAt: new Date()
                });
                
                // Mark journey as updated to prevent duplicate updates
                context.metadata.journeyUpdated = true;
                console.log('[Journey] Journey status updated to Assessment phase');
              } catch (error) {
                console.error('[Journey] Failed to update journey status:', error);
              }
            }
          }
          
          context.metadata.onboarding = metadata;
          await conversationStore.updateContext(context.conversationId, {
            metadata: context.metadata
          });
        }

        // Check for suggested values
        const suggestedValues = await getSuggestedValuesForMessage(message, text, context);
        console.log('[Streaming] Suggested values check:', {
          found: !!suggestedValues,
          field: suggestedValues?.field,
          count: suggestedValues?.values?.length
        });
        
        if (suggestedValues) {
          context.metadata.onboarding = context.metadata.onboarding || {};
          context.metadata.onboarding.suggestedValues = suggestedValues;
          await conversationStore.updateContext(context.conversationId, {
            metadata: context.metadata
          });
        }
      },
    });

    // Return streaming response with metadata headers
    const headers = new Headers();
    headers.set('X-Conversation-ID', context.conversationId);
    headers.set('X-Current-Agent', context.currentAgent);
    
    return result.toDataStreamResponse({ headers });
  } catch (error) {
    console.error('Streaming chat error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Helper function to extract information
async function extractInformation(
  message: string, 
  context: AgentContext,
  userId: string
): Promise<Record<string, any>> {
  try {
    const config = await AgentConfigLoader.loadConfiguration(context.currentAgent);
    const extractionRules = config?.extractionRules || 
      AgentConfigLoader.getDefaultExtractionRules(context.currentAgent);
    
    // Only extract fields not yet captured
    const metadata = context.metadata?.onboarding || {};
    const capturedFields = metadata.capturedFields || {};
    const fieldsToExtract: Record<string, any> = {};
    
    for (const [field, rule] of Object.entries(extractionRules)) {
      if (!capturedFields[field]) {
        fieldsToExtract[field] = rule;
      }
    }
    
    if (Object.keys(fieldsToExtract).length === 0) {
      return {};
    }
    
    // Get the last assistant message for context
    let messageWithContext = message;
    const lastAssistantMessage = context.messageHistory
      .slice(-2)
      .find(msg => msg.role === 'assistant');
    
    if (lastAssistantMessage) {
      // If the user message is very short (like a single number), provide context
      if (message.length < 20 && /^\d+$/.test(message.trim())) {
        messageWithContext = `Assistant asked: "${lastAssistantMessage.content.substring(0, 200)}..."\nUser replied: "${message}"`;
        console.log('[Extraction] Enhanced message with context for better extraction');
      }
    }
    
    const { extracted } = await ExtractionProcessor.extractAndTrack(
      messageWithContext,
      fieldsToExtract,
      {
        conversationId: context.conversationId,
        agentName: context.currentAgent,
        teamId: context.teamId,
        managerId: userId,
        enableLLMFallback: true
      }
    );
    
    return extracted;
  } catch (error) {
    console.error('Extraction error:', error);
    return {};
  }
}

// Helper to build extraction context for the prompt
async function buildExtractionContext(context: AgentContext): Promise<string> {
  const metadata = context.metadata?.onboarding || {};
  const capturedFields = metadata.capturedFields || {};
  
  if (Object.keys(capturedFields).length === 0) {
    return '';
  }
  
  let contextStr = 'Already captured information:\n';
  for (const [field, value] of Object.entries(capturedFields)) {
    const displayName = field.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    contextStr += `- ${displayName}: ${value}\n`;
  }
  
  return contextStr + '\nDo not ask for information already captured above.';
}

// Helper to get required fields
async function getRequiredFields(agentName: string): Promise<string[]> {
  try {
    const config = await AgentConfigLoader.loadConfiguration(agentName);
    const extractionRules = config?.extractionRules || 
      AgentConfigLoader.getDefaultExtractionRules(agentName);
    
    return Object.entries(extractionRules)
      .filter(([_, rule]: [string, any]) => rule.required === true)
      .map(([field, _]) => field);
  } catch (error) {
    console.error('Error getting required fields:', error);
    return [];
  }
}

// Helper to get suggested values for the current context
async function getSuggestedValuesForMessage(
  userMessage: string,
  agentResponse: string,
  context: AgentContext
): Promise<{ field: string; values: string[]; helpText?: string } | null> {
  try {
    // Get extraction rules to check for suggested values
    const config = await AgentConfigLoader.loadConfiguration(context.currentAgent);
    if (!config || !config.extractionRules) {
      return null;
    }
    
    const extractionRules = config.extractionRules as Record<string, any>;
    
    // Analyze agent response to determine which field is being asked about
    const fieldPatterns: Record<string, RegExp[]> = {
      user_role: [  // Supports both user_role and manager_role
        /what.*role|what.*position|what.*title|your\s+role|job\s+title/i,
        /role.*company|position.*organization/i
      ],
      primary_challenge: [
        /challenge|problem|issue|struggle|difficulty|concern/i,
        /what.*facing|what.*dealing|what.*struggling/i
      ],
      team_size: [
        /how\s+many.*team|size.*team|people.*manage|team.*members/i
      ],
      organization: [
        /company|organization|where.*work|employer/i
      ],
      budget_range: [
        /budget|investment|spend|funding|resources/i
      ],
      timeline_preference: [
        /timeline|timeframe|when.*start|how\s+soon/i
      ]
    };
    
    // Find which field the agent is asking about
    let currentField: string | null = null;
    console.log('[SuggestedValues] Checking agent response for field patterns...');
    console.log('[SuggestedValues] Agent response snippet:', agentResponse.substring(0, 100));
    
    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some(pattern => pattern.test(agentResponse))) {
        currentField = field;
        console.log(`[SuggestedValues] Matched field: ${field}`);
        break;
      }
    }
    
    // If no field identified, no suggestions
    if (!currentField) {
      return null;
    }
    
    // Simple logic: if the field has suggested values, return them
    const rule = extractionRules[currentField];
    if (rule && rule.suggestedValues && rule.suggestedValues.length > 0) {
      console.log(`[Streaming] Showing ${currentField} suggestions`);
      return {
        field: currentField,
        values: rule.suggestedValues,
        helpText: rule.helpText || `Here are some options for ${currentField.replace(/_/g, ' ')}:`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting suggested values:', error);
    return null;
  }
}