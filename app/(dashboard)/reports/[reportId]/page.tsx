import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { ReportViewerPanel } from './components/ReportViewerPanel';
import { UnifiedChat } from '@/src/components/unified-chat/UnifiedChat';
import { processHtmlUrls, generateSummary, generateFullReport } from '@/lib/utils/report-utils';
import { TMSAuthService } from '@/src/lib/agents/tools/tms-auth-service';

interface ReportViewerPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function ReportViewerPage({ params }: ReportViewerPageProps) {
  const { reportId } = await params;
  
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
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
      email: true,
      journeyPhase: true
    }
  });
  
  if (!user) {
    redirect('/sign-in');
  }

  // Fetch the report
  const report = await prisma.userReport.findUnique({
    where: { 
      id: reportId,
      userId: user.id // Ensure user owns this report
    },
    select: {
      id: true,
      reportType: true,
      subscriptionId: true,
      templateId: true,
      rawHtml: true,
      metadata: true,
      processingStatus: true,
      createdAt: true
    }
  });

  if (!report) {
    redirect('/reports');
  }

  // Get JWT token for API calls
  let jwt: string | undefined;
  try {
    const authService = TMSAuthService.getInstance();
    const token = await authService.getTokenForUser(user.id);
    jwt = token;
  } catch (error) {
    console.error('[ReportViewer] Failed to get JWT token:', error);
  }

  // Get or generate summary HTML
  let summaryHtml = (report.metadata as any)?.summaryHtml;
  if (!summaryHtml) {
    console.log('[ReportViewer] Generating summary for subscription:', report.subscriptionId);
    summaryHtml = await generateSummary(report.subscriptionId, jwt);
    
    // Update metadata with summary for future use
    if (summaryHtml && summaryHtml !== '<p>Summary not available</p>') {
      await prisma.userReport.update({
        where: { id: reportId },
        data: {
          metadata: {
            ...(report.metadata as any || {}),
            summaryHtml
          }
        }
      });
    }
  }

  // Ensure we have the full report HTML
  let fullHtml = report.rawHtml;
  if (!fullHtml || fullHtml === '') {
    console.log('[ReportViewer] Generating full report for subscription:', report.subscriptionId);
    fullHtml = await generateFullReport(
      report.subscriptionId, 
      report.templateId || '6',
      jwt
    );
    
    // Update the report with the generated HTML
    if (fullHtml && fullHtml !== '<p>Report not available</p>') {
      await prisma.userReport.update({
        where: { id: reportId },
        data: { rawHtml: fullHtml }
      });
    }
  }

  // Process URLs in both HTML versions
  const processedSummaryHtml = processHtmlUrls(summaryHtml || '<p>Summary not available</p>');
  const processedFullHtml = processHtmlUrls(fullHtml || '<p>Report not available</p>');

  // Mark debrief as being viewed if user is in DEBRIEF phase
  if (user.journeyPhase === 'DEBRIEF') {
    console.log('[ReportViewer] User in DEBRIEF phase, will mark as viewed via agent');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Report Display (60% width) */}
      <div className="flex-1 overflow-hidden">
        <ReportViewerPanel
          summaryHtml={processedSummaryHtml}
          fullHtml={processedFullHtml}
          reportType={report.reportType}
        />
      </div>
      
      {/* Right Panel - Debrief Chat (40% width) */}
      <div className="w-[450px] border-l border-gray-200 bg-white">
        <div className="h-full flex flex-col">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Debrief Assistant</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ask questions about your {report.reportType} assessment results
            </p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <UnifiedChat
              mode="debrief"
              agent="DebriefAgent"
              position="right-sidebar"
              defaultOpen={true}
              initialContext={{
                user: {
                  id: user.id,
                  name: user.name || 'User',
                  hasCompletedTMP: true, // User has completed assessment to have a report
                  credits: 0 // Default credits
                },
                metadata: {
                  reportId: report.id,
                  subscriptionId: report.subscriptionId,
                  assessmentType: report.reportType,
                  userId: user.id,
                  userEmail: user.email,
                  reportCreatedAt: report.createdAt.toISOString()
                }
              }}
              proactiveMessage={{
                type: 'debrief_welcome',
                data: {
                  reportType: report.reportType,
                  message: `I can see you're reviewing your ${report.reportType} assessment results. I'm here to help you understand what these results mean and how you can apply them to improve your team's performance. Feel free to ask me about any section, score, or recommendation in your report!`
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}