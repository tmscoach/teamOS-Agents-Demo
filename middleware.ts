import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/team(.*)',
  '/assessments(.*)',
  '/api/protected(.*)',
  '/onboarding(.*)',
  '/chat(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/api/webhooks(.*)',
  '/api/test-db',  // Temporary test endpoint
  '/test-tailwind',  // Test page
  '/api/dev(.*)',  // Development endpoints
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
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