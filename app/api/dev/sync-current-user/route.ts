import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    // Determine role based on email
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    let role = 'TEAM_MEMBER'
    const domain = email.split('@')[1]
    
    if (email === 'rowan@teammanagementsystems.com') {
      role = 'ADMIN'
    } else if (['bythelight.band', 'example.com'].includes(domain)) {
      role = 'MANAGER'
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        name: clerkUser.firstName || email.split('@')[0],
        role: role as any,
        journeyStatus: role === 'ADMIN' ? 'ACTIVE' : 'ONBOARDING',
        lastActivity: new Date(),
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