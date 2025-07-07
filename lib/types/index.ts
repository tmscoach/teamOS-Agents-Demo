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
  profileData?: Record<string, any>
  engagementMetrics?: Record<string, any>
  assessmentStatus?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  name: string
  managerId: string
  department?: string
  maturityIndicators?: Record<string, any>
  performanceData?: Record<string, any>
  transformationStatus: string
  currentProgram?: string
  programStartDate?: Date
  programEndDate?: Date
  createdAt: Date
  updatedAt: Date
}