import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';
import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AgentContext } from '@/src/lib/agents/types';
import { AgentRouter } from '@/src/lib/agents/router';
import { AgentFactory } from '@/src/lib/agents/factory';
import { createAuthenticatedUser } from '@/lib/utils/auth';
import { sendStatusMessage } from '@/lib/utils/status-messages';
import { AgentConfigLoader } from '@/src/lib/agents/config/config-loader';
import { createConversationId } from '@/src/lib/utils/conversation';
import { parseApiMessages } from '@/src/lib/agents/utils';
import { validateRequestBody } from '@/src/lib/utils/api-validation';
import prisma from '@/lib/db';

// Schema for request validation
const requestSchema = {
  agent: { type: 'string', required: true },
  mode: { type: 'string', required: false },
  context: { type: 'object', required: false },
  messages: { type: 'array', required: true },
};

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await currentUser();
    const authenticatedUser = await createAuthenticatedUser(user);

    // Validate request body
    const { errors, data: body } = await validateRequestBody(request, requestSchema);
    if (errors) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { agent: agentName, mode = 'standard', context: clientContext, messages } = body;

    // Parse messages
    const parsedMessages = parseApiMessages(messages);
    const lastUserMessage = parsedMessages[parsedMessages.length - 1]?.content || '';

    // Create or get conversation ID
    const conversationId = clientContext?.conversation?.id || createConversationId();

    // Build agent context
    const agentContext: AgentContext = {
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      conversationId,
      messages: parsedMessages,
      organizationId: authenticatedUser.organizationId,
      teamId: authenticatedUser.teamId,
      managerId: authenticatedUser.id, // Add managerId for journey tracking
      metadata: {
        mode,
        ...clientContext?.metadata,
        userName: clientContext?.user?.name || authenticatedUser.name,
        journeyPhase: clientContext?.journey?.phase,
        completedAssessments: clientContext?.journey?.completedSteps?.reduce((acc: any, step: string) => {
          acc[step] = true;
          return acc;
        }, {}),
      },
    };

    // Initialize agent router
    const router = new AgentRouter();
    
    // Load agent configuration
    const configLoader = new AgentConfigLoader();
    const agentConfig = await configLoader.loadConfig(agentName);
    
    // Create agent instance
    const agent = AgentFactory.createAgent(agentName, agentConfig);
    
    // Register agent with router
    router.registerAgent(agent);

    // Check if this is an action command that should be routed elsewhere
    const actionPatterns = [
      { pattern: /^start\s+(tmp|team\s*signals)/i, targetAgent: 'AssessmentAgent' },
      { pattern: /^(view|show)\s*.*\s*(results?|report)/i, targetAgent: 'DebriefAgent' },
      { pattern: /^invite\s+.+@.+/i, targetAgent: 'TeamManagementAgent' },
    ];

    let targetAgent = agentName;
    let shouldHandoff = false;

    // Check if we need to route to a different agent
    for (const { pattern, targetAgent: target } of actionPatterns) {
      if (pattern.test(lastUserMessage) && agentName !== target) {
        targetAgent = target;
        shouldHandoff = true;
        break;
      }
    }

    // If we need to handoff, prepare the handoff message
    if (shouldHandoff) {
      const handoffMessage = `I'll connect you with the right agent to help with that. Transferring to ${targetAgent}...`;
      
      // Store conversation for handoff
      await prisma.conversation.create({
        data: {
          id: conversationId,
          userId: authenticatedUser.id,
          messages: parsedMessages as any,
          metadata: {
            lastAgent: agentName,
            handoffTo: targetAgent,
            originalRequest: lastUserMessage,
          } as any,
        },
      });

      // Return handoff response
      return new Response(
        JSON.stringify({
          handoff: true,
          targetAgent,
          message: handoffMessage,
          conversationId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Process message with the agent
    const agentResponse = await router.routeMessage(lastUserMessage, agentContext);

    // Convert agent tools to AI SDK format
    const tools = agent.getTools ? agent.getTools(agentContext).reduce((acc: any, tool: any) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (params: any) => {
          try {
            const result = await tool.handler(params, agentContext);
            return { success: true, data: result };
          } catch (error) {
            console.error(`Tool execution error in ${tool.name}:`, error);
            return { success: false, error: error.message };
          }
        },
      };
      return acc;
    }, {}) : {};

    // Get system prompt
    const systemPrompt = typeof agent.config.instructions === 'function'
      ? agent.config.instructions(agentContext)
      : agent.config.instructions;

    // Stream the response
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...convertToCoreMessages(parsedMessages),
      ],
      tools,
      maxSteps: 5,
      onFinish: async ({ text, usage }) => {
        // Store conversation
        try {
          await prisma.conversation.upsert({
            where: { id: conversationId },
            create: {
              id: conversationId,
              userId: authenticatedUser.id,
              messages: [
                ...parsedMessages,
                { role: 'assistant', content: text },
              ] as any,
              metadata: {
                agent: agentName,
                mode,
                usage,
              } as any,
            },
            update: {
              messages: [
                ...parsedMessages,
                { role: 'assistant', content: text },
              ] as any,
              metadata: {
                agent: agentName,
                mode,
                usage,
              } as any,
            },
          });
        } catch (error) {
          console.error('Failed to store conversation:', error);
        }
      },
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Unified chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}