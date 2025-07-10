import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    const { email, password } = await req.json()
    
    // Create user in Clerk
    const clerk = await clerkClient()
    const user = await clerk.users.createUser({
      emailAddress: [email],
      password: password,
    })

    // Determine role based on email domain
    let role = 'TEAM_MEMBER'
    const domain = email.split('@')[1]
    if (email === 'rowan@teammanagementsystems.com') {
      role = 'ADMIN'
    } else if (['bythelight.band', 'example.com'].includes(domain)) {
      role = 'MANAGER'
    }

    // Create user in database
    await prisma.user.create({
      data: {
        clerkId: user.id,
        email: email,
        role: role as any,
        name: email.split('@')[0], // Use email prefix as name
        journeyStatus: 'ONBOARDING',
        lastActivity: new Date(),
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