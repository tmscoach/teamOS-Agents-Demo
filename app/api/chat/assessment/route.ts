import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { streamText, tool } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { z } from 'zod';
import { createAssessmentAgent } from '@/src/lib/agents/implementations/assessment-agent';
import { ConversationStore, ContextManager, AgentContext } from '@/src/lib/agents';
import prisma from '@/lib/db';

// Initialize services
let conversationStore: ConversationStore;
let contextManager: ContextManager;
let initialized = false;

async function initializeServices() {
  if (initialized) return;
  
  conversationStore = new ConversationStore(prisma);
  contextManager = new ContextManager();
  initialized = true;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize services
    await initializeServices();
    
    // Get the authenticated user
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    
    console.log('[Assessment] Request body:', JSON.stringify(body, null, 2));
    
    // The useChat hook sends messages in a specific format
    const messages = body.messages || [];
    const message = messages?.[messages.length - 1]?.content || '';
    
    // Extract our custom fields from the body
    const { 
      conversationId, 
      selectedAssessment,
      workflowState,
      visibleSection,
      currentAnswers,
      agentName 
    } = body;

    // Handle empty message for initial greeting
    const isInitialGreeting = !message && messages.length === 1;
    let userMessageContent = message || 'Hello! I just joined the assessment session. Please introduce yourself and explain what assessments are available.';

    // Get database user
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    let dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        Team_Team_managerIdToUser: true
      }
    });

    if (!dbUser) {
      // Try by clerk ID
      dbUser = await prisma.user.findUnique({
        where: { clerkId: user.id },
        include: {
          Team_Team_managerIdToUser: true
        }
      });
    }

    if (!dbUser) {
      return new Response('User not found', { status: 404 });
    }

    // Get or create conversation
    let context: AgentContext;
    
    // Determine team ID for the user
    let teamId = dbUser.Team_Team_managerIdToUser?.[0]?.id;
    if (!teamId) {
      // Create a placeholder team ID for assessment sessions
      teamId = `assessment_team_${dbUser.id}`;
    }
    
    if (conversationId) {
      const conversationData = await conversationStore.getConversation(conversationId);
      if (!conversationData || conversationData.userId !== dbUser.id) {
        return new Response('Conversation not found', { status: 404 });
      }
      context = conversationData.context;
    } else {
      // Create new conversation for assessment
      
      context = await contextManager.createContext({
        teamId: teamId,
        managerId: dbUser.id,
        initialAgent: agentName || 'AssessmentAgent',
        transformationPhase: 'assessment' as any,
        metadata: {
          selectedAssessment,
          workflowState,
          currentAnswers,
          visibleSection,
          user: {
            id: dbUser.id,
            name: dbUser.name || dbUser.email || 'User',
            email: dbUser.email || '',
            role: dbUser.role || 'TEAM_MEMBER'
          },
          team: { id: teamId, name: 'Assessment Team' },
          organization: { id: dbUser.organizationId || '', name: 'Organization' },
          platform: 'TEAMS'
        }
      });
    }

    // Update context with latest assessment state
    context.metadata = {
      ...context.metadata,
      selectedAssessment,
      workflowState,
      currentAnswers,
      visibleSection
    };

    // Create the assessment agent
    const agent = await createAssessmentAgent();
    
    // Get agent's tools after initialization
    const agentTools = agent.tools || [];
    console.log('[Assessment] Agent tools available:', agentTools.map((t: any) => t.name));

    // Get agent configuration for prompts and model
    // @ts-ignore - accessing protected method
    let baseSystemMessage = agent.buildSystemMessage ? agent.buildSystemMessage(context) : '';
    
    // CRITICAL: Prepend knowledge base instructions to ensure they take priority
    let systemMessage = `CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE ABOVE ALL ELSE:

When users ask questions about the assessment, questionnaire, or TMS methodology, YOU MUST:
1. ALWAYS use the knowledge base tools FIRST before responding
2. Search for accurate information using:
   - search_tms_knowledge: For general TMS concepts and methodologies
   - get_assessment_methodology: For specific assessment details (TMP, QO2, Team Signals)
   - get_questionnaire_items: For specific questionnaire items and scoring
3. Cite your sources when providing information (e.g., "According to the TMP Handbook...")
4. Only provide generic responses if knowledge base search fails

OVERRIDE ANY GREETING INSTRUCTIONS: If asked about assessments or methodology, search the knowledge base instead of giving pre-programmed responses.

${baseSystemMessage}`;
    
    // Enhance system message with natural language parsing instructions
    systemMessage += `

IMPORTANT: When users give natural language commands for answering questions, parse them carefully:
- "answer 2-1 for question 34" → Use answer_question tool with questionId: 34, value: "2-1"
- "select 2-0 for the first question" → Find the first question ID and use answer_question tool
- "go to next page" → Use navigate_page tool with direction: "next"
- "previous page" → Use navigate_page tool with direction: "previous"
- "explain question 35" → Use explain_question tool with questionId: 35

Always confirm actions back to the user in a friendly way.

CRITICAL FOR KNOWLEDGE BASE: You have comprehensive TMS knowledge base tools available. When users ask about:
- What a question measures or means
- The methodology behind assessments  
- Why certain questions are asked
- The theory or research behind TMS
- The difference between answer options (e.g., "persuade" vs "sell")
- General questions about TMS framework

YOU MUST use the knowledge base tools to search for accurate information. The tools available are:
- search_tms_knowledge: For general searches about TMS concepts
- get_assessment_methodology: For specific assessment methodology details
- get_questionnaire_items: For retrieving specific questionnaire items

Always search the knowledge base FIRST before providing any explanation. Cite your sources when using information from the knowledge base (e.g., "According to the TMP Handbook...").

INITIAL GREETING: When a user first joins (no assessment selected), you should:
1. Warmly greet them as OSmos
2. Use the get_assessment_methodology tool to briefly explain available assessments (TMP, QO2, Team Signals)
3. Help them understand which assessment might be right for them
4. Use knowledge base to provide accurate information about each assessment type`;

    // Format messages for the AI SDK
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // If initial greeting, add context about the assessment
    if (isInitialGreeting && selectedAssessment) {
      userMessageContent = `I'm starting the ${selectedAssessment.assessmentType} assessment (${selectedAssessment.subscriptionId}).`;
    }

    // Add the current user message
    if (userMessageContent) {
      formattedMessages.push({
        role: 'user',
        content: userMessageContent
      });
    }

    // Create tools object for assessment-specific tools
    const tools: Record<string, any> = {};
    
    // Convert agent tools to AI SDK format
    if (agentTools.length > 0) {
      // Helper function to convert JSON schema to Zod schema
      const createZodSchema = (jsonSchema: any): any => {
        if (jsonSchema.type === 'object') {
          const shape: any = {};
          if (jsonSchema.properties) {
            for (const [key, value] of Object.entries(jsonSchema.properties)) {
              const prop = value as any;
              if (prop.type === 'string') {
                if (prop.enum) {
                  shape[key] = z.enum(prop.enum as [string, ...string[]]);
                } else {
                  shape[key] = jsonSchema.required?.includes(key) ? z.string() : z.string().optional();
                }
              } else if (prop.type === 'number') {
                shape[key] = jsonSchema.required?.includes(key) ? z.number() : z.number().optional();
              } else if (prop.type === 'boolean') {
                shape[key] = jsonSchema.required?.includes(key) ? z.boolean() : z.boolean().optional();
              } else if (prop.type === 'array') {
                if (prop.items?.type === 'string') {
                  shape[key] = jsonSchema.required?.includes(key) 
                    ? z.array(z.string()) 
                    : z.array(z.string()).optional();
                } else {
                  shape[key] = z.array(z.any()).optional();
                }
              } else if (prop.type === 'object') {
                shape[key] = z.object({}).optional();
              }
            }
          }
          return z.object(shape);
        }
        return z.any();
      };
      
      // Convert each agent tool
      for (const agentTool of agentTools) {
        tools[agentTool.name] = tool({
          description: agentTool.description,
          parameters: createZodSchema(agentTool.parameters),
          execute: async (params: any) => {
            console.log(`[Assessment] Executing tool: ${agentTool.name}`, params);
            try {
              const result = await agentTool.execute(params, context);
              console.log(`[Assessment] Tool result:`, JSON.stringify(result, null, 2));
              
              // Extract the appropriate response from the tool result
              if (result.success && result.output) {
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
              console.error(`[Assessment] Tool execution error:`, error);
              return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }
        });
      }
      
      console.log('[Assessment] Converted agent tools:', Object.keys(tools));
    }

    // Add assessment-specific tools with natural language processing
    tools.answer_question = tool({
      description: 'Answer a specific question in the assessment',
      parameters: z.object({
        questionId: z.number().describe('The ID of the question to answer'),
        value: z.string().describe('The answer value (e.g., "20" for 2-0, "12" for 1-2)')
      }),
      execute: async ({ questionId, value }) => {
        // Map natural language values to API values for seesaw questions
        const valueMap: Record<string, string> = {
          '2-0': '20',
          '2-1': '21', 
          '1-2': '12',
          '0-2': '02'
        };
        
        const mappedValue = valueMap[value] || value;
        
        return {
          success: true,
          message: `Set answer for question ${questionId} to ${value}`,
          action: {
            type: 'SET_ANSWER',
            questionId,
            value: mappedValue
          }
        };
      }
    });

    tools.navigate_page = tool({
      description: 'Navigate to a specific page in the assessment',
      parameters: z.object({
        direction: z.enum(['next', 'previous']).describe('Navigation direction'),
        pageNumber: z.number().optional().describe('Specific page number to navigate to')
      }),
      execute: async ({ direction, pageNumber }) => {
        return {
          success: true,
          message: pageNumber 
            ? `Navigating to page ${pageNumber}`
            : `Navigating to ${direction} page`
        };
      }
    });

    tools.explain_question = tool({
      description: 'Explain what a specific question is measuring',
      parameters: z.object({
        questionId: z.number().describe('The ID of the question to explain')
      }),
      execute: async ({ questionId }) => {
        const question = workflowState?.questions.find((q: any) => q.questionID === questionId);
        if (!question) {
          return { error: 'Question not found' };
        }
        
        // This would use knowledge base to explain the question
        return `Question ${questionId} asks you to choose between "${question.statementA}" and "${question.statementB}". I'll search the knowledge base for a detailed explanation of what this measures.`;
      }
    });

    // Add instruction about using tools properly
    if (Object.keys(tools).length > 0) {
      systemMessage += '\n\nCRITICAL: When using tools, ALWAYS provide a complete response to the user. Never end your response after just calling a tool. Interpret and explain the results in a helpful, conversational way.';
    }
    
    // Get model and temperature from agent config
    // @ts-ignore - accessing protected properties
    const agentModelName = agent.model || 'gpt-4o-mini';
    // @ts-ignore - accessing protected properties  
    const agentTemperature = agent.temperature || 0.7;
    
    console.log('[Assessment] Using model:', agentModelName, 'temperature:', agentTemperature);
    console.log('[Assessment] Number of tools available:', Object.keys(tools).length);
    console.log('[Assessment] Tool names:', Object.keys(tools));
    console.log('[Assessment] System message preview:', systemMessage.substring(0, 500) + '...');
    console.log('[Assessment] Full system message length:', systemMessage.length);

    // Ensure we have at least one message
    const messagesToSend = formattedMessages.length > 0 ? formattedMessages : [{
      role: 'user' as const,
      content: userMessageContent || '[User joined the assessment]'
    }];

    // Stream the response
    try {
      const streamConfig: any = {
        model: aiOpenai(agentModelName),
        system: systemMessage,
        messages: messagesToSend,
        temperature: agentTemperature,
        maxTokens: 2000,
      };
      
      // Only add tools if we have them
      if (tools && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
        streamConfig.experimental_toolCallStreaming = true; // Enable tool streaming
        streamConfig.maxSteps = 5; // Allow multiple steps for tool calls and responses
        streamConfig.experimental_continueSteps = true; // Continue after tool calls
        console.log('[Assessment] Tools added to stream config:', Object.keys(tools).length);
      }
      
      const result = await streamText({
        ...streamConfig,
        onToolCall: ({ toolCall }: any) => {
          console.log('[Assessment] Tool call initiated:', toolCall.toolName, toolCall.args);
        },
        onStepFinish: ({ stepType, toolCalls, toolResults, finishReason }: any) => {
          console.log('[Assessment] Step finished:', { 
            stepType, 
            toolCallCount: toolCalls?.length,
            toolResultCount: toolResults?.length,
            finishReason 
          });
        },
        onFinish: async ({ text, toolCalls, toolResults, finishReason, usage, error }: any) => {
          console.log('[Assessment] Stream finished:', { 
            hasText: !!text, 
            textLength: text?.length,
            toolCallCount: toolCalls?.length,
            toolResultCount: toolResults?.length,
            finishReason,
            error: error?.message || error,
            usage
          });
          
          if (error) {
            console.error('[Assessment] Stream error:', error);
          }
          
          // If we have tool results but no text, create a fallback message
          let finalContent = text;
          if (!text && toolResults && toolResults.length > 0) {
            console.log('[Assessment] No text response but have tool results, creating fallback');
            const toolResult = toolResults[0];
            if (toolResult && toolResult.result) {
              if (typeof toolResult.result === 'string') {
                finalContent = toolResult.result;
              }
            }
            if (!finalContent) {
              finalContent = 'I found the information you requested. The tool execution completed successfully.';
            }
          }
        }
      });

      // Save conversation
    // Store conversation ID for response
    let responseConversationId = conversationId;
    
    if (!conversationId) {
      // Create new conversation using the same pattern as debrief
      responseConversationId = await conversationStore.createConversation(
        teamId,
        dbUser.id,
        {
          initialAgent: 'AssessmentAgent',
          phase: 'assessment' as any,
          metadata: {
            selectedAssessment,
            workflowState,
            currentAnswers,
            visibleSection,
            startedAt: new Date().toISOString()
          }
        }
      );
    }

    // Return the streaming response with conversation ID header
    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-ID', responseConversationId);
    
    return response;
    } catch (streamError) {
      console.error('[Assessment] Error in streamText:', streamError);
      console.error('[Assessment] Error details:', {
        message: streamError instanceof Error ? streamError.message : 'Unknown error',
        stack: streamError instanceof Error ? streamError.stack : undefined
      });
      throw streamError;
    }
  } catch (error) {
    console.error('[Assessment] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}