import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getRoleAssignment } from '@/src/lib/auth/role-assignment'
import { validateDevApiAccess } from '@/src/lib/auth/dev-auth'

export async function POST(req: NextRequest) {
  const authError = validateDevApiAccess(req)
  if (authError) return authError

  try {
    const { email, password } = await req.json()
    
    // Create user in Clerk
    const clerk = await clerkClient()
    const user = await clerk.users.createUser({
      emailAddress: [email],
      password: password,
    })

    // Get role assignment based on email
    const { role, journeyStatus } = getRoleAssignment(email)

    // Create user in database
    await prisma.user.create({
      data: {
        clerkId: user.id,
        email: email,
        role,
        name: email.split('@')[0], // Use email prefix as name
        journeyStatus,
        lastActivity: new Date(),
        completedSteps: [],
      },
    })

    return NextResponse.json({ 
      message: 'User created successfully', 
      userId: user.id,
      role: role 
    })
  } catch (error: any) {
    console.error('Error creating test user:', error)
    // Return more detailed error info
    return NextResponse.json({ 
      error: error.message,
      details: error.errors || error.response?.data || error
    }, { status: 500 })
  }
}