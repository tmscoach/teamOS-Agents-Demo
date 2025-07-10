import { prisma } from '@/lib/prisma'

export interface JourneyStep {
  id: string
  name: string
  description: string
  agent: string
  required: boolean
  order: number
}

// Define the onboarding journey steps
export const ONBOARDING_STEPS: JourneyStep[] = [
  {
    id: 'welcome',
    name: 'Welcome & Introduction',
    description: 'Introduction to TeamOS and the transformation journey',
    agent: 'onboarding',
    required: true,
    order: 1
  },
  {
    id: 'team_context',
    name: 'Team Context',
    description: 'Gather information about your team and challenges',
    agent: 'onboarding',
    required: true,
    order: 2
  },
  {
    id: 'goals_setting',
    name: 'Goals Setting',
    description: 'Define transformation goals and success metrics',
    agent: 'onboarding',
    required: true,
    order: 3
  },
  {
    id: 'initial_assessment',
    name: 'Initial Assessment',
    description: 'Complete Team Signals baseline assessment',
    agent: 'assessment',
    required: true,
    order: 4
  },
  {
    id: 'transformation_plan',
    name: 'Transformation Plan',
    description: 'Review and approve your customized transformation plan',
    agent: 'onboarding',
    required: true,
    order: 5
  }
]

export class JourneyTracker {
  constructor(private userId: string) {}

  async getCurrentJourney() {
    const user = await prisma.user.findUnique({
      where: { id: this.userId },
      select: {
        journeyStatus: true,
        currentAgent: true,
        completedSteps: true,
        onboardingData: true,
        lastActivity: true
      }
    })

    if (!user) throw new Error('User not found')

    return {
      status: user.journeyStatus,
      currentAgent: user.currentAgent,
      completedSteps: user.completedSteps,
      onboardingData: user.onboardingData as Record<string, any> || {},
      lastActivity: user.lastActivity,
      nextStep: this.getNextStep(user.completedSteps)
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

    // Check if onboarding is complete
    const requiredSteps = ONBOARDING_STEPS.filter(s => s.required).map(s => s.id)
    const isOnboardingComplete = requiredSteps.every(step => completedSteps.includes(step))

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
    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyStatus: 'ACTIVE',
        currentAgent: null,
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
      select: { completedSteps: true }
    })

    if (!user) throw new Error('User not found')

    const requiredSteps = ONBOARDING_STEPS.filter(s => s.required).map(s => s.id)
    const isOnboardingComplete = requiredSteps.every(step => 
      user.completedSteps.includes(step)
    )

    await prisma.user.update({
      where: { id: this.userId },
      data: {
        journeyStatus: isOnboardingComplete ? 'ACTIVE' : 'ONBOARDING',
        lastActivity: new Date()
      }
    })
  }

  private getNextStep(completedSteps: string[]): JourneyStep | null {
    const nextStep = ONBOARDING_STEPS
      .filter(step => !completedSteps.includes(step.id))
      .sort((a, b) => a.order - b.order)[0]

    return nextStep || null
  }

  static async getOrCreateJourneyForUser(clerkId: string): Promise<JourneyTracker> {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    })

    if (!user) {
      throw new Error('User not found. Ensure user is synced from Clerk.')
    }

    return new JourneyTracker(user.id)
  }
}