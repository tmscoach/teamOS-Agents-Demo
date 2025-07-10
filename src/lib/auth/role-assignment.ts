import { UserRole, JourneyStatus } from '@prisma/client'

interface RoleAssignment {
  role: UserRole
  journeyStatus: JourneyStatus
}

export function getRoleAssignment(email: string): RoleAssignment {
  const adminEmail = process.env.ADMIN_EMAIL || 'rowan@teammanagementsystems.com'
  
  // Admin user
  if (email === adminEmail) {
    return {
      role: 'ADMIN',
      journeyStatus: 'ACTIVE'
    }
  }
  
  // Manager for bythelight.band domain
  if (email.endsWith('@bythelight.band')) {
    return {
      role: 'MANAGER', 
      journeyStatus: 'ONBOARDING'
    }
  }
  
  // Default team member
  return {
    role: 'TEAM_MEMBER',
    journeyStatus: 'ONBOARDING'
  }
}