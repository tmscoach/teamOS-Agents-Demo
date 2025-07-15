import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Development-only endpoint to bypass Clerk authentication
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { email } = await req.json()
    
    // Validate email input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Sanitize email to prevent injection
    const sanitizedEmail = email.trim().toLowerCase()

    // Create mock session data with sanitized email
    const mockSessionId = `dev_session_${Date.now()}`
    const mockUserId = `dev_user_${sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`
    
    // Set development session cookies
    const cookieStore = await cookies()
    
    const devAuthData = JSON.stringify({
      sessionId: mockSessionId,
      userId: mockUserId,
      email: sanitizedEmail,
      timestamp: Date.now()
    })
    
    console.log('[Dev Auth] Setting cookie with data:', devAuthData)
    
    // Set a simple dev auth cookie that we can check in other routes
    cookieStore.set('__dev_auth', devAuthData, {
      httpOnly: true,
      secure: false, // Allow in dev
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return NextResponse.json({
      success: true,
      message: 'Development session created',
      userId: mockUserId,
      email: sanitizedEmail,
      redirectUrl: '/chat?agent=OnboardingAgent&new=true'
    })
  } catch (error) {
    console.error('Error creating dev session:', error)
    return NextResponse.json(
      { error: 'Failed to create development session' },
      { status: 500 }
    )
  }
}