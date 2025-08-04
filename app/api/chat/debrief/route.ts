import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { streamText, tool } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { z } from 'zod';
import { createOpenAIDebriefAgent } from '@/src/lib/agents/implementations/openai-debrief-agent';
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
    
    console.log('[Debrief] Request body:', JSON.stringify(body, null, 2));
    
    // The useChat hook sends messages in a specific format
    const messages = body.messages || [];
    const message = messages?.[messages.length - 1]?.content || '';
    
    // Extract our custom fields from the body
    const { 
      conversationId, 
      reportType = 'TMP',
      subscriptionId,
      visibleSection,
      reportData,
      agentName 
    } = body;

    // Handle empty message for initial greeting (similar to chat-streaming route)
    const isInitialGreeting = !message && messages.length === 1;
    let userMessageContent = message || '[User joined the conversation]';

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
    
    if (conversationId) {
      const conversationData = await conversationStore.getConversation(conversationId);
      if (!conversationData || conversationData.userId !== dbUser.id) {
        return new Response('Conversation not found', { status: 404 });
      }
      context = conversationData.context;
    } else {
      // Create new conversation for debrief
      // Use a default team ID for debrief conversations when user has no team
      let teamId = dbUser.Team_Team_managerIdToUser?.[0]?.id;
      
      if (!teamId) {
        // Create a placeholder team ID for debrief sessions
        teamId = `debrief_team_${dbUser.id}`;
        
        // Check if this placeholder team exists
        const existingTeam = await prisma.team.findUnique({
          where: { id: teamId }
        });
        
        if (!existingTeam) {
          // Create a placeholder team for this user's debrief sessions
          await prisma.team.create({
            data: {
              id: teamId,
              name: `Debrief Team for ${dbUser.name || dbUser.email}`,
              managerId: dbUser.id,
              department: 'Individual Assessment',
              transformationStatus: 'debrief',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
      
      const conversationId = await conversationStore.createConversation(
        teamId,
        dbUser.id,
        {
          initialAgent: 'DebriefAgent',
          phase: 'debrief' as any,
          metadata: {
            reportType,
            subscriptionId,
            visibleSection,
            isDebriefMode: true,
            startedAt: new Date().toISOString(),
            reportData: reportData ? {
              ...reportData,
              sections: reportData.sections?.map((s: any) => ({
                id: s.id,
                title: s.title,
                content: s.content // Keep full content in metadata
              }))
            } : null
          }
        }
      );
      
      const conversationData = await conversationStore.getConversation(conversationId);
      if (!conversationData) {
        return new Response('Failed to create conversation', { status: 500 });
      }
      context = conversationData.context;
    }

    await contextManager.setContext(context.conversationId, context);

    // Add user message
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: userMessageContent,
      timestamp: new Date()
    };
    await contextManager.addMessage(context.conversationId, userMessage);
    await conversationStore.addMessage(context.conversationId, userMessage);

    // Create and initialize the DebriefAgent
    const agent = await createOpenAIDebriefAgent();
    
    // Add report data to context metadata for the agent to use
    if (reportData || subscriptionId) {
      // First, try to get the stored report ID
      let reportId = null;
      if (subscriptionId) {
        // Get the latest report for this subscription (regardless of status for testing)
        const storedReport = await prisma.userReport.findFirst({
          where: {
            subscriptionId,
            userId: dbUser.id
            // Removed processingStatus filter to get latest report for testing
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: { id: true }
        });
        reportId = storedReport?.id;
        console.log('[Debrief] Found report ID for subscription:', { subscriptionId, reportId });
      }
      
      context.metadata.reportId = reportId;
      context.metadata.reportData = reportData;
      context.metadata.reportType = reportType;
      context.metadata.subscriptionId = subscriptionId;
      context.metadata.visibleSection = visibleSection;
      context.metadata.userId = dbUser.id;
      
      // Extract the actual report content from sections
      let fullReportContent = '';
      if (reportData?.sections) {
        reportData.sections.forEach((section: any) => {
          fullReportContent += `\n\n## ${section.title}\n${section.content}`;
        });
      }
      
      // Also add structured data about the report
      context.metadata.reportSummary = {
        name: reportData?.profile?.name || 'Test User',
        majorRole: reportData?.profile?.majorRole || '',
        relatedRoles: reportData?.profile?.relatedRoles || [],
        scores: reportData?.scores || {},
        fullContent: fullReportContent
      };
      
      // Update the context in the store
      await contextManager.setContext(context.conversationId, context);
    }
    
    // Build system message using agent's method
    // @ts-ignore - accessing protected method
    let systemMessage = agent.buildSystemMessage ? agent.buildSystemMessage(context) : '';
    
    console.log('[Debrief] Full system message:', systemMessage);
    
    // Add report summary directly to system message for immediate access
    let extractedName = 'User';
    let extractedMajorRole = '';
    let extractedRelatedRoles: string[] = [];
    let extractedWorkPrefs: Record<string, string> = {};
    
    if (reportData) {
      systemMessage += `\n\n## Report Data Available:\n`;
      
      // Extract data from the introduction section
      const introSection = reportData.sections?.find((s: any) => s.id === 'introduction');
      if (introSection?.content) {
        // Extract name
        const nameMatch = introSection.content.match(/Name\s*\n([^\n]+)/);
        if (nameMatch) extractedName = nameMatch[1].trim();
        
        // Extract major role
        const majorRoleMatch = introSection.content.match(/Major Role([^\n]+)/);
        if (majorRoleMatch) extractedMajorRole = majorRoleMatch[1].trim();
        
        // Extract related roles
        const role1Match = introSection.content.match(/1st Related Role([^\n]+)/);
        const role2Match = introSection.content.match(/2nd Related Role([^\n]+)/);
        if (role1Match) extractedRelatedRoles.push(role1Match[1].trim());
        if (role2Match) extractedRelatedRoles.push(role2Match[1].trim());
      }
      
      // Extract work preferences from sections
      const workPrefSection = reportData.sections?.find((s: any) => s.id === 'workpreferencedistribution');
      if (workPrefSection?.content) {
        const matches = Array.from(workPrefSection.content.matchAll(/(\w+)(\d+)%/g));
        for (const match of matches) {
          extractedWorkPrefs[(match as RegExpMatchArray)[1]] = (match as RegExpMatchArray)[2];
        }
      }
      
      systemMessage += `- Name: ${extractedName}\n`;
      systemMessage += `- Major Role: ${extractedMajorRole}\n`;
      if (extractedRelatedRoles.length > 0) {
        systemMessage += `- Related Roles: ${extractedRelatedRoles.join(', ')}\n`;
      }
      
      // Add ALL work preferences
      if (Object.keys(extractedWorkPrefs).length > 0) {
        systemMessage += `- Work Preferences:\n`;
        const workPrefsOrder = ['Maintaining', 'Inspecting', 'Producing', 'Organising', 'Developing', 'Promoting', 'Innovating', 'Advising'];
        workPrefsOrder.forEach(pref => {
          if (extractedWorkPrefs[pref]) {
            systemMessage += `  - ${pref}: ${extractedWorkPrefs[pref]}%\n`;
          }
        });
      }
      
      // Add key points from the report
      const keyPointsSection = reportData.sections?.find((s: any) => s.id === 'keypoints');
      if (keyPointsSection?.content) {
        systemMessage += `\n- Key Characteristics:\n`;
        const lines = keyPointsSection.content.split('\n').filter((line: string) => line.trim() && !line.includes('Key Points'));
        lines.forEach((line: string) => {
          if (line.trim()) systemMessage += `  ${line.trim()}\n`;
        });
      }
      
      // Add available sections
      systemMessage += `\n- Available Report Sections:\n`;
      reportData.sections?.forEach((section: any) => {
        systemMessage += `  - ${section.title}\n`;
      });
      
      systemMessage += `\nIMPORTANT: This is the user's actual report data. Use it to answer their questions. Do NOT say you can't access the report - you have all the data above.`;
      
      // Add debug info for what data we're sending
      console.log('[Debrief] Report data added to system message:', {
        name: extractedName,
        majorRole: extractedMajorRole,
        relatedRoles: extractedRelatedRoles,
        workPrefsFound: Object.keys(extractedWorkPrefs).length
      });
    }
    
    // Get conversation history
    const conversationMessages = await conversationStore.getMessages(context.conversationId);
    const formattedMessages = conversationMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    // Get agent's tools and convert to AI SDK format
    let tools: Record<string, any> | undefined = undefined;
    const agentTools = agent.tools || [];
    console.log('[Debrief] Agent tools available:', agentTools.map((t: any) => t.name));
    
    if (agentTools.length > 0) {
      // Define which tools are safe to use (knowledge base and report search tools)
      const safeTools = [
        'search_tms_knowledge',
        'get_assessment_methodology', 
        'get_questionnaire_items',
        'search_intervention_strategies',
        'get_benchmark_data',
        'search_report_chunks',
        'search_report_images' // New tool for image understanding
      ];
      
      // Convert agent tools to AI SDK format (similar to chat-streaming route)
      tools = {};
      const toolNames = new Set<string>();
      
      for (const agentTool of agentTools) {
        // Skip duplicate tools
        if (toolNames.has(agentTool.name)) {
          console.log(`[Debrief] Skipping duplicate tool: ${agentTool.name}`);
          continue;
        }
        
        // Only include safe tools
        if (!safeTools.includes(agentTool.name)) {
          console.log(`[Debrief] Skipping unsafe tool: ${agentTool.name}`);
          continue;
        }
        
        toolNames.add(agentTool.name);
        
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
            console.log(`[Debrief] Executing tool: ${agentTool.name}`, params);
            try {
              const result = await agentTool.execute(params, context);
              console.log(`[Debrief] Tool result:`, JSON.stringify(result, null, 2));
              
              // Extract the appropriate string response from the tool result
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
              console.error(`[Debrief] Tool execution error:`, error);
              return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
          }
        });
      }
      
      console.log('[Debrief] Enabled tools:', Object.keys(tools));
    }
    
    // Add tool usage instruction to system message if tools are available
    if (tools && Object.keys(tools).length > 0) {
      systemMessage += '\n\nCRITICAL INSTRUCTION: You MUST ALWAYS provide a complete natural language response to the user. If you use tools, explain what you found in a conversational way. Never end your response after just calling a tool. After using any tool, you must interpret and present the results to the user in a helpful manner.';
    }
    
    // Stream the response with agent's configuration
    // Get model and temperature from agent config
    // @ts-ignore - accessing protected properties
    const modelName = agent.model || 'gpt-4o-mini';
    // @ts-ignore - accessing protected properties
    const temperature = agent.temperature || 0.7;
    
    console.log('[Debrief] Using model:', modelName, 'temperature:', temperature);
    console.log('[Debrief] System message length:', systemMessage.length);
    console.log('[Debrief] Number of tools:', tools ? Object.keys(tools).length : 0);
    
    try {
      // Log the request details
      console.log('[Debrief] Calling streamText with:', {
        model: modelName,
        systemMessageLength: systemMessage.length,
        messagesCount: formattedMessages.length || 1,
        temperature,
        hasTools: tools ? Object.keys(tools).length : 0
      });
      
      const streamConfig: any = {
        model: aiOpenai(modelName),
        system: systemMessage,
        messages: formattedMessages.length > 0 ? formattedMessages : [{
          role: 'user' as const,
          content: userMessageContent
        }],
        temperature: temperature,
        maxTokens: 2000,
      };
      
      // Only add tools if we have them
      if (tools && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
        console.log('[Debrief] Tools added to stream config');
      }
      
      const result = await streamText({
        ...streamConfig,
        experimental_toolCallStreaming: true, // Enable tool streaming
        maxSteps: 3, // Allow multiple steps for tool calls and responses
        experimental_continueSteps: true, // Continue after tool calls
        onToolCall: ({ toolCall }: any) => {
          console.log('[Debrief] Tool call initiated:', toolCall.toolName, toolCall.args);
        },
        onStepFinish: ({ stepType, toolCalls, toolResults, finishReason }: any) => {
          console.log('[Debrief] Step finished:', { 
            stepType, 
            toolCallCount: toolCalls?.length,
            toolResultCount: toolResults?.length,
            finishReason 
          });
        },
        onFinish: async ({ text, toolCalls, toolResults, finishReason, usage }: any) => {
          console.log('[Debrief] Stream finished:', { 
            hasText: !!text, 
            textLength: text?.length,
            toolCallCount: toolCalls?.length,
            toolResultCount: toolResults?.length,
            finishReason
          });
          
          // If we have tool results but no text, create a fallback message
          let finalContent = text;
          if (!text && toolResults && toolResults.length > 0) {
            console.log('[Debrief] No text response but have tool results, creating fallback');
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
          
          // Save assistant message
          const assistantMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant' as const,
            content: finalContent || text || 'I encountered an issue generating a response.',
            timestamp: new Date()
          };
          
          await contextManager.addMessage(context.conversationId, assistantMessage);
          await conversationStore.addMessage(context.conversationId, assistantMessage);
          
          console.log('[Debrief] Response completed:', {
            conversationId: context.conversationId,
            textLength: assistantMessage.content.length,
            finishReason,
            usage
          });
        }
      });

    // Add conversation ID to response headers
    const response = result.toDataStreamResponse({
      headers: {
        'X-Conversation-ID': context.conversationId
      }
    });
    
    return response;
    } catch (streamError) {
      console.error('[Debrief] Error in streamText:', streamError);
      throw streamError;
    }
  } catch (error) {
    console.error('Debrief chat error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return error details in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error instanceof Error ? error.message : 'Unknown error'
      : 'Internal server error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}