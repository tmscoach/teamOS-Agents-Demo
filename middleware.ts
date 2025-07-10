import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/team(.*)',
  '/assessments(.*)',
  '/api/protected(.*)',
  '/onboarding(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()

  // Protect all protected routes
  if (isProtectedRoute(req)) {
    if (!userId) {
      return redirectToSignIn()
    }
  }

  // Check admin access
  if (isAdminRoute(req)) {
    if (!userId) {
      return redirectToSignIn()
    }

    try {
      // Get user from database to check role
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
      })

      if (!user || user.role !== 'ADMIN') {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // For authenticated users, check if they need onboarding
  if (userId && req.nextUrl.pathname === '/dashboard') {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { journeyStatus: true, role: true }
      })

      if (user && user.journeyStatus === 'ONBOARDING' && user.role === 'TEAM_MANAGER') {
        // Redirect to onboarding if not completed
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    } catch (error) {
      console.error('Error checking journey status:', error)
    }
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