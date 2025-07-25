import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { AgentRouter, ContextManager, ConversationStore, AgentContext, TransformationPhase } from '@/src/lib/agents';
import { 
  createOnboardingAgent,
  createOrchestratorAgent,
  createDiscoveryAgent,
  createAssessmentAgent,
  createAlignmentAgent,
  createLearningAgent,
  createNudgeAgent,
  createProgressMonitor,
  createRecognitionAgent,
  createDebriefAgent,
  createReportingAgent
} from '@/src/lib/agents/implementations';
import prisma from '@/lib/db';
import { streamText, tool } from 'ai';
import { z } from 'zod';
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
let initialized = false;

async function initializeServices() {
  if (initialized) return;
  
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
      { name: 'RecognitionAgent', create: createRecognitionAgent },
      { name: 'DebriefAgent', create: createDebriefAgent },
      { name: 'ReportingAgent', create: createReportingAgent }
    ];

    for (const agentDef of agents) {
      try {
        const agent = await agentDef.create();
        router.registerAgent(agent);
      } catch (error) {
        console.error(`Failed to register ${agentDef.name}:`, error);
      }
    }
    
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize chat services:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Initialize services on first request
    await initializeServices();
    
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
        include: { Team_Team_managerIdToUser: true }
      });
    }
    
    if (!dbUser) {
      // Try by clerkId
      dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        include: { Team_Team_managerIdToUser: true }
      });
    }

    if (!dbUser) {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          clerkId: user.id,
          email: userEmail || `${user.id}@demo.com`,
          name: user.fullName || user.firstName || userEmail?.split('@')[0] || 'Demo User',
          role: 'MANAGER',
          journeyStatus: 'ONBOARDING',
          journeyPhase: 'ONBOARDING',
          updatedAt: new Date()
        },
        include: { Team_Team_managerIdToUser: true }
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
      
      // Ensure organization context is present (for older conversations)
      if (!context.organizationId && dbUser.organizationId) {
        context.organizationId = dbUser.organizationId;
        context.organizationRole = dbUser.organizationRole;
        context.userRole = (dbUser.role === 'ADMIN' ? 'MANAGER' : dbUser.role) as 'MANAGER' | 'TEAM_MEMBER' | null;
        
        // Update context in metadata as well
        context.metadata.organizationId = dbUser.organizationId;
        context.metadata.organizationRole = dbUser.organizationRole;
        
        // Save updated context
        await conversationStore.updateContext(conversationId, context);
      }
    } else {
      // Create new conversation
      const teamId = dbUser.Team_Team_managerIdToUser[0]?.id || dbUser.teamId || '';
      
      // Determine the appropriate phase based on the agent
      let conversationPhase = dbUser.journeyPhase?.toLowerCase() || 'onboarding';
      if (agentName) {
        // Map agents to their typical phases
        const agentPhaseMap: Record<string, string> = {
          'OnboardingAgent': 'onboarding',
          'DiscoveryAgent': 'analysis',
          'AssessmentAgent': 'assessment',
          'DebriefAgent': 'assessment', // Debrief happens during/after assessment
          'AlignmentAgent': 'transformation',
          'LearningAgent': 'transformation',
          'NudgeAgent': 'monitoring',
          'ProgressMonitor': 'monitoring',
          'RecognitionAgent': 'monitoring',
          'OrchestratorAgent': dbUser.journeyPhase?.toLowerCase() || 'onboarding'
        };
        conversationPhase = agentPhaseMap[agentName] || dbUser.journeyPhase?.toLowerCase() || 'onboarding';
      }
      
      const newConversationId = await conversationStore.createConversation(
        teamId,
        dbUser.id,
        {
          initialAgent: agentName || 'OnboardingAgent',
          phase: conversationPhase as TransformationPhase, // Set the appropriate phase
          organizationId: dbUser.organizationId || undefined,
          metadata: {
            initiatedBy: dbUser.id,
            userRole: dbUser.role,
            userName: dbUser.name,
            userEmail: dbUser.email,
            journeyPhase: dbUser.journeyPhase,
            journeyStatus: dbUser.journeyStatus,
            onboardingCompleted: dbUser.journeyPhase !== 'ONBOARDING',
            completedAssessments: dbUser.completedAssessments || {},
            // Add organization context for data access
            organizationId: dbUser.organizationId,
            organizationRole: dbUser.organizationRole,
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
        
        // Pre-populate name from SSO if available
        const capturedFields: Record<string, any> = {};
        if (user.fullName || user.firstName) {
          const userName = user.fullName || user.firstName;
          capturedFields.user_name = userName;
          requiredFieldsStatus.user_name = true;
          console.log(`[Streaming] Pre-populated user_name from SSO: ${userName}`);
        }
        
        context.metadata.onboarding = {
          capturedFields,
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

    // Update onboarding completion status BEFORE agent processes message
    if (context.currentAgent === 'OnboardingAgent' && context.metadata.onboarding) {
      const metadata = context.metadata.onboarding;
      const requiredFields = await getRequiredFields('OnboardingAgent');
      
      // Check current completion status
      const capturedCount = Object.values(metadata.requiredFieldsStatus || {}).filter(Boolean).length;
      const requiredCount = requiredFields.length;
      
      if (capturedCount === requiredCount && requiredCount > 0 && !metadata.isComplete) {
        console.log('[Streaming] Setting isComplete=true BEFORE agent response generation');
        metadata.isComplete = true;
        context.metadata.onboarding = metadata;
        await conversationStore.updateContext(context.conversationId, {
          metadata: context.metadata
        });
      }
    }

    // Get the current agent
    const agent = router.getAgent(context.currentAgent);
    if (!agent) {
      return new Response('Agent not found', { status: 404 });
    }

    // Clear cache to ensure we get the latest configuration
    AgentConfigLoader.clearCache(context.currentAgent);

    // Force reload configuration
    // @ts-ignore - accessing protected method for streaming
    if (agent.loadConfiguration) {
      // @ts-ignore - accessing protected method for streaming
      await agent.loadConfiguration();
    }

    // Ensure the agent's configuration is loaded
    // @ts-ignore - accessing protected method for streaming
    if (agent.ensureConfigLoaded) {
      // @ts-ignore - accessing protected method for streaming
      await agent.ensureConfigLoaded();
    }

    // Check if agent has loaded configuration
    // @ts-ignore - accessing protected property
    console.log(`[${context.currentAgent}] Loaded config:`, agent.loadedConfig?.systemPrompt ? 'Has system prompt' : 'No system prompt');

    // For OrchestratorAgent, load user data into context
    if (context.currentAgent === 'OrchestratorAgent' && dbUser && !context.metadata?.userDataLoaded) {
      console.log('[Streaming] Loading user data for OrchestratorAgent');
      try {
        const user = await prisma.user.findUnique({
          where: { id: dbUser.id },
          select: {
            name: true,
            email: true,
            journeyPhase: true,
            journeyStatus: true,
            onboardingData: true,
            completedAssessments: true,
            viewedDebriefs: true,
            teamSignalsEligible: true
          }
        });

        if (user) {
          console.log('[Streaming] User onboarding data:', user.onboardingData);
          // Merge user data into context metadata
          context.metadata = {
            ...context.metadata,
            userName: user.name,
            userEmail: user.email,
            journeyPhase: user.journeyPhase,
            journeyStatus: user.journeyStatus,
            onboardingCompleted: user.journeyPhase !== 'ONBOARDING',
            completedAssessments: user.completedAssessments || {},
            viewedDebriefs: user.viewedDebriefs || {},
            teamSignalsEligible: user.teamSignalsEligible,
            userDataLoaded: true
          };

          // If onboarding data exists, extract it
          if (user.onboardingData && typeof user.onboardingData === 'object') {
            const onboardingData = user.onboardingData as any;
            if (onboardingData.extractedFields) {
              context.metadata.onboarding = {
                extractedFields: onboardingData.extractedFields
              };
              console.log('[Streaming] Extracted onboarding fields:', onboardingData.extractedFields);
            }
          }
        }
      } catch (error) {
        console.error('[Streaming] Error loading user data:', error);
      }
    }

    // Build system prompt using the agent's method which includes loaded configuration
    // @ts-ignore - accessing protected method for streaming
    const systemPrompt = agent.buildSystemMessage ? 
      // @ts-ignore - accessing protected method for streaming
      agent.buildSystemMessage(context) : 
      // @ts-ignore - accessing protected property for streaming
      (typeof agent.instructions === 'function' 
        // @ts-ignore - accessing protected property for streaming
        ? agent.instructions(context) 
        // @ts-ignore - accessing protected property for streaming
        : agent.instructions);

    console.log(`[${context.currentAgent}] System prompt preview:`, systemPrompt.substring(0, 200) + '...');

    // Add extraction context to prompt
    const extractionContext = await buildExtractionContext(context);

    // Build messages for the conversation
    const conversationMessages = context.messageHistory.slice(-10).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Handle empty message (initial greeting)
    let userMessageContent = message || '[User joined the conversation]';
    
    // Special handling for DebriefAgent
    if (context.currentAgent === 'DebriefAgent') {
      // First message - inject subscription check instruction
      if (context.messageCount === 0 || userMessageContent === '[User joined the conversation]') {
        console.log(`[${context.currentAgent}] First message detected - injecting subscription check instruction`);
        userMessageContent = `The user has just joined the conversation. Please check what completed assessments they have available for debrief.

IMPORTANT: Use tms_get_dashboard_subscriptions to check for completed assessments. Filter for assessments with status "Completed" that haven't been debriefed yet.

If completed reports are available, proactively offer: "I see you have completed [assessment name]. Would you like to review your results and insights?"

If no completed reports available, inform user: "I don't see any completed assessments ready for debrief. Would you like me to check your assessment status?"

User message: ${userMessageContent}`;
      }
      // Check if user is confirming after we've offered a debrief
      else if (context.messageHistory?.length > 0) {
        const lastAssistantMessage = [...context.messageHistory].reverse().find(msg => msg.role === 'assistant');
        const isConfirmation = message && (
          message.toLowerCase().includes('yes') || 
          message.toLowerCase().includes('please') ||
          message.toLowerCase().includes('start') ||
          message.toLowerCase().includes('let\'s') ||
          message.toLowerCase().includes('sure') ||
          message.toLowerCase().includes('go ahead')
        );
        const hasOfferedDebrief = lastAssistantMessage?.content && (
          lastAssistantMessage.content.includes('I see you have completed') ||
          lastAssistantMessage.content.includes('Team Management Profile (TMP) assessment')
        );
        
        if (isConfirmation && hasOfferedDebrief) {
          console.log(`[${context.currentAgent}] User confirmed debrief - injecting skip-to-objectives instruction`);
          
          // Extract subscription ID from previous messages
          let subscriptionId = null;
          for (const msg of context.messageHistory) {
            if (msg.content) {
              // Look for subscription ID in tool results
              const subscriptionMatch = msg.content.match(/"SubscriptionID":\s*(\d+)/);
              if (subscriptionMatch) {
                subscriptionId = subscriptionMatch[1];
                break;
              }
            }
          }
          
          userMessageContent = `The user has confirmed they want to start the TMP debrief. 
DO NOT check subscriptions again - we already know they have a completed TMP assessment${subscriptionId ? ` with subscription ID: ${subscriptionId}` : ''}.
Go directly to the debrief flow starting with: "Great! The purpose of our session is to learn more about yourself, explore your personal team management profile, and use that information as a catalyst to review and fine-tune how you work. To get started, what are your main objectives from the debrief session today?"

DO NOT use tms_get_dashboard_subscriptions.
DO NOT load the full report yet. Only load report data when needed to answer specific questions.
${subscriptionId ? `IMPORTANT: When using tms_debrief_report, always include subscriptionId: '${subscriptionId}' in your parameters.` : ''}

User message: ${message}`;
        }
      }
    }

    console.log(`[${context.currentAgent}] Message history:`, conversationMessages.length, 'messages');
    console.log(`[${context.currentAgent}] User message:`, userMessageContent);

    // Validate input with guardrails if the agent has them
    // @ts-ignore - accessing protected method
    if (agent && 'validateInput' in agent && typeof agent.validateInput === 'function') {
      try {
        // @ts-ignore - accessing protected method
        const validationResult = await agent.validateInput(userMessageContent, context);
        console.log(`[${context.currentAgent}] Guardrail validation result:`, validationResult);
        
        // Save guardrail events to database
        if (validationResult.events && validationResult.events.length > 0) {
          for (const event of validationResult.events) {
            await conversationStore.addEvent(context.conversationId, event);
            
            // Save to guardrail checks table for admin visibility
            const guardrailEvent = event as any;
            if (event.type === 'guardrail') {
              try {
                await prisma.guardrailCheck.create({
                  data: {
                    id: `guard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    conversationId: context.conversationId,
                    agentName: guardrailEvent.agent || context.currentAgent,
                    guardrailType: guardrailEvent.guardrailName || 'unknown',
                    input: userMessageContent,
                    passed: guardrailEvent.result?.passed || false,
                    severity: guardrailEvent.result?.metadata?.severity || 
                             (guardrailEvent.result?.passed === false ? 'high' : 'low'),
                    reasoning: JSON.stringify(guardrailEvent.result || {}),
                    timestamp: guardrailEvent.timestamp || new Date()
                  }
                });
                console.log(`[${context.currentAgent}] Saved guardrail check: ${guardrailEvent.guardrailName}`);
              } catch (error) {
                console.error('Failed to save guardrail check:', error);
              }
            }
          }
        }
        
        // If validation failed, return early with the failure message
        if (!validationResult.passed) {
          // Create a simple text stream with the guardrail failure message
          const failureMessage = `I cannot process that message. ${validationResult.failureReason || 'Please rephrase your request.'}`;
          
          // Save the user message first
          await conversationStore.addMessage(context.conversationId, {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: userMessageContent,
            timestamp: new Date()
          });
          
          // Save the assistant's response
          await conversationStore.addMessage(context.conversationId, {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: failureMessage,
            agent: context.currentAgent,
            timestamp: new Date()
          });
          
          // Return the failure message as a properly formatted AI SDK stream
          // Use streamText with a simple system prompt that returns the failure message
          const result = await streamText({
            model: aiOpenai(agent && 'model' in agent ? (agent as any).model : 'gpt-4o-mini'),
            system: 'You are a helpful assistant. Return exactly the message provided by the user, nothing more.',
            messages: [
              {
                role: 'user',
                content: failureMessage
              }
            ],
            onFinish: async ({ text }) => {
              console.log('[Streaming] Guardrail failure response finished');
              // The messages are already saved above, no need to save again
            }
          });
          
          console.log('[Streaming] Returning guardrail failure stream');
          return result.toDataStreamResponse({
            headers: {
              'X-Conversation-ID': context.conversationId
            }
          });
        }
      } catch (error) {
        console.error(`[${context.currentAgent}] Guardrail validation error:`, error);
        // Continue without guardrails if there's an error
      }
    }

    // Get the agent's tools if available
    let tools: Record<string, any> | undefined = undefined;
    if (agent && 'tools' in agent && Array.isArray(agent.tools)) {
      // Convert agent tools to AI SDK format
      tools = {};
      for (const agentTool of agent.tools) {
        // Convert JSON schema to Zod schema (simplified conversion)
        const createZodSchema = (jsonSchema: any): any => {
          if (jsonSchema.type === 'object') {
            const shape: any = {};
            if (jsonSchema.properties) {
              for (const [key, value] of Object.entries(jsonSchema.properties)) {
                const prop = value as any;
                if (prop.type === 'string') {
                  shape[key] = prop.required ? z.string() : z.string().optional();
                } else if (prop.type === 'number') {
                  shape[key] = prop.required ? z.number() : z.number().optional();
                } else if (prop.type === 'boolean') {
                  shape[key] = prop.required ? z.boolean() : z.boolean().optional();
                } else if (prop.type === 'object') {
                  shape[key] = z.object({});
                }
              }
            }
            return z.object(shape);
          }
          return z.object({});
        };

        tools[agentTool.name] = tool({
          description: agentTool.description,
          parameters: createZodSchema(agentTool.parameters),
          execute: async (params: any) => {
            console.log(`[${context.currentAgent}] Executing tool: ${agentTool.name}`, params);
            try {
              const result = await agentTool.execute(params, context);
              console.log(`[${context.currentAgent}] Tool result:`, JSON.stringify(result, null, 2));
              
              // Extract the appropriate string response from the tool result
              if (result.success && result.output) {
                // For search_tms_knowledge, format the results properly
                if (agentTool.name === 'search_tms_knowledge' && result.output.results) {
                  const searchResults = result.output.results;
                  console.log(`[${context.currentAgent}] Search results count:`, searchResults.length);
                  
                  if (searchResults.length === 0) {
                    return 'No results found for your search query.';
                  }
                  
                  // Format the search results for the model to use
                  const formattedResults = searchResults.map((r: any, idx: number) => 
                    `Result ${idx + 1} (relevance: ${r.relevance?.toFixed(2) || 'N/A'}):\n${r.content}\nSource: ${r.source || 'Unknown'}`
                  ).join('\n\n---\n\n');
                  
                  console.log(`[${context.currentAgent}] Formatted search results:`, formattedResults);
                  return formattedResults;
                }
                
                // If output has naturalLanguage, use that
                if (result.output.naturalLanguage) {
                  return result.output.naturalLanguage;
                }
                // If output has summary, use that
                if (result.output.summary) {
                  return result.output.summary;
                }
                // If output is a string, use it directly
                if (typeof result.output === 'string') {
                  return result.output;
                }
                // Otherwise, stringify the output
                return JSON.stringify(result.output);
              }
              
              // If there's an error, return it
              if (result.error) {
                return result.error;
              }
              
              // Default fallback
              return 'Tool execution completed';
            } catch (error) {
              console.error(`[${context.currentAgent}] Tool execution error:`, error);
              return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }
        });
      }
      console.log(`[${context.currentAgent}] Available tools:`, Object.keys(tools));
    }
    
    // Add explicit instruction for tool usage
    const toolInstructions = tools && Object.keys(tools).length > 0 
      ? '\n\nCRITICAL INSTRUCTION: You MUST ALWAYS provide a complete natural language response to the user. If you use tools, explain what you found in a conversational way. Never end your response after just calling a tool. After using any tool, you must interpret and present the results to the user in a helpful manner.'
      : '';
    
    const enhancedPrompt = `${systemPrompt}${toolInstructions}\n\n${extractionContext}`;

    // Use the new AI SDK streaming approach
    try {
      // Get the model from the agent if it has one
      let modelName = 'gpt-4o-mini';
      let temperature = 0.7;
      if (agent && 'model' in agent) {
        modelName = (agent as any).model || 'gpt-4o-mini';
      }
      if (agent && 'temperature' in agent) {
        temperature = (agent as any).temperature ?? 0.7;
      }
      
      console.log(`[${context.currentAgent}] Using model: ${modelName}, temperature: ${temperature}`);
      
      const streamConfig: any = {
        model: aiOpenai(modelName),
        system: enhancedPrompt,
        messages: [
          ...conversationMessages,
          { role: 'user', content: userMessageContent }
        ],
        temperature: temperature,
        maxTokens: 1000, // Increase token limit
      };
      
      // Only add tools if we have them
      if (tools && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
        // Don't force tool choice - let the model decide naturally
        // streamConfig.toolChoice = 'auto';
        console.log('[Streaming] Tools added to stream config');
        console.log('[Streaming] Tool count:', Object.keys(tools).length);
      }
      
      const result = await streamText({
        ...streamConfig,
        experimental_toolCallStreaming: true, // Enable tool streaming
        maxSteps: 3, // Allow multiple steps for tool calls and responses
        experimental_continueSteps: true, // Continue after tool calls
        onToolCall: ({ toolCall }: any) => {
          console.log('[Streaming] Tool call initiated:', toolCall.toolName, toolCall.args);
        },
        onStepFinish: ({ stepType, toolCalls, toolResults, finishReason, usage }: any) => {
          console.log('[Streaming] Step finished:', { 
            stepType, 
            toolCallCount: toolCalls?.length,
            toolResultCount: toolResults?.length,
            finishReason 
          });
          if (toolResults && toolResults.length > 0) {
            console.log('[Streaming] Tool results:', toolResults);
          }
        },
        onFinish: async ({ text, toolCalls, toolResults, finishReason, usage }: any) => {
        console.log('[Streaming] Stream finished:', { 
          hasText: !!text, 
          textLength: text?.length,
          toolCallCount: toolCalls?.length,
          toolResultCount: toolResults?.length,
          finishReason
        });
        
        // If we have tool results but no text, create a fallback message
        let finalContent = text;
        if (!text && toolResults && toolResults.length > 0) {
          console.log('[Streaming] No text response but have tool results, creating fallback');
          console.log('[Streaming] Tool results structure:', JSON.stringify(toolResults, null, 2));
          
          // Extract the tool result content
          const toolResult = toolResults[0];
          console.log('[Streaming] First tool result:', toolResult);
          
          if (toolResult && toolResult.result) {
            if (typeof toolResult.result === 'string') {
              finalContent = toolResult.result;
              console.log('[Streaming] Using tool result string:', finalContent);
            } else if (toolResult.result.naturalLanguage) {
              finalContent = toolResult.result.naturalLanguage;
              console.log('[Streaming] Using naturalLanguage from result');
            } else if (toolResult.result.summary) {
              finalContent = toolResult.result.summary;
              console.log('[Streaming] Using summary from result');
            }
          }
          
          if (!finalContent) {
            finalContent = 'I found the information you requested. The tool execution completed successfully.';
            console.log('[Streaming] Using default fallback message');
          }
        }
        
        // Save the complete message after streaming is done
        const assistantMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: finalContent || 'I encountered an issue generating a response.',
          agent: context.currentAgent,
          timestamp: new Date()
        };
        
        console.log('[Streaming] Saving assistant message:', {
          hasContent: !!assistantMessage.content,
          contentLength: assistantMessage.content?.length,
          contentPreview: assistantMessage.content?.substring(0, 100)
        });
        
        await contextManager.addMessage(context.conversationId, assistantMessage);
        await conversationStore.addMessage(context.conversationId, assistantMessage);

        // Wait for extraction to complete
        const extractedData = await extractionPromise;
        
        // Check if OnboardingAgent is completing and ready for handoff
        // Note: We check the text content to detect when the agent is performing handoff
        const isHandoffMessage = text.includes("Let's begin building something amazing together") || 
             text.includes("Let's begin building something amazing together") || // Check with different quotes
             text.includes("ready to begin your transformation journey") ||
             text.includes("ready for the next step - our Assessment Agent") ||
             text.includes("You're ready for the next step") ||
             text.includes("begin building something amazing together") || // Without "Let's"
             text.includes("transformation journey") && text.includes("ready") ||
             text.includes("Welcome to TMS") && text.includes("excited to support you") ||
             text.includes("Enjoy your journey with TMS") ||
             text.includes("Enjoy exploring the platform") ||
             text.includes("transforming your team's dynamics");
        
        if (context.currentAgent === 'OnboardingAgent') {
          console.log('[Journey] Checking for handoff:', {
            currentAgent: context.currentAgent,
            journeyUpdated: context.metadata?.journeyUpdated,
            isHandoffMessage,
            textSnippet: text.substring(text.length - 100) // Last 100 chars
          });
        }
        
        // Also check if this appears to be a completion message based on metadata
        const isOnboardingComplete = context.metadata?.onboarding?.isComplete === true;
        const appearsToBeCompletionMessage = isOnboardingComplete && 
          (isHandoffMessage || text.includes("journey") || text.includes("welcome") || text.includes("excited"));
        
        // This block is no longer needed since we handle journey update immediately
        // when all fields are captured (see line 520)
        
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
          
          if (capturedCount === requiredCount && requiredCount > 0 && !metadata.isComplete) {
            metadata.isComplete = true;
            console.log('[Journey] All required fields captured, marking onboarding as complete');
            console.log('[Journey] Captured fields:', metadata.capturedFields);
            
            // Update journey status immediately when all fields are captured
            if (context.currentAgent === 'OnboardingAgent' && !context.metadata?.journeyUpdated) {
              try {
                console.log('[Journey] Updating journey status to ASSESSMENT phase');
                
                // Update journey status to move to Assessment phase and save onboarding data
                const updatedUser = await prisma.user.update({
                  where: { id: dbUser.id },
                  data: {
                    journeyPhase: 'ASSESSMENT',
                    journeyStatus: 'ACTIVE',
                    currentAgent: 'AssessmentAgent',
                    lastActivity: new Date(),
                    onboardingData: {
                      extractedFields: metadata.capturedFields || {},
                      completedAt: new Date().toISOString()
                    }
                  }
                });
                
                // Create organization in Clerk when onboarding completes for managers
                if (dbUser.role === 'MANAGER' && !dbUser.organizationId) {
                  const orgName = metadata.capturedFields?.organization;
                  
                  if (orgName) {
                    let organizationId: string;
                    let organizationRole = 'org:admin';
                    
                    try {
                      // Check if we're in dev mode or if Clerk is not fully configured
                      const isDevMode = process.env.NODE_ENV === 'development' && 
                        (user.id.startsWith('dev_user_') || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
                      
                      if (isDevMode) {
                        // In dev mode, create a mock organization ID
                        organizationId = `org_dev_${orgName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
                        
                        console.log('[Organization] Dev mode: Creating mock organization:', {
                          userId: dbUser.id,
                          organizationName: orgName,
                          mockOrgId: organizationId
                        });
                      } else {
                        // Production mode: Use Clerk API
                        const { clerkClient } = await import('@clerk/nextjs/server');
                        const clerk = await clerkClient();
                        
                        console.log('[Organization] Creating organization in Clerk:', {
                          userId: dbUser.id,
                          organizationName: orgName,
                          clerkUserId: user.id
                        });
                        
                        // Create organization in Clerk
                        const organization = await clerk.organizations.createOrganization({
                          name: orgName,
                          slug: orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                          createdBy: user.id, // Clerk user ID
                        });
                        
                        // Add user as admin of the organization
                        await clerk.organizations.createOrganizationMembership({
                          organizationId: organization.id,
                          userId: user.id,
                          role: 'org:admin'
                        });
                        
                        organizationId = organization.id;
                      }
                      
                      // Update user in database with organizationId
                      await prisma.user.update({
                        where: { id: dbUser.id },
                        data: {
                          organizationId: organizationId,
                          organizationRole: organizationRole
                        }
                      });
                      
                      // Update all teams managed by this user
                      await prisma.team.updateMany({
                        where: { 
                          managerId: dbUser.id,
                          organizationId: null // Only update teams without an org
                        },
                        data: { 
                          organizationId: organizationId 
                        }
                      });
                      
                      console.log('[Organization] Successfully created organization:', {
                        userId: dbUser.id,
                        organizationId: organizationId,
                        organizationName: orgName,
                        isDevMode: isDevMode
                      });
                    } catch (error: any) {
                      console.error('[Organization] Failed to create organization:', {
                        error: error.message || error,
                        orgName,
                        userId: dbUser.id,
                        stack: error.stack
                      });
                      
                      // Even if Clerk fails, create a fallback organization ID to not block the user
                      if (process.env.NODE_ENV === 'development') {
                        try {
                          const fallbackOrgId = `org_fallback_${orgName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
                          
                          await prisma.user.update({
                            where: { id: dbUser.id },
                            data: {
                              organizationId: fallbackOrgId,
                              organizationRole: 'org:admin'
                            }
                          });
                          
                          await prisma.team.updateMany({
                            where: { 
                              managerId: dbUser.id,
                              organizationId: null
                            },
                            data: { 
                              organizationId: fallbackOrgId 
                            }
                          });
                          
                          console.log('[Organization] Created fallback organization in dev mode:', fallbackOrgId);
                        } catch (fallbackError) {
                          console.error('[Organization] Failed to create fallback organization:', fallbackError);
                        }
                      }
                    }
                  } else {
                    console.log('[Organization] No organization name found in onboarding data');
                  }
                }
                
                // Update conversation to reflect the new agent
                await prisma.conversation.update({
                  where: { id: context.conversationId },
                  data: { currentAgent: 'AssessmentAgent' }
                });
                
                console.log('[Journey] Journey status updated to Assessment phase');
                
                // Mark journey as updated to prevent duplicate updates
                context.metadata.journeyUpdated = true;
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

        // Check for suggested values only if onboarding is not complete
        const onboardingMetadata = context.metadata.onboarding || {};
        if (!onboardingMetadata.isComplete && context.currentAgent === 'OnboardingAgent') {
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
        } else {
          // Clear any existing suggested values when onboarding is complete or not in OnboardingAgent
          if (onboardingMetadata.suggestedValues) {
            delete onboardingMetadata.suggestedValues;
            context.metadata.onboarding = onboardingMetadata;
            await conversationStore.updateContext(context.conversationId, {
              metadata: context.metadata
            });
          }
        }
      },
    });

      // Return streaming response with metadata headers
      const headers = new Headers();
      headers.set('X-Conversation-ID', context.conversationId);
      headers.set('X-Current-Agent', context.currentAgent);
      
      console.log('[Streaming] Returning stream response');
      return result.toDataStreamResponse({ headers });
    } catch (toolError) {
      console.error('[Streaming] Tool error:', toolError);
      console.error('[Streaming] Tool error details:', {
        message: toolError instanceof Error ? toolError.message : 'Unknown error',
        stack: toolError instanceof Error ? toolError.stack : undefined
      });
      throw toolError;
    }
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