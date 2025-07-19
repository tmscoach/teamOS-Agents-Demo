type UserRole = 'ADMIN' | 'MANAGER' | 'TEAM_MEMBER'
type JourneyStatus = 'ONBOARDING' | 'ACTIVE'

interface RoleAssignment {
  role: UserRole
  journeyStatus: JourneyStatus
}

interface RoleAssignmentOptions {
  email: string
  organizationRole?: string | null
  isFirstUserInOrg?: boolean
}

export function getRoleAssignment(options: RoleAssignmentOptions | string): RoleAssignment {
  // Handle legacy string parameter for backward compatibility
  if (typeof options === 'string') {
    options = { email: options }
  }
  
  const { email, organizationRole, isFirstUserInOrg } = options
  const adminEmail = process.env.ADMIN_EMAIL || 'rowan@teammanagementsystems.com'
  
  // Super admin user
  if (email === adminEmail) {
    return {
      role: 'ADMIN',
      journeyStatus: 'ACTIVE'
    }
  }
  
  // Organization-based role assignment
  if (organizationRole) {
    // First user in organization becomes manager
    if (isFirstUserInOrg || organizationRole === 'org:admin') {
      return {
        role: 'MANAGER',
        journeyStatus: 'ONBOARDING'
      }
    }
  }
  
  // Default team member
  return {
    role: 'TEAM_MEMBER',
    journeyStatus: 'ONBOARDING'
  }
}