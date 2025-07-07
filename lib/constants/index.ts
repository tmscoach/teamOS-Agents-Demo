// Application constants

export const APP_NAME = 'TeamOS Agents Demo'
export const APP_DESCRIPTION = 'TMS (Team Management Systems) transformation platform'

// TMS Programs
export const TMS_PROGRAMS = {
  TMP: 'Team Management Profile',
  QO2: 'QO2 Assessment',
  WOW: 'Ways of Working',
  LLP: 'Leadership Learning Profile',
  HET: 'High Effectiveness Teams',
} as const

// Transformation Status
export const TRANSFORMATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PAUSED: 'paused',
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  TEAM: '/team',
  ASSESSMENTS: '/assessments',
  PROFILE: '/profile',
} as const