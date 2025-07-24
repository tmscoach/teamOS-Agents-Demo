import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { ONBOARDING_STEPS } from '@/lib/orchestrator/journey-tracker';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Add proper admin role check
    // For now, we'll allow all authenticated users

    const { id: conversationId } = await params;

    // Fetch conversation with all related data
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        Message: {
          orderBy: {
            timestamp: 'asc'
          }
        },
        AgentEvent: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch team and manager details with retry logic
    let team, manager;
    let retries = 3;
    while (retries > 0) {
      try {
        [team, manager] = await Promise.all([
          prisma.team.findUnique({ where: { id: conversation.teamId } }),
          prisma.user.findUnique({ 
            where: { id: conversation.managerId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              journeyStatus: true,
              journeyPhase: true,
              currentAgent: true,
              completedSteps: true,
              completedAssessments: true,
              viewedDebriefs: true,
              teamSignalsEligible: true,
              lastActivity: true,
              onboardingData: true
            }
          })
        ]);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Extract metadata from contextData
    const contextData = conversation.contextData as Record<string, unknown>;
    const metadata = (contextData?.metadata as Record<string, unknown>) || {};

    // Calculate current step
    const completedSteps = manager?.completedSteps || [];
    const currentStep = ONBOARDING_STEPS
      .filter(step => !completedSteps.includes(step.id))
      .sort((a, b) => a.order - b.order)[0];

    // Transform the data
    const transformedConversation = {
      id: conversation.id,
      managerId: conversation.managerId,
      managerName: manager?.name || 'Unknown',
      teamId: conversation.teamId,
      teamName: team?.name || 'Unknown Team',
      currentAgent: conversation.currentAgent,
      messages: conversation.Message.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        agent: msg.agent
      })),
      metadata,
      events: conversation.AgentEvent.map(event => ({
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        agent: event.agent,
        data: event.metadata
      })),
      // Journey tracking data
      journeyStatus: manager?.journeyStatus || 'ONBOARDING',
      journeyPhase: conversation.phase || 'onboarding', // Add conversation phase
      userRole: manager?.role || 'MANAGER',
      completedSteps: manager?.completedSteps || [],
      currentStep: currentStep ? {
        id: currentStep.id,
        name: currentStep.name,
        order: currentStep.order
      } : null,
      lastActivity: manager?.lastActivity || conversation.updatedAt,
      onboardingData: manager?.onboardingData as Record<string, any> || {}
    };

    return NextResponse.json(transformedConversation);
  } catch (error) {
    console.error('Admin conversation detail API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}