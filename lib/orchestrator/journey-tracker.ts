import prisma from '@/lib/db'
import { 
  JourneyPhase, 
  UserRole, 
  JourneyStep, 
  JOURNEY_STEPS,
  getStepsForRole,
  getNextStep,
  getCurrentPhase,
  mapLegacyStatusToPhase
} from './journey-phases'

// Re-export for backward compatibility
export type { JourneyStep }
export const ONBOARDING_STEPS = JOURNEY_STEPS // Temporary backward compatibility

export class JourneyTracker {
  constructor(private userId: string, private userRole?: UserRole) {}

  async getCurrentJourney() {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: {
        journeyStatus: true,
        journeyPhase: true,
        currentAgent: true,
        completedSteps: true,
        completedAssessments: true,
        viewedDebriefs: true,
        teamSignalsEligible: true,
        onboardingData: true,
        lastActivity: true,
        role: true
      }
    })

    if (!user) throw new Error('User not found')

    // Get user role (use provided role or fetch from DB)
    const role = this.userRole || (user.role as UserRole)
    
    // Use journeyPhase directly from DB
    const currentPhase = user.journeyPhase as JourneyPhase
    
    // Get next step based on role
    const nextStep = getNextStep(user.completedSteps, role, currentPhase)

    return {
      status: user.journeyStatus, // Keep for backward compatibility
      currentPhase,
      currentAgent: user.currentAgent,
      completedSteps: user.completedSteps,
      completedAssessments: (user.completedAssessments as Record<string, any>) || {},
      viewedDebriefs: (user.viewedDebriefs as Record<string, any>) || {},
      teamSignalsEligible: user.teamSignalsEligible,
      onboardingData: user.onboardingData as Record<string, any> || {},
      lastActivity: user.lastActivity,
      nextStep,
      role
    }
  }

  async updateJourneyProgress(stepId: string, data?: Record<string, any>) {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { 
        completedSteps: true, 
        onboardingData: true,
        role: true,
        journeyPhase: true
      }
    })

    if (!user) throw new Error('User not found')

    const completedSteps = user.completedSteps || []
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId)
    }

    const onboardingData = (user.onboardingData as Record<string, any>) || {}
    if (data) {
      onboardingData[stepId] = data
    }

    const role = this.userRole || (user.role as UserRole) || UserRole.MANAGER
    
    // Determine current phase based on completed steps
    const currentPhase = getCurrentPhase(completedSteps, role)
    
    // Legacy status for backward compatibility
    let journeyStatus: 'ONBOARDING' | 'ACTIVE' | 'DORMANT' = 'ONBOARDING'
    if (currentPhase === JourneyPhase.ONBOARDING) {
      journeyStatus = 'ONBOARDING'
    } else if (currentPhase === JourneyPhase.CONTINUOUS_ENGAGEMENT) {
      journeyStatus = 'DORMANT'
    } else {
      journeyStatus = 'ACTIVE'
    }

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        completedSteps,
        onboardingData,
        journeyPhase: currentPhase,
        journeyStatus, // Keep for backward compatibility
        lastActivity: new Date()
      }
    })
  }

  async setCurrentAgent(agentName: string) {
    await prisma.user.update({
      where: { id: this.userId },
      data: {
        currentAgent: agentName,
        lastActivity: new Date()
      }
    })
  }

  async completeOnboarding() {
    // This method is called when onboarding phase is complete
    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyPhase: JourneyPhase.ASSESSMENT,
        journeyStatus: 'ACTIVE', // Legacy field
        currentAgent: 'AssessmentAgent',
        lastActivity: new Date()
      }
    })
  }

  async pauseJourney() {
    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyPhase: JourneyPhase.CONTINUOUS_ENGAGEMENT,
        journeyStatus: 'DORMANT', // Legacy field
        lastActivity: new Date()
      }
    })
  }

  async resumeJourney() {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { completedSteps: true, role: true }
    })

    if (!user) throw new Error('User not found')

    const role = this.userRole || (user.role as UserRole) || UserRole.MANAGER
    const currentPhase = getCurrentPhase(user.completedSteps, role)
    
    // Map phase to legacy status
    let journeyStatus: 'ONBOARDING' | 'ACTIVE' | 'DORMANT' = 'ACTIVE'
    if (currentPhase === JourneyPhase.ONBOARDING) {
      journeyStatus = 'ONBOARDING'
    } else if (currentPhase === JourneyPhase.CONTINUOUS_ENGAGEMENT) {
      journeyStatus = 'DORMANT'
    }

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyPhase: currentPhase,
        journeyStatus, // Legacy field
        lastActivity: new Date()
      }
    })
  }

  async markAssessmentComplete(assessmentType: string, results?: Record<string, any>) {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { completedAssessments: true }
    })

    if (!user) throw new Error('User not found')

    const completedAssessments = (user.completedAssessments as Record<string, any>) || {}
    completedAssessments[assessmentType] = {
      completedAt: new Date(),
      results: results || {}
    }

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        completedAssessments,
        lastActivity: new Date()
      }
    })
  }

  async markDebriefViewed(debriefType: string, metadata?: Record<string, any>) {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { viewedDebriefs: true }
    })

    if (!user) throw new Error('User not found')

    const viewedDebriefs = (user.viewedDebriefs as Record<string, any>) || {}
    viewedDebriefs[debriefType] = {
      viewedAt: new Date(),
      metadata: metadata || {}
    }

    // Check if user should be eligible for Team Signals
    const teamSignalsEligible = debriefType === 'tmp_debrief' || 
                               Object.keys(viewedDebriefs).includes('tmp_debrief')

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        viewedDebriefs,
        teamSignalsEligible,
        lastActivity: new Date()
      }
    })
  }

  private async getNextStep(completedSteps: string[]): Promise<JourneyStep | null> {
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { role: true, journeyPhase: true }
    })
    
    if (!user) return null
    
    const role = this.userRole || (user.role as UserRole)
    const currentPhase = user.journeyPhase as JourneyPhase
    
    return getNextStep(completedSteps, role, currentPhase)
  }

  static async getOrCreateJourneyForUser(clerkId: string): Promise<JourneyTracker> {
    let user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true }
    })

    if (!user) {
      // Try to get user details from Clerk and create user
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const clerk = await clerkClient()
        const clerkUser = await clerk.users.getUser(clerkId)
        
        if (clerkUser) {
          // Create user in database
          user = await prisma.user.create({
            data: {
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
              role: 'MANAGER', // Default to manager role for new sign-ups
            },
            select: { id: true, role: true }
          })
          
          console.log(`Auto-synced user ${clerkUser.id} from Clerk`)
        } else {
          throw new Error('User not found in Clerk')
        }
      } catch (error: any) {
        console.error('Failed to sync user from Clerk:', error)
        throw new Error('User not found. Ensure user is synced from Clerk.')
      }
    }

    return new JourneyTracker(user.id, user.role as UserRole)
  }
}