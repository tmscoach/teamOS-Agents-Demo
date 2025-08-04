import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { FileText, Calendar, ChevronRight, BarChart3, Users, Target } from 'lucide-react'
import { format } from 'date-fns'

// Type icons for different report types
const reportIcons = {
  TMP: BarChart3,
  QO2: Target,
  TEAM_SIGNALS: Users,
  TEAM_SIGNALS_360: Users
} as const;

// Report type display names
const reportTypeNames = {
  TMP: 'Team Management Profile',
  QO2: 'Quadrant of Opportunity',
  TEAM_SIGNALS: 'Team Signals',
  TEAM_SIGNALS_360: 'Team Signals 360'
} as const;

export default async function ReportsPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Get user from database
  const userQuery = clerkUser.emailAddresses?.[0]?.emailAddress 
    ? { email: clerkUser.emailAddresses[0].emailAddress }
    : { clerkId: clerkUser.id };
    
  const user = await prisma.user.findUnique({
    where: userQuery,
    select: {
      id: true,
      name: true,
      journeyPhase: true
    }
  });
  
  if (!user) {
    redirect('/sign-in');
  }

  // Fetch completed reports for the user
  const reports = await prisma.userReport.findMany({
    where: {
      userId: user.id,
      processingStatus: 'COMPLETED'
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reportType: true,
      subscriptionId: true,
      metadata: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assessment Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and review your completed assessment reports
              </p>
            </div>
            {user.journeyPhase === 'DEBRIEF' && reports.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm text-blue-700">
                  📊 You're in the debrief phase - review your results to progress
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reports.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No reports yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Complete your first assessment to see your reports here
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          // Reports grid
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const Icon = reportIcons[report.reportType as keyof typeof reportIcons] || FileText;
              const typeName = reportTypeNames[report.reportType as keyof typeof reportTypeNames] || report.reportType;
              
              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <Icon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {typeName}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Subscription #{report.subscriptionId}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Completed {format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                    </div>

                    {/* Report metadata preview if available */}
                    {report.metadata && typeof report.metadata === 'object' && 
                     'majorRole' in report.metadata && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Major Role:</span>{' '}
                          {(report.metadata as any).majorRole}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ready to view
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}