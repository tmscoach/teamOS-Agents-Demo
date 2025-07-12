// Journey phase definitions for the simplified 4-phase system
export enum JourneyPhase {
  ONBOARDING = 'ONBOARDING',
  ASSESSMENT = 'ASSESSMENT', 
  DEBRIEF = 'DEBRIEF',
  CONTINUOUS_ENGAGEMENT = 'CONTINUOUS_ENGAGEMENT'
}

export enum UserRole {
  MANAGER = 'MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER'
}

export interface JourneyStep {
  id: string;
  name: string;
  description: string;
  phase: JourneyPhase;
  agent: string;
  required: boolean;
  order: number;
  roles: UserRole[]; // Which roles can access this step
  prerequisites?: string[]; // Step IDs that must be completed first
}

// Define journey steps for the new 4-phase system
export const JOURNEY_STEPS: JourneyStep[] = [
  // Phase 1: Onboarding
  {
    id: 'welcome',
    name: 'Welcome & Introduction',
    description: 'Introduction to TeamOS and personalized journey setup',
    phase: JourneyPhase.ONBOARDING,
    agent: 'OnboardingAgent',
    required: true,
    order: 1,
    roles: [UserRole.MANAGER, UserRole.TEAM_MEMBER]
  },
  {
    id: 'manager_team_context',
    name: 'Team Context & Challenges',
    description: 'Gather information about your team, structure, and primary challenges',
    phase: JourneyPhase.ONBOARDING,
    agent: 'OnboardingAgent',
    required: true,
    order: 2,
    roles: [UserRole.MANAGER]
  },
  {
    id: 'member_role_context',
    name: 'Role & Work Preferences',
    description: 'Share your role, responsibilities, and work style preferences',
    phase: JourneyPhase.ONBOARDING,
    agent: 'OnboardingAgent',
    required: true,
    order: 2,
    roles: [UserRole.TEAM_MEMBER]
  },
  {
    id: 'manager_goals',
    name: 'Transformation Goals',
    description: 'Define your team transformation objectives and success metrics',
    phase: JourneyPhase.ONBOARDING,
    agent: 'OnboardingAgent',
    required: true,
    order: 3,
    roles: [UserRole.MANAGER]
  },

  // Phase 2: Assessment
  {
    id: 'tmp_assessment',
    name: 'Team Management Profile (TMP)',
    description: 'Complete your personalized work personality assessment',
    phase: JourneyPhase.ASSESSMENT,
    agent: 'AssessmentAgent',
    required: true,
    order: 4,
    roles: [UserRole.MANAGER, UserRole.TEAM_MEMBER],
    prerequisites: ['welcome']
  },
  {
    id: 'team_signals_baseline',
    name: 'Team Signals Baseline',
    description: 'Establish baseline team health metrics',
    phase: JourneyPhase.ASSESSMENT,
    agent: 'AssessmentAgent',
    required: true,
    order: 5,
    roles: [UserRole.MANAGER],
    prerequisites: ['tmp_assessment']
  },

  // Phase 3: Debrief
  {
    id: 'tmp_debrief',
    name: 'TMP Personal Debrief',
    description: 'Receive insights about your work personality and management style',
    phase: JourneyPhase.DEBRIEF,
    agent: 'DebriefAgent',
    required: true,
    order: 6,
    roles: [UserRole.MANAGER, UserRole.TEAM_MEMBER],
    prerequisites: ['tmp_assessment']
  },
  {
    id: 'team_signals_debrief',
    name: 'Team Health Insights',
    description: 'Review team dynamics and health indicators',
    phase: JourneyPhase.DEBRIEF,
    agent: 'DebriefAgent',
    required: true,
    order: 7,
    roles: [UserRole.MANAGER],
    prerequisites: ['team_signals_baseline']
  },

  // Phase 4: Continuous Engagement
  {
    id: 'quarterly_team_signals',
    name: 'Quarterly Team Signals',
    description: 'Track team progress with quarterly health checks',
    phase: JourneyPhase.CONTINUOUS_ENGAGEMENT,
    agent: 'AssessmentAgent',
    required: false,
    order: 8,
    roles: [UserRole.MANAGER, UserRole.TEAM_MEMBER],
    prerequisites: ['team_signals_baseline']
  },
  {
    id: 'advanced_assessments',
    name: 'Advanced Assessments',
    description: 'Access to WoWV, QO2, LLP 360 assessments as needed',
    phase: JourneyPhase.CONTINUOUS_ENGAGEMENT,
    agent: 'AssessmentAgent',
    required: false,
    order: 9,
    roles: [UserRole.MANAGER],
    prerequisites: ['tmp_debrief']
  }
];

// Helper function to get steps for a specific role and phase
export function getStepsForRole(role: UserRole, phase?: JourneyPhase): JourneyStep[] {
  return JOURNEY_STEPS.filter(step => {
    const roleMatch = step.roles.includes(role);
    const phaseMatch = phase ? step.phase === phase : true;
    return roleMatch && phaseMatch;
  }).sort((a, b) => a.order - b.order);
}

// Helper function to get next available step
export function getNextStep(
  completedSteps: string[], 
  role: UserRole,
  currentPhase: JourneyPhase
): JourneyStep | null {
  const availableSteps = JOURNEY_STEPS.filter(step => {
    // Check role
    if (!step.roles.includes(role)) return false;
    
    // Check if already completed
    if (completedSteps.includes(step.id)) return false;
    
    // Check prerequisites
    if (step.prerequisites) {
      const prereqsMet = step.prerequisites.every(prereq => 
        completedSteps.includes(prereq)
      );
      if (!prereqsMet) return false;
    }
    
    // For continuous engagement, only show if previous phases complete
    if (step.phase === JourneyPhase.CONTINUOUS_ENGAGEMENT) {
      const requiredStepsComplete = JOURNEY_STEPS
        .filter(s => s.required && s.roles.includes(role))
        .every(s => completedSteps.includes(s.id));
      if (!requiredStepsComplete) return false;
    }
    
    return true;
  }).sort((a, b) => a.order - b.order);
  
  return availableSteps[0] || null;
}

// Helper to determine current phase based on completed steps
export function getCurrentPhase(completedSteps: string[], role: UserRole): JourneyPhase {
  const roleSteps = getStepsForRole(role);
  
  // Check each phase in order
  const phases = [
    JourneyPhase.ONBOARDING,
    JourneyPhase.ASSESSMENT,
    JourneyPhase.DEBRIEF,
    JourneyPhase.CONTINUOUS_ENGAGEMENT
  ];
  
  for (let i = phases.length - 1; i >= 0; i--) {
    const phase = phases[i];
    const phaseSteps = roleSteps.filter(s => s.phase === phase && s.required);
    
    // If any required step in this phase is complete, we're at least in this phase
    if (phaseSteps.some(s => completedSteps.includes(s.id))) {
      // Check if all required steps in this phase are complete
      const allComplete = phaseSteps.every(s => completedSteps.includes(s.id));
      
      // If all complete and there's a next phase, we're in the next phase
      if (allComplete && i < phases.length - 1) {
        return phases[i + 1];
      }
      
      return phase;
    }
  }
  
  // Default to onboarding if no steps completed
  return JourneyPhase.ONBOARDING;
}

// Map legacy journey status to new phases
export function mapLegacyStatusToPhase(
  journeyStatus: 'ONBOARDING' | 'ACTIVE' | 'DORMANT',
  completedSteps: string[],
  role: UserRole
): JourneyPhase {
  if (journeyStatus === 'ONBOARDING') {
    return JourneyPhase.ONBOARDING;
  }
  
  // For ACTIVE or DORMANT, determine phase based on completed steps
  return getCurrentPhase(completedSteps, role);
}