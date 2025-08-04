import { PrismaClient } from '@prisma/client';
import { JourneyPhase, UserRole } from '@/lib/orchestrator/journey-phases';

export interface JourneyProgressionResult {
  success: boolean;
  previousPhase: JourneyPhase;
  newPhase: JourneyPhase;
  message: string;
}

export class JourneyProgressionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check and update user's journey phase based on triggers
   */
  async checkAndUpdatePhase(
    userId: string,
    trigger: 'onboarding_complete' | 'assessment_complete' | 'debrief_viewed' | 'team_assessment_started'
  ): Promise<JourneyProgressionResult> {
    try {
      // Get current user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          journeyPhase: true,
          role: true,
          completedSteps: true,
          completedAssessments: true,
          viewedDebriefs: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const currentPhase = user.journeyPhase as JourneyPhase || JourneyPhase.ONBOARDING;
      let newPhase = currentPhase;
      let message = '';

      // Determine new phase based on trigger and current state
      switch (trigger) {
        case 'onboarding_complete':
          if (currentPhase === JourneyPhase.ONBOARDING) {
            newPhase = JourneyPhase.ASSESSMENT;
            message = 'Welcome to the Assessment phase! Time to complete your first profile.';
          }
          break;

        case 'assessment_complete':
          if (currentPhase === JourneyPhase.ASSESSMENT) {
            // Check if user has completed at least TMP
            const completedAssessments = user.completedAssessments as Record<string, any> || {};
            if (completedAssessments.TMP || completedAssessments.tmp) {
              newPhase = JourneyPhase.DEBRIEF;
              message = 'Great job completing your assessment! Ready to review your results.';
            }
          }
          break;

        case 'debrief_viewed':
          if (currentPhase === JourneyPhase.DEBRIEF) {
            // For managers, move to team assessment phase (which doesn't exist in enum yet)
            // For now, move to CONTINUOUS_ENGAGEMENT
            if (user.role === UserRole.MANAGER) {
              newPhase = JourneyPhase.CONTINUOUS_ENGAGEMENT;
              message = 'You\'ve reviewed your results! Now you can invite your team.';
            } else {
              newPhase = JourneyPhase.CONTINUOUS_ENGAGEMENT;
              message = 'You\'ve completed your initial journey!';
            }
          }
          break;

        case 'team_assessment_started':
          // This would be used when a manager invites team members
          if (currentPhase === JourneyPhase.DEBRIEF || currentPhase === JourneyPhase.CONTINUOUS_ENGAGEMENT) {
            newPhase = JourneyPhase.CONTINUOUS_ENGAGEMENT;
            message = 'Your team transformation is underway!';
          }
          break;
      }

      // Update phase if changed
      if (newPhase !== currentPhase) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            journeyPhase: newPhase,
            journeyStatus: 'ACTIVE' // Ensure status is active
          }
        });

        // Log the phase transition (we'll create the JourneyEvent table later)
        console.log(`[JourneyProgression] User ${userId} progressed from ${currentPhase} to ${newPhase}`);
      }

      return {
        success: true,
        previousPhase: currentPhase,
        newPhase,
        message
      };
    } catch (error) {
      console.error('[JourneyProgression] Error updating phase:', error);
      return {
        success: false,
        previousPhase: JourneyPhase.ONBOARDING,
        newPhase: JourneyPhase.ONBOARDING,
        message: 'Failed to update journey phase'
      };
    }
  }

  /**
   * Get user's current journey context for proactive messages
   */
  async getUserJourneyContext(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          journeyPhase: true,
          role: true,
          completedSteps: true,
          completedAssessments: true,
          viewedDebriefs: true,
          lastActivity: true,
          Team_User_teamIdToTeam: {
            select: {
              User_User_teamIdToTeam: {
                select: {
                  id: true,
                  journeyPhase: true
                }
              }
            }
          }
        }
      });

      if (!user) return null;

      const phase = user.journeyPhase as JourneyPhase || JourneyPhase.ONBOARDING;
      const completedAssessments = user.completedAssessments as Record<string, any> || {};
      const viewedDebriefs = user.viewedDebriefs as Record<string, any> || {};
      const teamMembers = user.Team_User_teamIdToTeam?.User_User_teamIdToTeam || [];
      
      // Calculate days since last activity
      const daysSinceLastActivity = user.lastActivity 
        ? Math.floor((Date.now() - new Date(user.lastActivity).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        phase,
        role: user.role,
        completedAssessments: Object.keys(completedAssessments),
        viewedDebriefs: Object.keys(viewedDebriefs),
        teamSize: teamMembers.length,
        teamMembersInAssessment: teamMembers.filter((m: any) => m.journeyPhase === JourneyPhase.ASSESSMENT).length,
        daysSinceLastActivity,
        hasCompletedTMP: !!completedAssessments.TMP || !!completedAssessments.tmp,
        hasViewedTMPDebrief: !!viewedDebriefs.TMP || !!viewedDebriefs.tmp
      };
    } catch (error) {
      console.error('[JourneyProgression] Error getting journey context:', error);
      return null;
    }
  }

  /**
   * Generate proactive message based on user's journey context
   */
  generateProactiveMessage(context: any): string | null {
    if (!context) return null;

    const { phase, role, hasCompletedTMP, hasViewedTMPDebrief, daysSinceLastActivity, teamSize } = context;

    // Phase-specific messages
    if (phase === JourneyPhase.ONBOARDING) {
      return "Welcome! I'm here to guide you through your team transformation journey. Let's start by getting to know you and your team.";
    }

    if (phase === JourneyPhase.ASSESSMENT) {
      if (!hasCompletedTMP) {
        if (daysSinceLastActivity > 2) {
          return "Welcome back! I noticed you haven't completed your Team Management Profile yet. It only takes about 20 minutes and unlocks 5,000 credits. Ready to start?";
        }
        return "Welcome! Your next step is completing your Team Management Profile (TMP). This 20-minute assessment helps us understand your management style and earns you 5,000 credits.";
      }
      return "Great progress! You've completed your TMP. Check out your results when you're ready.";
    }

    if (phase === JourneyPhase.DEBRIEF) {
      if (!hasViewedTMPDebrief) {
        return "Your Team Management Profile results are ready! Let's explore your management style insights together.";
      }
      if (role === UserRole.MANAGER && teamSize === 0) {
        return "You've reviewed your results! Next step: invite your team members to start their assessments.";
      }
      return "You've completed your initial assessments. Ready to take the next step in your transformation journey?";
    }

    if (phase === JourneyPhase.CONTINUOUS_ENGAGEMENT) {
      if (role === UserRole.MANAGER) {
        return `Welcome back! You're managing a team of ${teamSize}. Use the dashboard to track progress and guide your team's development.`;
      }
      return "Welcome back! Continue your development journey with regular check-ins and new assessments.";
    }

    return null;
  }
}

// Export singleton instance
export const journeyProgressionService = new JourneyProgressionService();