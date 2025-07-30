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

    // Build system message that prioritizes knowledge base usage
    // DO NOT use agent.buildSystemMessage as it may contain overriding instructions
    let systemMessage = `You are OSmos, the TMS Assessment Agent. 

MANDATORY BEHAVIOR - YOU MUST FOLLOW THESE RULES:

1. When ANY user asks ANYTHING about:
   - TMS methodology or concepts
   - Assessment details (TMP, QO2, Team Signals)
   - What a question measures
   - The TMP handbook or any TMS documentation
   - How assessments work
   - Questionnaire items or scoring
   
   YOU MUST:
   a) IMMEDIATELY use the knowledge base tools BEFORE responding
   b) Search using the appropriate tool:
      - search_tms_knowledge: For general TMS concepts and methodologies
      - get_assessment_methodology: For specific assessment details
      - get_questionnaire_items: For specific questionnaire items
   c) Base your ENTIRE response on the search results
   d) Cite your sources (e.g., "According to the TMP Handbook...")

2. NEVER provide information about TMS without searching first
3. NEVER make up or guess information about assessments
4. If knowledge base search fails, say "I need to search for that information but encountered an issue"

Current context:
- User: ${context.metadata?.user?.name || 'User'}
- Team: ${context.metadata?.team?.name || 'Team'}
- Assessment: ${selectedAssessment?.assessmentType || 'None selected'}
- Page: ${workflowState?.currentPageId || 'N/A'}

Available tools include knowledge base search - USE THEM!`;
    
    // Additional instructions for assessment navigation
    systemMessage += `

For assessment navigation and interaction:

SINGLE QUESTION COMMANDS:
- "answer 2-1 for question 34" → Use answer_question tool 
- "select 1-2" (when context is clear) → Use answer_question for current question

BULK COMMANDS - YOU MUST UNDERSTAND THESE:
- "answer all questions with 2-0" or "respond 2-0 for all items" → Use answer_multiple_questions with ALL question IDs from current page
- "answer 2-1 for all" or "all 2-1" → Use answer_multiple_questions with ALL question IDs
- "answer questions 3-5 with 1-2" or "questions 3 through 5 select 0-2" → Use answer_multiple_questions with questionIds [3,4,5]
- "complete this page with 2-0 then next" → First use answer_multiple_questions for all unanswered questions, then navigate_page
- "answer the rest with 1-2" → Use answer_multiple_questions for only unanswered questions

NAVIGATION:
- "go to next page" or "next" → Use navigate_page tool with direction: "next"
- "previous page" or "back" → Use navigate_page tool with direction: "previous"

QUESTION HELP:
- "explain question 35" → FIRST use knowledge base tools to search for what the question measures

IMPORTANT PARSING RULES:
1. When user says "all questions" - get ALL question IDs from workflowState (Type 18 questions only)
2. When user gives a range like "3-5" or "3 to 5" - map these question numbers to their actual IDs
3. When user says "the rest" - find questions without answers in currentAnswers
4. Always confirm bulk actions: "✅ Updated 5 questions with answer 2-0"
5. CRITICAL: When user says "question 1", they mean the question with Number="1" or Prompt="1)", NOT QuestionID=1
   - Example: "answer 2-0 for question 1" means find the question where Number="1" and use its QuestionID (which might be 20)

Current page questions and their IDs:
${workflowState?.questions?.filter((q: any) => q.Type === 18).map((q: any) => {
  const qId = q.questionID || q.QuestionID;
  const qNum = q.Number || q.Prompt?.replace(')', '') || 'Unknown';
  return `Question ${qNum} = ID ${qId}`;
}).join(', ') || 'none'}

QUESTION NUMBER TO ID MAPPING for this page:
${(() => {
  const mapping: Record<string, number> = {};
  workflowState?.questions?.filter((q: any) => q.Type === 18).forEach((q: any) => {
    const qId = q.questionID || q.QuestionID;
    const qNum = q.Number || q.Prompt?.replace(')', '') || 'Unknown';
    mapping[qNum] = qId;
  });
  return JSON.stringify(mapping, null, 2);
})()}

Remember: ANY question about TMS content requires knowledge base search FIRST.`;

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

    tools.answer_multiple_questions = tool({
      description: 'Answer multiple questions at once with the same value. Use this for bulk operations like "answer all questions with 2-0" or "answer questions 3-5 with 1-2"',
      parameters: z.object({
        questionIds: z.array(z.number()).describe('Array of question IDs to answer'),
        value: z.string().describe('The answer value to apply to all questions (e.g., "2-0", "1-2")')
      }),
      execute: async ({ questionIds, value }) => {
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
          message: `Setting ${questionIds.length} questions to ${value}`,
          questionIds,
          value: mappedValue
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
    // Use lower temperature to ensure instruction following for knowledge base usage
    const agentTemperature = 0.3; // Lower temperature for more consistent tool usage
    
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