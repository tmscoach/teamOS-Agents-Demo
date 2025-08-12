import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/team(.*)',
  '/assessments(.*)',
  '/api/protected(.*)',
  '/onboarding(.*)',
  '/chat(.*)',
  '/reports(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

// Define dev-only routes that should be blocked in production
const isDevOnlyRoute = createRouteMatcher([
  '/api/dev(.*)',
  '/dev-login',
  '/dev-testing',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/api/test-db',  // Temporary test endpoint
  '/api/test-assessment',  // Test endpoint for assessment tools
  '/test-tailwind',  // Test page
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Block dev-only routes in production
  if (process.env.NODE_ENV === 'production' && isDevOnlyRoute(req)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }
  
  // Allow dev-only routes in development (after checking they're not in production)
  if (process.env.NODE_ENV === 'development' && isDevOnlyRoute(req)) {
    return NextResponse.next()
  }

  // In development, check for dev auth cookie
  if (process.env.NODE_ENV === 'development') {
    const devAuthCookie = req.cookies.get('__dev_auth')
    if (devAuthCookie) {
      console.log('[Middleware] Dev auth cookie found:', devAuthCookie.value.substring(0, 50) + '...')
      // Dev auth is present, allow access to all routes including admin
      return NextResponse.next()
    }
  }

  // Check authentication for ALL non-public routes
  if (!userId) {
    return redirectToSignIn()
  }

  // Additional checks for specific protected routes
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn()
  }

  // Admin routes require authentication (role check in route handlers)
  if (isAdminRoute(req) && !userId) {
    return redirectToSignIn()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}