import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { ConversationState } from '@/src/lib/agents/implementations/onboarding-agent';

export async function GET(req: NextRequest) {
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

    // Fetch conversations with aggregated data
    const conversations = await prisma.conversation.findMany({
      include: {
        team: true,
        manager: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform data for the frontend
    const transformedConversations = conversations.map(conv => {
      const metadata = conv.metadata as any;
      const onboardingData = metadata?.onboarding;
      const lastMessage = conv.messages[0];
      
      // Determine status based on last activity
      const lastActivityTime = lastMessage?.createdAt || conv.updatedAt;
      const minutesSinceActivity = (Date.now() - lastActivityTime.getTime()) / 60000;
      let status: 'active' | 'completed' | 'abandoned' = 'active';
      
      if (onboardingData?.state === ConversationState.RECAP_AND_HANDOFF) {
        status = 'completed';
      } else if (minutesSinceActivity > 60) { // 1 hour inactive
        status = 'abandoned';
      }

      return {
        id: conv.id,
        managerId: conv.managerId,
        managerName: conv.manager.name || 'Unknown',
        teamId: conv.teamId,
        teamName: conv.team.name,
        currentAgent: conv.currentAgent,
        state: onboardingData?.state || ConversationState.GREETING,
        startTime: conv.createdAt,
        lastMessageTime: lastActivityTime,
        messageCount: conv._count.messages,
        completionPercentage: onboardingData?.qualityMetrics?.completionPercentage || 0,
        rapportScore: onboardingData?.qualityMetrics?.rapportScore || 0,
        managerConfidence: onboardingData?.qualityMetrics?.managerConfidence || 'low',
        status
      };
    });

    return NextResponse.json({
      conversations: transformedConversations
    });
  } catch (error) {
    console.error('Admin conversations API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}