import { NextRequest, NextResponse } from 'next/server'

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