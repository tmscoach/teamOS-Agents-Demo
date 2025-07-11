import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { ConversationState } from '@/src/lib/agents/implementations/onboarding-agent';
import { adminFilterSchema, validateRequest } from '@/src/lib/validation';
import { ONBOARDING_STEPS } from '@/lib/orchestrator/journey-tracker';

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
    const filters: Record<string, string> = {};
    
    // Only add filters that are actually provided
    const status = searchParams.get('status');
    const agentName = searchParams.get('agentName');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const managerId = searchParams.get('managerId');
    const teamId = searchParams.get('teamId');
    const journeyStatus = searchParams.get('journeyStatus');
    const inactiveDays = searchParams.get('inactiveDays');
    
    if (status) filters.status = status;
    if (agentName) filters.agentName = agentName;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (managerId) filters.managerId = managerId;
    if (teamId) filters.teamId = teamId;
    if (journeyStatus) filters.journeyStatus = journeyStatus;
    if (inactiveDays) filters.inactiveDays = inactiveDays;

    const validation = validateRequest(filters, adminFilterSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const validatedFilters = validation.data;

    // Build query conditions
    const where: Record<string, unknown> = {};
    
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
      const dateFilter: Record<string, Date> = {};
      if (validatedFilters.dateFrom) {
        dateFilter.gte = new Date(validatedFilters.dateFrom);
      }
      if (validatedFilters.dateTo) {
        dateFilter.lte = new Date(validatedFilters.dateTo);
      }
      where.createdAt = dateFilter;
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
      where: { id: { in: managerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        journeyStatus: true,
        currentAgent: true,
        completedSteps: true,
        lastActivity: true,
        onboardingData: true
      }
    });

    const teamMap = new Map(teams.map(t => [t.id, t]));
    const managerMap = new Map(managers.map(m => [m.id, m]));

    // Transform data for the frontend
    const transformedConversations = conversations.map(conv => {
      const contextData = conv.contextData as Record<string, unknown>;
      const metadata = contextData?.metadata as Record<string, unknown> | undefined;
      const onboardingData = metadata?.onboarding as {
        state?: string;
        qualityMetrics?: {
          completionPercentage?: number;
          rapportScore?: number;
          managerConfidence?: string;
        };
      } | undefined;
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

      // Calculate journey progress
      const completedSteps = manager?.completedSteps || [];
      const totalRequiredSteps = ONBOARDING_STEPS.filter(s => s.required).length;
      const journeyProgress = totalRequiredSteps > 0 
        ? Math.round((completedSteps.length / totalRequiredSteps) * 100)
        : 0;

      // Find current step
      const currentStep = ONBOARDING_STEPS
        .filter(step => !completedSteps.includes(step.id))
        .sort((a, b) => a.order - b.order)[0];
      
      // Calculate days since last activity
      const daysSinceActivity = Math.floor(
        (Date.now() - (manager?.lastActivity ? new Date(manager.lastActivity).getTime() : lastActivityTime.getTime())) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate hours since last activity for more granular view
      const hoursSinceActivity = Math.floor(
        (Date.now() - (manager?.lastActivity ? new Date(manager.lastActivity).getTime() : lastActivityTime.getTime())) / (1000 * 60 * 60)
      );

      return {
        id: conv.id,
        managerId: conv.managerId,
        managerName: manager?.name || 'Unknown',
        managerEmail: manager?.email || '',
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
        status,
        // Journey tracking data
        journeyStatus: manager?.journeyStatus || 'ONBOARDING',
        completedSteps,
        journeyProgress,
        currentStep: currentStep ? {
          id: currentStep.id,
          name: currentStep.name,
          order: currentStep.order
        } : null,
        daysSinceActivity,
        hoursSinceActivity,
        lastActivity: manager?.lastActivity || lastActivityTime
      };
    });

    // Apply additional filters for journey data
    let filteredConversations = transformedConversations;
    
    if (validatedFilters.journeyStatus) {
      filteredConversations = filteredConversations.filter(
        conv => conv.journeyStatus === validatedFilters.journeyStatus
      );
    }
    
    if (validatedFilters.inactiveDays) {
      const maxDays = parseInt(validatedFilters.inactiveDays);
      filteredConversations = filteredConversations.filter(
        conv => conv.daysSinceActivity >= maxDays
      );
    }

    return NextResponse.json({
      conversations: filteredConversations
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