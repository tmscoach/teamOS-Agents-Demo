import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export interface DevAuthSession {
  sessionId: string
  userId: string
  email: string
  timestamp: number
}

export interface MockUser {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  fullName: string
  firstName: string
}

export async function getDevAuth(): Promise<DevAuthSession | null> {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  try {
    const cookieStore = await cookies()
    const devAuthCookie = cookieStore.get('__dev_auth')
    
    if (!devAuthCookie) {
      return null
    }

    const parsed = JSON.parse(devAuthCookie.value)
    
    // Validate the parsed session
    if (!parsed.sessionId || !parsed.userId || !parsed.email || !parsed.timestamp) {
      console.error('Invalid dev auth session structure')
      return null
    }
    
    // Check session age (24 hours)
    const age = Date.now() - parsed.timestamp
    if (age > 24 * 60 * 60 * 1000) {
      console.error('Dev auth session expired')
      return null
    }
    
    return parsed as DevAuthSession
  } catch (error) {
    console.error('Error parsing dev auth cookie:', error)
    return null
  }
}

export function getDevAuthFromRequest(req: NextRequest): DevAuthSession | null {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  try {
    const devAuthCookie = req.cookies.get('__dev_auth')
    
    if (!devAuthCookie) {
      return null
    }

    const parsed = JSON.parse(devAuthCookie.value)
    
    // Validate the parsed session
    if (!parsed.sessionId || !parsed.userId || !parsed.email || !parsed.timestamp) {
      console.error('Invalid dev auth session structure')
      return null
    }
    
    // Check session age (24 hours)
    const age = Date.now() - parsed.timestamp
    if (age > 24 * 60 * 60 * 1000) {
      console.error('Dev auth session expired')
      return null
    }
    
    return parsed as DevAuthSession
  } catch (error) {
    console.error('Error parsing dev auth cookie:', error)
    return null
  }
}

export function createMockUserFromDevAuth(devAuth: DevAuthSession): MockUser {
  // Validate inputs
  if (!devAuth.userId || !devAuth.email) {
    throw new Error('Invalid dev auth session for creating mock user')
  }
  
  // Extract name from email (before @)
  const emailParts = devAuth.email.split('@')
  const username = emailParts[0] || 'user'
  
  // Create validated mock user object
  return {
    id: devAuth.userId,
    emailAddresses: [{ emailAddress: devAuth.email }],
    fullName: username,
    firstName: username
  }
}

export function validateDevApiAccess(req: NextRequest): NextResponse | null {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  // Check for dev API token
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.DEV_API_TOKEN
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return null if validation passes
  return null
}