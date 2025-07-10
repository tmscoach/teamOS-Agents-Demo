import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { validateDevApiAccess } from '@/src/lib/auth/dev-auth'

export async function POST(req: NextRequest) {
  const authError = validateDevApiAccess(req)
  if (authError) return authError

  try {
    const { email } = await req.json()
    
    // Get users from Clerk
    const clerk = await clerkClient()
    const users = await clerk.users.getUserList({
      emailAddress: [email]
    })

    if (users.totalCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users.data[0]
    return NextResponse.json({ userId: user.id })
  } catch (error: any) {
    console.error('Error getting Clerk user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}