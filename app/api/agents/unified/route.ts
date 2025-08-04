import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText, tool } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { AgentRouter, AgentContext } from '@/src/lib/agents';
import prisma from '@/lib/db';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';
import { 
  createOrchestratorAgent,
  createAssessmentAgent,
  createDebriefAgent
} from '@/src/lib/agents/implementations';

// Schema for request validation
const requestSchema = {
  agent: { type: 'string', required: true },
  mode: { type: 'string', required: false },
  context: { type: 'object', required: false },
  messages: { type: 'array', required: true },
};

export async function POST(request: NextRequest) {
  try {
    console.log('[Unified API] Request received');
    
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      console.log('[Unified API] No user found');
      return new Response('Unauthorized', { status: 401 });
    }
    
    console.log('[Unified API] User:', user.id);

    // Parse request body
    const body = await request.json();
    console.log('[Unified API] Request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.agent || !body.messages) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        details: 'Missing required fields: agent, messages' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { agent: agentName, mode = 'standard', context: clientContext, messages } = body;

    // Parse messages - convert to proper format
    const parsedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));
    const lastUserMessage = parsedMessages[parsedMessages.length - 1]?.content || '';

    // Get or create user in database
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { clerkId: user.id }
        ]
      },
      include: { Team_Team_managerIdToUser: true }
    });

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
          journeyPhase: 'ASSESSMENT',
          updatedAt: new Date()
        },
        include: { Team_Team_managerIdToUser: true }
      });
    }

    // Create or get conversation ID
    const conversationId = clientContext?.conversation?.id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Build agent context
    const agentContext: AgentContext = {
      teamId: dbUser.Team_Team_managerIdToUser[0]?.id || dbUser.teamId || '',
      managerId: dbUser.id,
      transformationPhase: 'assessment' as any,
      conversationId,
      currentAgent: agentName,
      messageHistory: parsedMessages,
      organizationId: dbUser.organizationId,
      userRole: 'MANAGER',
      metadata: {
        mode,
        userId: dbUser.id,
        ...clientContext?.metadata,
        userName: clientContext?.user?.name || dbUser.name,
        journeyPhase: clientContext?.journey?.phase,
        completedAssessments: clientContext?.journey?.completedSteps?.reduce((acc: any, step: string) => {
          acc[step] = true;
          return acc;
        }, {}),
      },
    };

    // Initialize agent router
    const router = new AgentRouter();
    
    // Create and register the appropriate agent
    let agent;
    switch (agentName) {
      case 'OrchestratorAgent':
        agent = await createOrchestratorAgent();
        break;
      case 'AssessmentAgent':
        agent = await createAssessmentAgent();
        break;
      case 'DebriefAgent':
        agent = await createDebriefAgent();
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown agent', agent: agentName }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
    
    // Register agent with router
    router.registerAgent(agent);

    // Check if this is an action command that should be routed elsewhere
    const actionPatterns = [
      { pattern: /^start\s+(tmp|team\s*signals)/i, targetAgent: 'AssessmentAgent' },
      { pattern: /^(view|show)\s*.*\s*(results?|report)/i, targetAgent: 'DebriefAgent' },
      // { pattern: /^invite\s+.+@.+/i, targetAgent: 'TeamManagementAgent' }, // TODO: Implement when agent is available
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
          teamId: dbUser.Team_Team_managerIdToUser[0]?.id || dbUser.teamId || '',
          managerId: dbUser.id,
          currentAgent: targetAgent,
          phase: 'assessment',
          contextData: {
            messages: parsedMessages,
            lastAgent: agentName,
            handoffTo: targetAgent,
            originalRequest: lastUserMessage,
          } as any,
          updatedAt: new Date(),
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

    // Get agent's tools if available
    const tools: Record<string, any> = {};
    if ('tools' in agent && Array.isArray(agent.tools)) {
      for (const agentTool of agent.tools) {
        // Create a simple Zod schema for the parameters
        // This is a simplified conversion - in production you'd want a more robust converter
        const createZodSchema = (params: any) => {
          if (!params) return z.object({});
          
          const schemaShape: any = {};
          for (const [key, value] of Object.entries(params)) {
            // Simple type mapping
            const paramValue = value as any;
            if (paramValue.type === 'string') {
              schemaShape[key] = z.string();
            } else if (paramValue.type === 'number') {
              schemaShape[key] = z.number();
            } else if (paramValue.type === 'boolean') {
              schemaShape[key] = z.boolean();
            } else if (paramValue.type === 'object') {
              schemaShape[key] = z.object({});
            } else if (paramValue.type === 'array') {
              schemaShape[key] = z.array(z.any());
            } else {
              schemaShape[key] = z.any();
            }
            
            // Make optional if not required
            if (!paramValue.required) {
              schemaShape[key] = schemaShape[key].optional();
            }
          }
          
          return z.object(schemaShape);
        };

        tools[agentTool.name] = tool({
          description: agentTool.description,
          parameters: createZodSchema(agentTool.parameters),
          execute: async (params: any) => {
            try {
              const result = await agentTool.execute(params, agentContext);
              return result;
            } catch (error: any) {
              console.error(`Tool execution error in ${agentTool.name}:`, error);
              return { success: false, error: error.message };
            }
          },
        });
      }
    }

    // Get system prompt
    let systemPrompt = '';
    if ('buildSystemMessage' in agent && typeof (agent as any).buildSystemMessage === 'function') {
      systemPrompt = (agent as any).buildSystemMessage(agentContext);
    } else if ('instructions' in agent) {
      systemPrompt = typeof (agent as any).instructions === 'function'
        ? (agent as any).instructions(agentContext)
        : (agent as any).instructions;
    }

    console.log('[Unified API] System prompt length:', systemPrompt.length);
    console.log('[Unified API] Messages to send:', parsedMessages.length);
    console.log('[Unified API] Tools available:', Object.keys(tools || {}));
    
    try {
      console.log('[Unified API] Creating stream with model: gpt-4-turbo');
      console.log('[Unified API] First message:', parsedMessages[0]);
      
      // Stream the response
      const result = await streamText({
        model: openai('gpt-4o-mini'),
        messages: [
          { role: 'system', content: systemPrompt },
          ...convertToCoreMessages(parsedMessages),
        ],
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        maxSteps: 5,
        onFinish: async ({ text, usage }) => {
          console.log('[Unified API] Stream finished successfully');
          console.log('[Unified API] Response length:', text?.length);
        // Store conversation
        try {
          await prisma.conversation.upsert({
            where: { id: conversationId },
            create: {
              id: conversationId,
              teamId: dbUser.Team_Team_managerIdToUser[0]?.id || dbUser.teamId || '',
              managerId: dbUser.id,
              currentAgent: agentName,
              phase: 'assessment',
              contextData: {
                messages: [
                  ...parsedMessages,
                  { role: 'assistant', content: text },
                ]
              } as any,
              updatedAt: new Date(),
              metadata: {
                agent: agentName,
                mode,
                usage,
              } as any,
            },
            update: {
              contextData: {
                messages: [
                  ...parsedMessages,
                  { role: 'assistant', content: text },
                ]
              } as any,
              updatedAt: new Date(),
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
      onError: (error) => {
        console.error('[Unified API] Stream error during generation:', error);
      }
    });
    
      console.log('[Unified API] Streaming response created');
      // Return the streaming response
      return result.toDataStreamResponse();
    } catch (streamError: any) {
      console.error('[Unified API] Stream error:', streamError);
      console.error('[Unified API] Stream error stack:', streamError.stack);
      throw streamError;
    }
  } catch (error: any) {
    console.error('Unified chat API error:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}