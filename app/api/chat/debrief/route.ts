import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { streamText } from 'ai';
import { openai as aiOpenai } from '@ai-sdk/openai';
import { createDebriefAgent } from '@/src/lib/agents/implementations';
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
    
    // The useChat hook sends messages in a specific format
    const messages = body.messages || [];
    const lastMessage = messages[messages.length - 1];
    const message = lastMessage?.content;
    
    // Extract our custom fields from the options
    const { 
      conversationId, 
      reportType = 'TMP',
      subscriptionId,
      visibleSection,
      reportData,
      agentName 
    } = body;

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

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
            reportData: reportData || null
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
      content: message,
      timestamp: new Date()
    };
    await contextManager.addMessage(context.conversationId, userMessage);
    await conversationStore.addMessage(context.conversationId, userMessage);

    // Create and initialize the DebriefAgent
    const agent = await createDebriefAgent();
    
    // Build system message using agent's method
    // @ts-ignore - accessing protected method
    const systemMessage = agent.buildSystemMessage ? agent.buildSystemMessage(context) : null;
    
    // Extract system prompt or build default
    let systemPrompt = systemMessage || '';
    
    if (!systemPrompt) {
      // Fallback to basic instructions
      // @ts-ignore - accessing protected property
      systemPrompt = agent.instructions || 'You are a helpful assessment debrief assistant.';
    }
    
    // Add debrief-specific context
    let debriefContext = `
You are currently helping the user understand their ${reportType} assessment report.
${subscriptionId ? `The report is from subscription ${subscriptionId}.` : ''}
${visibleSection && visibleSection !== 'overview' ? `The user is currently viewing the ${visibleSection} section.` : ''}
`;

    // Add report content to context if available
    if (reportData) {
      debriefContext += `\n\nReport Summary:`;
      
      if (reportData.profile) {
        debriefContext += `\nProfile: ${reportData.profile.name}`;
        if (reportData.profile.majorRole) {
          debriefContext += ` (Major Role: ${reportData.profile.majorRole})`;
        }
        if (reportData.profile.description) {
          debriefContext += `\nDescription: ${reportData.profile.description}`;
        }
      }
      
      if (reportData.scores) {
        debriefContext += `\n\nScores:`;
        Object.entries(reportData.scores).forEach(([key, value]) => {
          debriefContext += `\n- ${key}: ${value}`;
        });
      }
      
      // If viewing a specific section, include its content
      if (visibleSection && reportData.sections) {
        const currentSection = reportData.sections.find((s: any) => s.id === visibleSection);
        if (currentSection) {
          debriefContext += `\n\nCurrent Section Content (${currentSection.title}):\n${currentSection.content.substring(0, 1000)}...`;
        }
      }
    }
    
    debriefContext += `\n\nProvide insights and answer questions about their results. Be specific and reference the actual data from their report when possible.`;

    systemPrompt = `${systemPrompt}\n\nContext: ${debriefContext}`;

    // Get conversation history from storage or use messages from useChat
    let formattedMessages;
    if (conversationId && messages.length <= 1) {
      // If we have a conversation ID but only the current message, load history
      const storedMessages = await conversationStore.getMessages(context.conversationId);
      formattedMessages = storedMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
    } else if (messages.length > 1) {
      // Use messages from useChat (excluding the current one we just added)
      formattedMessages = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
    } else {
      formattedMessages = [];
    }

    // Stream the response
    const result = await streamText({
      model: aiOpenai('gpt-4o-mini'),
      system: systemPrompt,
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 2000,
      onFinish: async ({ text }) => {
        // Save assistant message
        const assistantMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: text,
          timestamp: new Date()
        };
        
        await contextManager.addMessage(context.conversationId, assistantMessage);
        await conversationStore.addMessage(context.conversationId, assistantMessage);
        
        console.log('[Debrief] Response completed for conversation:', context.conversationId);
      }
    });

    // Add conversation ID to response headers
    const response = result.toTextStreamResponse();
    response.headers.set('X-Conversation-ID', context.conversationId);
    
    return response;
  } catch (error) {
    console.error('Debrief chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}