import { PrismaClient } from '@/lib/generated/prisma'
import { JourneyPhase } from '@/lib/orchestrator/journey-phases'

interface ContinuityState {
  userId: string
  lastActivity: Date
  lastPhase: JourneyPhase
  lastAgent?: string
  lastConversationId?: string
  pendingAction?: {
    type: 'assessment_selection' | 'assessment_in_progress' | 'debrief_pending'
    data: any
  }
  metadata?: Record<string, any>
}

export class ContinuityService {
  private prisma: PrismaClient
  private readonly CONTINUITY_WINDOW = 24 * 60 * 60 * 1000 // 24 hours
  
  constructor() {
    this.prisma = new PrismaClient()
  }
  
  /**
   * Check if user has recent activity that can be continued
   */
  async checkContinuity(userId: string): Promise<ContinuityState | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          lastActivity: true,
          journeyPhase: true,
          currentAgent: true,
          onboardingData: true,
          completedAssessments: true,
          conversations: {
            where: {
              status: 'ACTIVE'
            },
            orderBy: {
              updatedAt: 'desc'
            },
            take: 1,
            select: {
              id: true,
              metadata: true,
              context: true
            }
          }
        }
      })
      
      if (!user || !user.lastActivity) {
        return null
      }
      
      // Check if activity is within continuity window
      const timeSinceActivity = Date.now() - user.lastActivity.getTime()
      if (timeSinceActivity > this.CONTINUITY_WINDOW) {
        return null
      }
      
      // Build continuity state
      const state: ContinuityState = {
        userId,
        lastActivity: user.lastActivity,
        lastPhase: user.journeyPhase as JourneyPhase,
        lastAgent: user.currentAgent || undefined,
        lastConversationId: user.conversations[0]?.id
      }
      
      // Check for pending actions based on journey phase
      if (user.journeyPhase === JourneyPhase.ASSESSMENT) {
        const assessments = user.completedAssessments as Record<string, any> || {}
        
        // Check for in-progress assessments
        for (const [key, value] of Object.entries(assessments)) {
          if (value && typeof value === 'object' && value.status === 'in_progress') {
            state.pendingAction = {
              type: 'assessment_in_progress',
              data: {
                assessmentType: key,
                subscriptionId: value.subscriptionId,
                progress: value.progress || 0
              }
            }
            break
          }
        }
        
        // If no assessments started, suggest starting one
        if (!state.pendingAction && Object.keys(assessments).length === 0) {
          state.pendingAction = {
            type: 'assessment_selection',
            data: {
              availableAssessments: ['TMP', 'TeamSignals']
            }
          }
        }
      } else if (user.journeyPhase === JourneyPhase.DEBRIEF) {
        // Check for unviewed debriefs
        const completedAssessments = Object.keys(user.completedAssessments || {})
        if (completedAssessments.length > 0) {
          state.pendingAction = {
            type: 'debrief_pending',
            data: {
              assessmentType: completedAssessments[0]
            }
          }
        }
      }
      
      // Add conversation metadata if available
      const lastConversation = user.conversations[0]
      if (lastConversation) {
        state.metadata = {
          conversationContext: lastConversation.context,
          conversationMetadata: lastConversation.metadata
        }
      }
      
      return state
    } catch (error) {
      console.error('[ContinuityService] Error checking continuity:', error)
      return null
    }
  }
  
  /**
   * Update user's last activity timestamp
   */
  async updateActivity(userId: string, agent?: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastActivity: new Date(),
          ...(agent && { currentAgent: agent })
        }
      })
    } catch (error) {
      console.error('[ContinuityService] Error updating activity:', error)
    }
  }
  
  /**
   * Generate continuity message based on state
   */
  generateContinuityMessage(state: ContinuityState): string {
    const hoursSinceActivity = Math.floor(
      (Date.now() - state.lastActivity.getTime()) / (1000 * 60 * 60)
    )
    
    let timeAgo = 'earlier today'
    if (hoursSinceActivity >= 24) {
      timeAgo = 'yesterday'
    } else if (hoursSinceActivity > 1) {
      timeAgo = `${hoursSinceActivity} hours ago`
    } else if (hoursSinceActivity === 1) {
      timeAgo = 'an hour ago'
    }
    
    let message = `Welcome back! I see you were here ${timeAgo}.`
    
    if (state.pendingAction) {
      switch (state.pendingAction.type) {
        case 'assessment_in_progress':
          const { assessmentType, progress } = state.pendingAction.data
          message += ` You were ${progress}% through your ${assessmentType} assessment. Would you like to continue where you left off?`
          break
          
        case 'assessment_selection':
          message += ` You were looking at starting an assessment. Ready to choose one now?`
          break
          
        case 'debrief_pending':
          const { assessmentType: debriefType } = state.pendingAction.data
          message += ` Your ${debriefType} assessment results are ready! Would you like to review them?`
          break
      }
    } else {
      // Generic continuity based on phase
      switch (state.lastPhase) {
        case JourneyPhase.ASSESSMENT:
          message += ` How can I help you with your assessments today?`
          break
        case JourneyPhase.CONTINUOUS_ENGAGEMENT:
          message += ` How's your team transformation going?`
          break
        default:
          message += ` What would you like to work on today?`
      }
    }
    
    return message
  }
  
  /**
   * Clear continuity state (e.g., after completing an action)
   */
  async clearContinuity(userId: string): Promise<void> {
    // For now, just update lastActivity
    // In future, might clear specific pending actions
    await this.updateActivity(userId)
  }
}

// Singleton instance
export const continuityService = new ContinuityService()