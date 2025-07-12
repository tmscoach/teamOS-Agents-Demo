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
        currentAgent: true,
        completedSteps: true,
        onboardingData: true,
        lastActivity: true,
        role: true
      }
    })

    if (!user) throw new Error('User not found')

    // Get user role (use provided role or fetch from DB)
    const role = this.userRole || (user.role as UserRole)
    
    // Map legacy status to phase
    const currentPhase = mapLegacyStatusToPhase(
      user.journeyStatus,
      user.completedSteps,
      role
    )
    
    // Get next step based on role
    const nextStep = getNextStep(user.completedSteps, role, currentPhase)

    return {
      status: user.journeyStatus,
      currentPhase,
      currentAgent: user.currentAgent,
      completedSteps: user.completedSteps,
      onboardingData: user.onboardingData as Record<string, any> || {},
      lastActivity: user.lastActivity,
      nextStep,
      role
    }
  }

  async updateJourneyProgress(stepId: string, data?: Record<string, any>) {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { completedSteps: true, onboardingData: true }
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

    // Get user role
    const userWithRole = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { role: true }
    })
    const role = this.userRole || (userWithRole?.role as UserRole) || UserRole.MANAGER
    
    // Check if onboarding phase is complete
    const onboardingSteps = getStepsForRole(role, JourneyPhase.ONBOARDING)
    const requiredOnboardingSteps = onboardingSteps.filter(s => s.required)
    const isOnboardingComplete = requiredOnboardingSteps.every(step => 
      completedSteps.includes(step.id)
    )

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        completedSteps,
        onboardingData,
        journeyStatus: isOnboardingComplete ? 'ACTIVE' : 'ONBOARDING',
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
    // Set status to ACTIVE to indicate user is past onboarding
    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyStatus: 'ACTIVE',
        currentAgent: 'AssessmentAgent', // Move to assessment phase
        lastActivity: new Date()
      }
    })
  }

  async pauseJourney() {
    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyStatus: 'DORMANT',
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

    // Get user role to check phase completion
    const role = this.userRole || (user.role as UserRole) || UserRole.MANAGER
    const onboardingSteps = getStepsForRole(role, JourneyPhase.ONBOARDING)
    const requiredOnboardingSteps = onboardingSteps.filter(s => s.required)
    const isOnboardingComplete = requiredOnboardingSteps.every(step => 
      user.completedSteps.includes(step.id)
    )

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyStatus: isOnboardingComplete ? 'ACTIVE' : 'ONBOARDING',
        lastActivity: new Date()
      }
    })
  }

  private async getNextStep(completedSteps: string[]): Promise<JourneyStep | null> {
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: { role: true, journeyStatus: true }
    })
    
    if (!user) return null
    
    const role = this.userRole || (user.role as UserRole)
    const currentPhase = mapLegacyStatusToPhase(
      user.journeyStatus,
      completedSteps,
      role
    )
    
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