import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentUserWithJourney } from '@/lib/auth/roles'

export default async function DashboardPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Get user with journey info
  const user = await getCurrentUserWithJourney()
  
  // Check if user needs onboarding
  if (user && user.journeyStatus === 'ONBOARDING' && user.role === 'TEAM_MANAGER') {
    redirect('/onboarding')
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Welcome, {clerkUser?.firstName || 'User'}!</h2>
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
    </div>
  )
}