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
    let userMessageContent = message || '[User joined the assessment]';

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
      
      context = contextManager.createContext({
        user: {
          id: dbUser.id,
          name: dbUser.firstName && dbUser.lastName
            ? `${dbUser.firstName} ${dbUser.lastName}`
            : dbUser.email || 'User',
          email: dbUser.email || '',
          role: dbUser.role || 'TEAM_MEMBER'
        },
        team: { id: teamId, name: 'Assessment Team' },
        organization: { id: dbUser.organizationId || '', name: 'Organization' },
        metadata: {
          selectedAssessment,
          workflowState,
          currentAnswers,
          visibleSection
        },
        platform: 'TEAMS'
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

    // Get agent configuration for prompts and model
    // @ts-ignore - accessing protected method
    let systemMessage = agent.buildSystemMessage ? agent.buildSystemMessage(context) : '';
    
    // Enhance system message with natural language parsing instructions
    systemMessage += `

IMPORTANT: When users give natural language commands for answering questions, parse them carefully:
- "answer 2-1 for question 34" → Use answer_question tool with questionId: 34, value: "2-1"
- "select 2-0 for the first question" → Find the first question ID and use answer_question tool
- "go to next page" → Use navigate_page tool with direction: "next"
- "previous page" → Use navigate_page tool with direction: "previous"
- "explain question 35" → Use explain_question tool with questionId: 35

Always confirm actions back to the user in a friendly way.`;
    
    const modelName = 'gpt-4o-mini'; // Using fast model for assessments

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
        const question = workflowState?.questions.find(q => q.questionID === questionId);
        if (!question) {
          return { error: 'Question not found' };
        }
        
        // This would use knowledge base to explain the question
        return {
          questionId,
          explanation: `This question measures your preference between "${question.statementA}" and "${question.statementB}".`
        };
      }
    });

    // Stream the response
    const result = await streamText({
      model: aiOpenai(modelName),
      system: systemMessage,
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 2000,
      tools: tools,
      experimental_toolCallStreaming: true,
      maxSteps: 3,
      experimental_continueSteps: true
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