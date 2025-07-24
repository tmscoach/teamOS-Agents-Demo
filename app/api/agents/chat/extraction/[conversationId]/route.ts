import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  let conversationId: string | undefined;
  
  try {
    // Handle both sync and async params (Next.js 15 change)
    const resolvedParams = await Promise.resolve(params);
    conversationId = resolvedParams.conversationId;
    
    console.log('Extraction endpoint called for conversation:', conversationId);
    
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversation with context
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        contextData: true,
        metadata: true,
        managerId: true,
        currentAgent: true
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check access - verify user owns this conversation
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });
    
    // If user doesn't exist in database, create them (for new sign-ups)
    if (!dbUser) {
      const userEmail = user.emailAddresses?.[0]?.emailAddress || `${user.id}@demo.com`;
      
      // First check if a user with this email already exists
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, clerkId: true }
      });
      
      if (existingUserByEmail) {
        // Update the existing user with the new clerkId if it's different
        if (existingUserByEmail.clerkId !== user.id) {
          dbUser = await prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: { clerkId: user.id },
            select: { id: true }
          });
          console.log('Updated existing user with new clerkId:', dbUser.id);
        } else {
          dbUser = existingUserByEmail;
        }
      } else {
        // Create new user
        dbUser = await prisma.user.create({
          data: {
            id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            clerkId: user.id,
            email: userEmail,
            name: user.fullName || user.firstName || userEmail.split('@')[0] || 'Demo User',
            role: 'MANAGER',
            journeyStatus: 'ONBOARDING',
            journeyPhase: 'ONBOARDING',
            updatedAt: new Date()
          },
          select: { id: true }
        });
        console.log('Created new user in database:', dbUser.id);
      }
    }
    
    if (conversation.managerId !== dbUser.id) {
      console.error('Access denied:', {
        managerId: conversation.managerId,
        userId: dbUser.id
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Extract onboarding data from contextData
    const context = conversation.contextData as any;
    const contextMetadata = context?.metadata?.onboarding || {};
    const conversationMetadata = conversation.metadata as any || {};
    
    // Merge metadata from both sources (context takes precedence)
    const metadata = { ...conversationMetadata.onboarding, ...contextMetadata };
    const extractedData = metadata.capturedFields || {};
    
    // Calculate onboarding state
    const requiredFieldsStatus = metadata.requiredFieldsStatus || {};
    
    // Get the actual required fields count from the status object
    // This should contain all required fields (both captured and not captured)
    const requiredFieldsCount = Object.keys(requiredFieldsStatus).length;
    const capturedFieldsCount = requiredFieldsCount > 0 
      ? Object.values(requiredFieldsStatus).filter(Boolean).length 
      : 0;
    
    // If requiredFieldsStatus is empty, we need to initialize it properly
    // This handles cases where the conversation was created before the fix
    const onboardingState = {
      isComplete: metadata.isComplete || false,
      requiredFieldsCount: requiredFieldsCount || 4, // Fallback to known count
      capturedFieldsCount
    };

    // Get the latest message from the conversation to determine suggested values
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: 2 // Get last agent message and user message
    });
    
    let suggestedValues = null;
    
    // If the latest message is from the agent, check if it's asking about a field with suggestions
    const latestAgentMessage = messages.find(m => m.role === 'assistant');
    if (latestAgentMessage && latestAgentMessage.content) {
      // Import the helper function inline to avoid circular dependencies
      const { AgentConfigLoader } = await import('@/src/lib/agents/config/agent-config-loader');
      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      if (config && config.extractionRules) {
        const extractionRules = config.extractionRules as Record<string, any>;
        
        // Define field patterns (same as in streaming route)
        const fieldPatterns: Record<string, RegExp[]> = {
          user_role: [
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
          ]
        };
        
        // Find which field the agent is asking about
        let currentField: string | null = null;
        for (const [field, patterns] of Object.entries(fieldPatterns)) {
          if (patterns.some(pattern => pattern.test(latestAgentMessage.content))) {
            currentField = field;
            break;
          }
        }
        
        // If a field was identified and it has suggested values, include them
        // BUT only if onboarding is not complete AND we're in OnboardingAgent
        const onboardingMetadata = context?.metadata?.onboarding || {};
        const currentAgent = conversation.currentAgent || context?.currentAgent;
        if (!onboardingMetadata.isComplete && currentAgent === 'OnboardingAgent' && currentField && extractionRules[currentField]) {
          const rule = extractionRules[currentField];
          if (rule.suggestedValues && rule.suggestedValues.length > 0) {
            suggestedValues = {
              field: currentField,
              values: rule.suggestedValues,
              helpText: rule.helpText || `Here are some options for ${currentField.replace(/_/g, ' ')}:`
            };
          }
        }
      }
    }
    
    return NextResponse.json({
      extractedData,
      onboardingState,
      currentAgent: conversation.currentAgent || context?.currentAgent,
      metadata: {
        suggestedValues
      }
    });
  } catch (error) {
    console.error('Error fetching extraction data:', {
      error,
      conversationId: conversationId || 'unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}