import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { JsonReportClient } from './JsonReportClient'

export default async function JsonReportPage({
  params
}: {
  params: Promise<{ subscriptionId: string }>
}) {
  const { subscriptionId } = await params
  
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Get user from database
  const userQuery = clerkUser.emailAddresses?.[0]?.emailAddress 
    ? { email: clerkUser.emailAddresses[0].emailAddress }
    : { clerkId: clerkUser.id }
  
  console.log('[JsonReportPage] Looking for user with query:', userQuery)
  console.log('[JsonReportPage] ClerkUser:', { id: clerkUser.id, email: clerkUser.emailAddresses?.[0]?.emailAddress })
    
  const user = await prisma.user.findUnique({
    where: userQuery,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      journeyPhase: true,
      completedSteps: true,
      organizationId: true
    }
  })

  if (!user) {
    // For development/testing, create a temporary user context
    const tempUser = {
      id: 'temp-user-' + clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || 'test@example.com',
      name: clerkUser.firstName || 'Test User',
      role: 'USER' as const,
      journeyPhase: 'COMPLETED',
      completedSteps: [],
      organizationId: null
    }
    
    // Development mode: Allow viewing any report for testing
    // TODO: Remove this fallback in production
    const report = await prisma.userReport.findFirst({
      where: {
        subscriptionId
      },
      select: {
        id: true,
        subscriptionId: true,
        reportType: true,
        templateId: true,
        jsonData: true,
        metadata: true,
        processingStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!report) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
            <p className="text-gray-600 mb-4">
              No report found for subscription ID: {subscriptionId}
            </p>
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Return to Dashboard
            </a>
          </div>
        </div>
      )
    }

    return (
      <JsonReportClient
        user={tempUser}
        report={{
          id: report.id,
          subscriptionId: report.subscriptionId,
          reportType: report.reportType,
          templateId: report.templateId,
          jsonData: report.jsonData as any,
          metadata: report.metadata as any,
          processingStatus: report.processingStatus,
          createdAt: report.createdAt
        }}
      />
    )
  }

  // Check if report exists for this subscription
  const userOrgId = (user as any).organizationId || null
  console.log('[JsonReportPage] Found user:', { id: user.id, email: user.email, orgId: userOrgId })
  console.log('[JsonReportPage] Looking for report with subscriptionId:', subscriptionId)
  
  // TODO: For production, add proper access control
  // Currently allows any authenticated user to view any report (development mode)
  // In production, should check:
  // 1. User owns this report (userId matches)
  // 2. OR user is team manager/admin for the report owner
  // 3. OR user is organization admin
  const report = await prisma.userReport.findFirst({
    where: {
      subscriptionId,
      // TODO: Add user access control for production
      // Example: userId: user.id
      // OR: user.organizationId and appropriate role check
    },
    select: {
      id: true,
      subscriptionId: true,
      reportType: true,
      templateId: true,
      jsonData: true,
      metadata: true,
      processingStatus: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
          <p className="text-gray-600 mb-4">
            No report found for subscription ID: {subscriptionId}
          </p>
          <a href="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }
  
  console.log('[JsonReportPage] Report found:', {
    id: report.id,
    hasJsonData: !!report.jsonData,
    jsonDataKeys: report.jsonData ? Object.keys(report.jsonData) : [],
    sectionsCount: (report.jsonData as any)?.sections?.length || 0
  })

  return (
    <JsonReportClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        journeyPhase: user.journeyPhase,
        completedSteps: user.completedSteps
      }}
      report={{
        id: report.id,
        subscriptionId: report.subscriptionId,
        reportType: report.reportType,
        templateId: report.templateId,
        jsonData: report.jsonData as any,
        metadata: report.metadata as any,
        processingStatus: report.processingStatus,
        createdAt: report.createdAt
      }}
    />
  )
}