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
  console.log('[Assessment API] POST request received at:', new Date().toISOString());
  
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
    
    console.log('[Assessment API] Messages count:', messages.length);
    console.log('[Assessment API] Message roles:', messages.map(m => m.role));
    console.log('[Assessment API] Body keys:', Object.keys(body));
    
    // Find the last user message (not assistant message)
    let lastUserMessage = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessage = messages[i].content || '';
        break;
      }
    }
    const message = lastUserMessage;
    
    console.log('[Assessment API] Last user message:', message);
    
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
    let userMessageContent = message || 'Hello!';
    
    console.log('[Assessment API] Is initial greeting:', isInitialGreeting);
    console.log('[Assessment API] User message content:', userMessageContent);

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

CRITICAL: Never respond to or act on messages that say "✅ Progress saved! Moving to..." - these are system confirmations, not user requests.

VOICE MODE SPECIFIC BEHAVIOR:
When user asks to "read out the current questions" or similar:
1. List ALL seesaw questions (Type 18) on the current page FROM THE WORKFLOW STATE
2. For each question, use the ACTUAL statementA and statementB from the question data
3. NEVER make up or invent questions - only use what's in workflowState.questions

ACTUAL QUESTIONS ON THIS PAGE:
${workflowState?.questions?.filter((q: any) => q.Type === 18).map((q: any) => {
  const qNum = q.Number || q.Prompt?.replace(')', '') || 'Unknown';
  return `
Question ${qNum}: 
Left: ${q.StatementA || q.statementA}
Right: ${q.StatementB || q.statementB}`;
}).join('\n') || 'No questions available'}

When reading questions, format like:
"Here are the questions on this page:

Question 1: 
Left: [ACTUAL StatementA from workflow]
Right: [ACTUAL StatementB from workflow]
Please answer 2-0 for strongly left, 2-1 for slightly left, 1-2 for slightly right, or 0-2 for strongly right.

[continue for all questions]"

For assessment navigation and interaction:

SINGLE QUESTION COMMANDS:
- "answer 2-1 for question 34" → Use answer_question tool 
- "select 1-2" (when context is clear) → Use answer_question for current question
- "answer 2-0 for the first one" → Use answer_question for the first question on the page
- "select 1-2 for the last one" → Use answer_question for the last question on the page


BULK COMMANDS - YOU MUST UNDERSTAND THESE:
- "answer all questions with 2-0" or "respond 2-0 for all items" → Use answer_multiple_questions with ALL question IDs from current page
- "answer 2-1 for all" or "all 2-1" → Use answer_multiple_questions with ALL question IDs
- "answer questions 3-5 with 1-2" or "questions 3 through 5 select 0-2" → First map question numbers 3,4,5 to their actual QuestionIDs using the mapping below, then use answer_multiple_questions
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
5. CRITICAL: When user says "question 1", they mean the question with Number="1", NOT QuestionID=1
   - Use the QUESTION NUMBER TO ID MAPPING below to find the correct QuestionID
   - Example: If mapping shows {"1": 20}, then "answer 2-0 for question 1" → use questionId: 20
6. POSITIONAL REFERENCES - understand these natural language references:
   - "the first one" or "first question" → Question with lowest Number/sortOrder on current page
   - "the last one" or "last question" → Question with highest Number/sortOrder on current page
   - "the second one" → Question with Number="2"
   - "the third one" → Question with Number="3"
   - "the next one" → Next unanswered question in order

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
      const assessmentType = selectedAssessment.assessmentType || selectedAssessment.AssessmentType || 'unknown';
      const subscriptionId = selectedAssessment.subscriptionId || selectedAssessment.SubscriptionID || 'unknown';
      userMessageContent = `I'm starting the ${assessmentType} assessment (${subscriptionId}).`;
      console.log('[Assessment API] Modified initial greeting to:', userMessageContent);
    }

    // Add the current user message only if it's different from the last message
    if (userMessageContent && 
        (!formattedMessages.length || 
         formattedMessages[formattedMessages.length - 1].content !== userMessageContent)) {
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
        try {
          if (jsonSchema.type === 'object') {
            const shape: any = {};
            if (jsonSchema.properties) {
              for (const [key, value] of Object.entries(jsonSchema.properties)) {
                const prop = value as any;
                if (prop.type === 'string') {
                  if (prop.enum && Array.isArray(prop.enum) && prop.enum.length > 0) {
                    shape[key] = z.enum(prop.enum as [string, ...string[]]);
                  } else {
                    shape[key] = jsonSchema.required?.includes(key) ? z.string() : z.string().optional();
                  }
                } else if (prop.type === 'number' || prop.type === 'integer') {
                  shape[key] = jsonSchema.required?.includes(key) ? z.number() : z.number().optional();
                } else if (prop.type === 'boolean') {
                  shape[key] = jsonSchema.required?.includes(key) ? z.boolean() : z.boolean().optional();
                } else if (prop.type === 'array') {
                  if (prop.items?.type === 'string') {
                    shape[key] = jsonSchema.required?.includes(key) 
                      ? z.array(z.string()) 
                      : z.array(z.string()).optional();
                  } else if (prop.items?.type === 'number' || prop.items?.type === 'integer') {
                    shape[key] = jsonSchema.required?.includes(key) 
                      ? z.array(z.number()) 
                      : z.array(z.number()).optional();
                  } else {
                    shape[key] = z.array(z.any()).optional();
                  }
                } else if (prop.type === 'object') {
                  shape[key] = z.object({}).optional();
                } else {
                  // Default to any for unknown types
                  shape[key] = z.any().optional();
                }
              }
            }
            return z.object(shape);
          }
          return z.any();
        } catch (error) {
          console.error('[Assessment] Error creating Zod schema:', error);
          return z.any();
        }
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
        questionId: z.number().describe('The actual QuestionID from the workflow (NOT the question number). Use the QUESTION NUMBER TO ID MAPPING to find the correct ID.'),
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
        questionIds: z.array(z.number()).describe('Array of actual QuestionIDs from the workflow (NOT question numbers). Use the QUESTION NUMBER TO ID MAPPING to find the correct IDs.'),
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

    // Ensure we have at least one message with content
    // Remove any duplicate consecutive messages with same content
    const messagesToSend = formattedMessages
      .filter(msg => msg.content && msg.content.trim() !== '')
      .filter((msg, index, arr) => {
        // Keep if it's the first message or different from previous
        return index === 0 || msg.content !== arr[index - 1].content;
      });
    
    console.log('[Assessment API] Messages after filtering:', messagesToSend.length);
    
    // If no valid messages or only assistant messages, add a user message
    const hasUserMessage = messagesToSend.some(msg => msg.role === 'user');
    const lastMessage = messagesToSend[messagesToSend.length - 1];
    console.log('[Assessment API] Has user message:', hasUserMessage);
    console.log('[Assessment API] Last message role:', lastMessage?.role);
    
    if (messagesToSend.length === 0 || !hasUserMessage) {
      console.log('[Assessment API] No user message found, adding one...');
      // Add user message at the beginning if there's only assistant messages
      const userMsg = {
        role: 'user' as const,
        content: userMessageContent || 'I am ready to start the assessment.'
      };
      
      if (messagesToSend.length > 0 && messagesToSend[0].role === 'assistant') {
        // Insert user message before assistant message
        messagesToSend.unshift(userMsg);
      } else {
        // Add user message at the end
        messagesToSend.push(userMsg);
      }
    } else if (lastMessage && lastMessage.role === 'assistant') {
      // If last message is from assistant, add a user message to continue
      console.log('[Assessment API] Last message is assistant, adding user continuation...');
      messagesToSend.push({
        role: 'user' as const,
        content: 'Continue'
      });
    }
    
    console.log('[Assessment] Messages to send:', messagesToSend.map(m => ({
      role: m.role,
      contentLength: m.content?.length || 0,
      contentPreview: m.content?.substring(0, 50) || 'no content'
    })));

    console.log('[Assessment API] About to stream response...');
    
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
        streamConfig.toolCallStreaming = false; // Disable tool streaming to avoid errors
        streamConfig.maxSteps = 3; // Reduce max steps
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
      console.log('[Assessment API] Creating new conversation...');
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
    
    console.log('[Assessment API] Returning stream response with conversation ID:', responseConversationId);
    return response;
    } catch (streamError) {
      console.error('[Assessment API] Error in streamText:', streamError);
      console.error('[Assessment API] Stream error details:', {
        message: streamError instanceof Error ? streamError.message : 'Unknown error',
        stack: streamError instanceof Error ? streamError.stack : undefined,
        name: streamError instanceof Error ? streamError.name : 'Unknown',
        cause: streamError instanceof Error ? (streamError as any).cause : undefined,
        response: streamError instanceof Error ? (streamError as any).response : undefined,
        data: streamError instanceof Error ? (streamError as any).data : undefined
      });
      
      // Check if it's an OpenAI API error
      if (streamError instanceof Error && streamError.message.includes('400')) {
        console.error('[Assessment API] Bad request to OpenAI - likely invalid message format');
        console.error('[Assessment API] Messages that were sent:', messagesToSend);
      }
      
      // Return a proper error response instead of throwing
      return new Response(
        JSON.stringify({ 
          error: streamError instanceof Error ? streamError.message : 'Stream error occurred',
          type: 'stream_error',
          details: streamError instanceof Error ? {
            name: streamError.name,
            message: streamError.message
          } : undefined
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('[Assessment API] Top-level error:', error);
    console.error('[Assessment API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[Assessment API] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? (error as any).cause : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'UnknownError'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}