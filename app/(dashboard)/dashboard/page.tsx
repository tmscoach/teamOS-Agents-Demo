import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentUserWithJourney } from '@/lib/auth/roles'
import { prisma } from '@/lib/db/prisma'

export default async function DashboardPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Get user with journey info
  const user = await getCurrentUserWithJourney().catch((error) => {
    console.error('Database connection error:', error)
    return null
  })
  
  // Check if user needs onboarding
  // Note: The NEXT_REDIRECT error in dev console is expected behavior - it's how Next.js handles redirects
  if (user && user.journeyStatus === 'ONBOARDING' && user.role === 'MANAGER') {
    // Check if user has any existing conversations
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        managerId: user.id,
        currentAgent: 'OnboardingAgent'
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true }
    }).catch(() => null)

    // Only add new=true if this is truly their first conversation
    if (existingConversation) {
      console.log('[Dashboard] Found existing conversation:', existingConversation.id)
      redirect('/chat?agent=OnboardingAgent')
    } else {
      console.log('[Dashboard] No existing conversation, creating new')
      redirect('/chat?agent=OnboardingAgent&new=true')
    }
  }

  return (
    <div>
        <h2 className="text-3xl font-bold mb-6">Welcome, {clerkUser?.firstName || 'User'}!</h2>
      
      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Unable to load user data. Some features may be limited.</p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Team Overview</h3>
          <p className="text-gray-600">View and manage your team information</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Assessments</h3>
          <p className="text-gray-600">Complete and review TMS assessments</p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
          <p className="text-gray-600">Monitor team transformation progress</p>
        </div>
      </div>
      
      {user && (
        <div className="mt-8 text-sm text-gray-500">
          <p>Email: {user.email} | Role: {user.role} | Status: {user.journeyStatus}</p>
        </div>
      )}
    </div>
  )
}