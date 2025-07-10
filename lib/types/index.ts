// Type definitions for the TMS platform

export type UserRole = 'TEAM_MEMBER' | 'MANAGER' | 'ADMIN'

export interface User {
  id: string
  clerkId: string
  email: string
  name?: string
  role: UserRole
  teamId?: string
  department?: string
  journeyStatus?: 'ONBOARDING' | 'ACTIVE' | string
  profileData?: Record<string, unknown>
  engagementMetrics?: Record<string, unknown>
  assessmentStatus?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  name: string
  managerId: string
  department?: string
  maturityIndicators?: Record<string, unknown>
  performanceData?: Record<string, unknown>
  transformationStatus: string
  currentProgram?: string
  programStartDate?: Date
  programEndDate?: Date
  createdAt: Date
  updatedAt: Date
}