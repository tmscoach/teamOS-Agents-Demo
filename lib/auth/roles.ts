import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/generated/prisma'

export async function getUserRole(): Promise<UserRole | null> {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { role: true }
  })

  return user?.role || null
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'ADMIN'
}

export async function isTeamManager(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'MANAGER'
}

export async function isTeamMember(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'TEAM_MEMBER'
}

export async function requireRole(role: UserRole): Promise<void> {
  const userRole = await getUserRole()
  if (userRole !== role) {
    throw new Error(`Unauthorized: This action requires ${role} role`)
  }
}

export async function requireAdmin(): Promise<void> {
  await requireRole('ADMIN')
}

export async function getCurrentUserWithJourney() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      journeyStatus: true,
      currentAgent: true,
      completedSteps: true,
      lastActivity: true,
      onboardingData: true,
      teamId: true,
    }
  })

  return user
}