import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export interface DevAuthSession {
  sessionId: string
  userId: string
  email: string
  timestamp: number
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

    return JSON.parse(devAuthCookie.value) as DevAuthSession
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

    return JSON.parse(devAuthCookie.value) as DevAuthSession
  } catch (error) {
    console.error('Error parsing dev auth cookie:', error)
    return null
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