import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { getRoleAssignment } from '@/src/lib/auth/role-assignment'
import { validateDevApiAccess } from '@/src/lib/auth/dev-auth'

export async function GET(req: NextRequest) {
  const authError = validateDevApiAccess(req)
  if (authError) return authError
  
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists', 
        user: existingUser,
        shouldRedirect: existingUser.journeyStatus === 'ONBOARDING' && existingUser.role === 'MANAGER'
      })
    }

    // Get email and role assignment
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const { role, journeyStatus } = getRoleAssignment(email)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        clerkId: clerkUser.id,
        email: email,
        name: clerkUser.firstName || email.split('@')[0],
        role,
        journeyStatus,
        lastActivity: new Date(),
        completedSteps: [],
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ 
      message: 'User synced successfully', 
      user,
      shouldRedirect: user.journeyStatus === 'ONBOARDING' && user.role === 'MANAGER'
    })
  } catch (error: any) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}