import { NextResponse } from 'next/server'
import { getDevAuth } from '@/src/lib/auth/dev-auth'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  const devAuth = await getDevAuth()
  
  if (devAuth) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: devAuth.userId,
        email: devAuth.email
      }
    })
  }

  return NextResponse.json(
    { authenticated: false },
    { status: 401 }
  )
}