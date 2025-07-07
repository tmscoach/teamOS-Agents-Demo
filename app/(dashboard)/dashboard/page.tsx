import { currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Welcome, {user?.firstName || 'User'}!</h2>
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