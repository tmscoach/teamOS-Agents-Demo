import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { ConversationState } from '@/src/lib/agents/implementations/onboarding-agent';
import { adminFilterSchema, validateRequest } from '@/src/lib/validation';

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

    // Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const filters: any = {};
    
    // Only add filters that are actually provided
    if (searchParams.get('status')) filters.status = searchParams.get('status');
    if (searchParams.get('agentName')) filters.agentName = searchParams.get('agentName');
    if (searchParams.get('dateFrom')) filters.dateFrom = searchParams.get('dateFrom');
    if (searchParams.get('dateTo')) filters.dateTo = searchParams.get('dateTo');
    if (searchParams.get('managerId')) filters.managerId = searchParams.get('managerId');
    if (searchParams.get('teamId')) filters.teamId = searchParams.get('teamId');

    const validation = validateRequest(filters, adminFilterSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const validatedFilters = validation.data;

    // Build query conditions
    const where: any = {};
    
    if (validatedFilters.agentName) {
      where.currentAgent = validatedFilters.agentName;
    }
    
    if (validatedFilters.managerId) {
      where.managerId = validatedFilters.managerId;
    }
    
    if (validatedFilters.teamId) {
      where.teamId = validatedFilters.teamId;
    }
    
    if (validatedFilters.dateFrom || validatedFilters.dateTo) {
      where.createdAt = {};
      if (validatedFilters.dateFrom) {
        where.createdAt.gte = new Date(validatedFilters.dateFrom);
      }
      if (validatedFilters.dateTo) {
        where.createdAt.lte = new Date(validatedFilters.dateTo);
      }
    }

    // Fetch conversations with aggregated data
    let conversations;
    try {
      conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 100 // Limit results
      });
    } catch (dbError) {
      console.error('Database error fetching conversations:', dbError);
      // Return empty array if database is not available
      return NextResponse.json({
        conversations: []
      });
    }

    // Fetch teams and managers separately
    const teamIds = [...new Set(conversations.map(c => c.teamId))];
    const managerIds = [...new Set(conversations.map(c => c.managerId))];

    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } }
    });

    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds } }
    });

    const teamMap = new Map(teams.map(t => [t.id, t]));
    const managerMap = new Map(managers.map(m => [m.id, m]));

    // Transform data for the frontend
    const transformedConversations = conversations.map(conv => {
      const contextData = conv.contextData as any;
      const metadata = contextData?.metadata;
      const onboardingData = metadata?.onboarding;
      const lastMessage = conv.messages[0];
      const team = teamMap.get(conv.teamId);
      const manager = managerMap.get(conv.managerId);
      
      // Determine status based on last activity
      const lastActivityTime = lastMessage?.timestamp || conv.updatedAt;
      const minutesSinceActivity = (Date.now() - lastActivityTime.getTime()) / 60000;
      let status: 'active' | 'completed' | 'abandoned' = 'active';
      
      if (onboardingData?.state === ConversationState.RECAP_AND_HANDOFF) {
        status = 'completed';
      } else if (minutesSinceActivity > 60) { // 1 hour inactive
        status = 'abandoned';
      }

      // Count total messages
      const messageCount = conv.messages.length;

      return {
        id: conv.id,
        managerId: conv.managerId,
        managerName: manager?.name || 'Unknown',
        teamId: conv.teamId,
        teamName: team?.name || 'Unknown Team',
        currentAgent: conv.currentAgent,
        state: onboardingData?.state || ConversationState.GREETING,
        startTime: conv.createdAt,
        lastMessageTime: lastActivityTime,
        messageCount,
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