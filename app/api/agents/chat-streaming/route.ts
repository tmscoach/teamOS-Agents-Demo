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
            userName: dbUser.name,
            userEmail: dbUser.email,
            journeyPhase: dbUser.journeyPhase,
            journeyStatus: dbUser.journeyStatus,
            onboardingCompleted: dbUser.journeyPhase !== 'ONBOARDING',
            completedAssessments: dbUser.completedAssessments || {},
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
             text.includes("Enjoy your journey with TMS");
        
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
        
        if (context.currentAgent === 'OnboardingAgent' && 
            !context.metadata?.journeyUpdated &&
            (isHandoffMessage || appearsToBeCompletionMessage)) {
          // Double-check that onboarding is actually complete before handoff
          const currentOnboardingMetadata = context.metadata?.onboarding || {};
          if (currentOnboardingMetadata.isComplete) {
            try {
              console.log('[Journey] OnboardingAgent handoff detected, updating journey status for user:', dbUser.id);
              
              // Update journey status to move to Assessment phase and save onboarding data
              await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                journeyPhase: 'ASSESSMENT',
                journeyStatus: 'ACTIVE',
                currentAgent: 'AssessmentAgent',
                lastActivity: new Date(),
                onboardingData: {
                  extractedFields: context.metadata.onboarding?.capturedFields || {},
                  completedAt: new Date().toISOString()
                }
              }
            });
            
            // Update conversation to reflect the new agent
            await prisma.conversation.update({
              where: { id: context.conversationId },
              data: { currentAgent: 'AssessmentAgent' }
            });
            
            console.log('[Journey] Journey status updated to Assessment phase after OnboardingAgent handoff');
            
            // Create organization in Clerk if user is a manager and has organization name
            if (dbUser.role === 'MANAGER' && !dbUser.organizationId) {
              const orgName = context.metadata.onboarding?.capturedFields?.organization;
              
              if (orgName) {
                try {
                  const { clerkClient } = await import('@clerk/nextjs/server');
                  
                  // Create organization in Clerk
                  const organization = await clerkClient.organizations.createOrganization({
                    name: orgName,
                    slug: orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                    createdBy: user.id, // Clerk user ID
                  });
                  
                  // Add user as admin of the organization
                  await clerkClient.organizations.createOrganizationMembership({
                    organizationId: organization.id,
                    userId: user.id,
                    role: 'org:admin'
                  });
                  
                  // Update user in database with organizationId
                  await prisma.user.update({
                    where: { id: dbUser.id },
                    data: {
                      organizationId: organization.id,
                      organizationRole: 'org:admin'
                    }
                  });
                  
                  console.log('[Organization] Created organization for user:', {
                    userId: dbUser.id,
                    organizationId: organization.id,
                    organizationName: orgName
                  });
                } catch (error) {
                  console.error('[Organization] Failed to create organization:', error);
                }
              }
            }
            
            // Mark journey as updated to prevent duplicate updates
            context.metadata.journeyUpdated = true;
            await conversationStore.updateContext(context.conversationId, {
              metadata: context.metadata
            });
            } catch (error) {
              console.error('[Journey] Failed to update journey status on handoff:', error);
            }
          } else {
            console.log('[Journey] Handoff message detected but onboarding not yet complete');
          }
        }
        
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
            console.log('[Journey] All required fields captured, but waiting for conversation completion before updating journey status');
            
            // DO NOT update journey status here - wait for agent handoff
            // The journey should only transition to ASSESSMENT when:
            // 1. All fields are captured AND
            // 2. The OnboardingAgent has completed the full conversation flow
            // 3. The user has confirmed they're ready to proceed
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