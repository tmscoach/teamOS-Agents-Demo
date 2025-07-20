import { PrismaClient } from '@/lib/generated/prisma';
import { 
  OrganizationContext, 
  buildOrganizationWhere,
  canAccessResource 
} from '@/lib/auth/organization';

// Initialize Prisma client
const prisma = new PrismaClient();

// Types for return values
export interface OrganizationOverview {
  organizationId: string | null;
  totalTeams: number;
  totalMembers: number;
  activeAssessments: number;
  pendingInvitations: number;
  completionRate: number;
  lastActivityDate: Date | null;
}

export interface TeamDetails {
  id: string;
  name: string;
  memberCount: number;
  managerName: string | null;
  assessmentProgress: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  createdAt: Date;
}

export interface AssessmentStatus {
  totalAssessments: number;
  byType: Record<string, {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  }>;
  byTeam: Record<string, {
    teamName: string;
    total: number;
    completed: number;
  }>;
  recentActivity: Array<{
    userId: string;
    userName: string;
    assessmentType: string;
    status: string;
    updatedAt: Date;
  }>;
}

export interface InvitationStatus {
  totalSent: number;
  accepted: number;
  pending: number;
  expired: number;
  acceptanceRate: number;
  pendingInvitations: Array<{
    email: string;
    teamName: string;
    sentAt: Date;
    expiresAt: Date;
  }>;
}

export interface JourneyProgress {
  userId: string;
  userName: string;
  currentPhase: string;
  currentStatus: string;
  completedSteps: string[];
  nextStep: string | null;
  lastActivity: Date;
  assessments: Record<string, {
    status: string;
    completedAt?: Date;
  }>;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
  assessmentStatus: Record<string, string>;
  lastActive: Date;
}

/**
 * Service for accessing organization-scoped data
 * Enforces organization boundaries and role-based access
 */
export class OrganizationDataService {
  /**
   * Get high-level organization overview
   */
  async getOrganizationOverview(
    context: OrganizationContext
  ): Promise<OrganizationOverview> {
    // Build organization-scoped where clause
    const orgWhere = buildOrganizationWhere(context);

    // Get team count
    const totalTeams = await prisma.team.count({
      where: orgWhere
    });

    // Get member count
    const totalMembers = await prisma.user.count({
      where: {
        ...orgWhere,
        role: 'TEAM_MEMBER'
      }
    });

    // Get active assessments (simplified for now - will expand with TMS integration)
    const usersWithAssessments = await prisma.user.findMany({
      where: orgWhere,
      select: {
        completedAssessments: true,
        lastActivity: true
      }
    });

    // Calculate metrics
    let activeAssessments = 0;
    let completedAssessments = 0;
    let lastActivity: Date | null = null;

    usersWithAssessments.forEach(user => {
      if (user.completedAssessments && typeof user.completedAssessments === 'object') {
        const assessments = user.completedAssessments as Record<string, any>;
        Object.values(assessments).forEach((assessment: any) => {
          if (assessment.status === 'in_progress') activeAssessments++;
          if (assessment.status === 'completed') completedAssessments++;
        });
      }
      
      if (user.lastActivity && (!lastActivity || user.lastActivity > lastActivity)) {
        lastActivity = user.lastActivity;
      }
    });

    // Get pending invitations (placeholder - will implement with invitation system)
    const pendingInvitations = 0; // TODO: Implement when invitation system is ready

    // Calculate completion rate
    const totalAssessments = activeAssessments + completedAssessments;
    const completionRate = totalAssessments > 0 
      ? completedAssessments / totalAssessments 
      : 0;

    return {
      organizationId: context.organizationId,
      totalTeams,
      totalMembers,
      activeAssessments,
      pendingInvitations,
      completionRate,
      lastActivityDate: lastActivity
    };
  }

  /**
   * Get list of teams in the organization
   */
  async getTeamList(context: OrganizationContext): Promise<TeamDetails[]> {
    const teams = await prisma.team.findMany({
      where: buildOrganizationWhere(context),
      include: {
        manager: {
          select: {
            name: true
          }
        },
        members: {
          select: {
            id: true,
            completedAssessments: true
          }
        }
      }
    });

    return teams.map(team => {
      // Calculate assessment progress for the team
      let total = 0;
      let completed = 0;
      let inProgress = 0;

      team.members.forEach(member => {
        if (member.completedAssessments && typeof member.completedAssessments === 'object') {
          const assessments = member.completedAssessments as Record<string, any>;
          Object.values(assessments).forEach((assessment: any) => {
            total++;
            if (assessment.status === 'completed') completed++;
            else if (assessment.status === 'in_progress') inProgress++;
          });
        }
      });

      return {
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
        managerName: team.manager?.name || null,
        assessmentProgress: {
          total,
          completed,
          inProgress,
          notStarted: total - completed - inProgress
        },
        createdAt: team.createdAt
      };
    });
  }

  /**
   * Get detailed team information
   */
  async getTeamDetails(
    context: OrganizationContext, 
    teamId: string
  ): Promise<TeamDetails | null> {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        ...buildOrganizationWhere(context)
      },
      include: {
        manager: {
          select: {
            name: true
          }
        },
        members: {
          select: {
            id: true,
            completedAssessments: true
          }
        }
      }
    });

    if (!team) return null;

    // Check access permission
    const hasAccess = await canAccessResource(
      context, 
      team.organizationId
    );
    
    if (!hasAccess) return null;

    // Calculate assessment progress
    let total = 0;
    let completed = 0;
    let inProgress = 0;

    team.members.forEach(member => {
      if (member.completedAssessments && typeof member.completedAssessments === 'object') {
        const assessments = member.completedAssessments as Record<string, any>;
        Object.values(assessments).forEach((assessment: any) => {
          total++;
          if (assessment.status === 'completed') completed++;
          else if (assessment.status === 'in_progress') inProgress++;
        });
      }
    });

    return {
      id: team.id,
      name: team.name,
      memberCount: team.members.length,
      managerName: team.manager?.name || null,
      assessmentProgress: {
        total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress
      },
      createdAt: team.createdAt
    };
  }

  /**
   * Get assessment status across the organization
   */
  async getAssessmentStatus(
    context: OrganizationContext,
    options?: {
      teamId?: string;
      assessmentType?: 'TMP' | 'QO2' | 'WOW' | 'LLP';
    }
  ): Promise<AssessmentStatus> {
    // Build query filters
    const where: any = buildOrganizationWhere(context);
    if (options?.teamId) {
      where.teamId = options.teamId;
    }

    // Get users with their assessments and team info
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        completedAssessments: true,
        team: {
          select: {
            id: true,
            name: true
          }
        },
        lastActivity: true
      },
      orderBy: {
        lastActivity: 'desc'
      },
      take: 100 // Limit for performance
    });

    // Process assessment data
    const byType: Record<string, any> = {
      TMP: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
      QO2: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
      WOW: { total: 0, completed: 0, inProgress: 0, notStarted: 0 },
      LLP: { total: 0, completed: 0, inProgress: 0, notStarted: 0 }
    };

    const byTeam: Record<string, any> = {};
    const recentActivity: any[] = [];
    let totalAssessments = 0;

    users.forEach(user => {
      if (!user.team) return;

      // Initialize team entry if needed
      if (!byTeam[user.team.id]) {
        byTeam[user.team.id] = {
          teamName: user.team.name,
          total: 0,
          completed: 0
        };
      }

      // Process user's assessments
      if (user.completedAssessments && typeof user.completedAssessments === 'object') {
        const assessments = user.completedAssessments as Record<string, any>;
        
        Object.entries(assessments).forEach(([type, assessment]: [string, any]) => {
          if (options?.assessmentType && type !== options.assessmentType) return;
          
          if (byType[type]) {
            totalAssessments++;
            byType[type].total++;
            byTeam[user.team!.id].total++;
            
            if (assessment.status === 'completed') {
              byType[type].completed++;
              byTeam[user.team!.id].completed++;
            } else if (assessment.status === 'in_progress') {
              byType[type].inProgress++;
            } else {
              byType[type].notStarted++;
            }

            // Add to recent activity
            if (recentActivity.length < 10) {
              recentActivity.push({
                userId: user.id,
                userName: user.name || 'Unknown',
                assessmentType: type,
                status: assessment.status,
                updatedAt: assessment.updatedAt || user.lastActivity
              });
            }
          }
        });
      }
    });

    return {
      totalAssessments,
      byType,
      byTeam,
      recentActivity
    };
  }

  /**
   * Get user journey progress
   */
  async getUserJourneyProgress(
    context: OrganizationContext,
    userId?: string
  ): Promise<JourneyProgress | null> {
    // If specific user requested, validate access
    const targetUserId = userId || context.userId;
    
    const user = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        ...buildOrganizationWhere(context)
      },
      select: {
        id: true,
        name: true,
        journeyPhase: true,
        journeyStatus: true,
        completedSteps: true,
        lastActivity: true,
        completedAssessments: true,
        role: true,
        teamId: true
      }
    });

    if (!user) return null;

    // Check access - team members can only see their own progress
    if (context.userRole === 'TEAM_MEMBER' && user.id !== context.userId) {
      return null;
    }

    // Format assessments
    const assessments: Record<string, any> = {};
    if (user.completedAssessments && typeof user.completedAssessments === 'object') {
      const completedAssessments = user.completedAssessments as Record<string, any>;
      Object.entries(completedAssessments).forEach(([type, data]) => {
        assessments[type] = {
          status: data.status || 'not_started',
          completedAt: data.completedAt
        };
      });
    }

    // Determine next step based on journey phase
    let nextStep = null;
    if (user.journeyPhase === 'ONBOARDING') {
      nextStep = 'Complete onboarding conversation';
    } else if (user.journeyPhase === 'ASSESSMENT') {
      if (!assessments.TMP || assessments.TMP.status !== 'completed') {
        nextStep = 'Complete TMP assessment';
      } else {
        nextStep = 'View TMP debrief';
      }
    } else if (user.journeyPhase === 'DEBRIEF') {
      nextStep = 'Review assessment results with team';
    }

    return {
      userId: user.id,
      userName: user.name || 'Unknown',
      currentPhase: user.journeyPhase,
      currentStatus: user.journeyStatus,
      completedSteps: user.completedSteps,
      nextStep,
      lastActivity: user.lastActivity,
      assessments
    };
  }

  /**
   * Get team member list with details
   */
  async getMemberList(
    context: OrganizationContext,
    teamId?: string
  ): Promise<TeamMember[]> {
    const where: any = {
      ...buildOrganizationWhere(context),
      role: 'TEAM_MEMBER'
    };

    if (teamId) {
      where.teamId = teamId;
    }

    // For team members, only show their own team
    if (context.userRole === 'TEAM_MEMBER') {
      where.teamId = { in: context.teamIds };
    }

    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastActivity: true,
        completedAssessments: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return members.map(member => {
      // Format assessment status
      const assessmentStatus: Record<string, string> = {};
      if (member.completedAssessments && typeof member.completedAssessments === 'object') {
        const assessments = member.completedAssessments as Record<string, any>;
        Object.entries(assessments).forEach(([type, data]) => {
          assessmentStatus[type] = data.status || 'not_started';
        });
      }

      return {
        id: member.id,
        name: member.name || 'Unknown',
        email: member.email,
        role: member.role,
        joinedAt: member.createdAt,
        assessmentStatus,
        lastActive: member.lastActivity
      };
    });
  }

  /**
   * Get invitation status (placeholder for future implementation)
   */
  async getInvitationStatus(
    context: OrganizationContext,
    teamId?: string
  ): Promise<InvitationStatus> {
    // TODO: Implement when invitation system is ready
    // For now, return mock data structure
    return {
      totalSent: 0,
      accepted: 0,
      pending: 0,
      expired: 0,
      acceptanceRate: 0,
      pendingInvitations: []
    };
  }
}

// Export singleton instance
export const organizationDataService = new OrganizationDataService();