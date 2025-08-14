import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { subscriptionId, userId, context } = body;

    // Use subscription ID from params or context
    // Ignore placeholder values like "user_subscription_id" or "user_id"
    const isPlaceholder = (value: string) => 
      value === 'user_subscription_id' || 
      value === 'user_id' || 
      value === 'subscription_id' ||
      value === 'subscriptionId' ||
      value === 'user' ||  // Add 'user' as a placeholder
      value === 'userId';
    
    const finalSubscriptionId = (subscriptionId && !isPlaceholder(subscriptionId)) 
      ? subscriptionId 
      : context?.subscriptionId;
    const finalUserId = (userId && !isPlaceholder(userId)) 
      ? userId 
      : context?.userId;
    
    if (!finalSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log('[Voice Tool: get-report-context] Getting report context:', {
      receivedSubscriptionId: subscriptionId,
      receivedUserId: userId,
      contextSubscriptionId: context?.subscriptionId,
      contextUserId: context?.userId,
      finalSubscriptionId,
      finalUserId,
      isUserIdPlaceholder: userId ? isPlaceholder(userId) : 'not provided'
    });

    try {
      // Fetch the report from the database
      // First try to get by exact report ID if provided in context
      let report;
      if (context?.reportId) {
        console.log('[Voice Tool: get-report-context] Searching by reportId:', context.reportId);
        report = await prisma.userReport.findUnique({
          where: {
            id: context.reportId
          },
          include: {
            ReportChunk: {
              orderBy: {
                chunkIndex: 'asc'
              },
              take: 10 // Get first 10 chunks for summary
            }
          }
        });
      }
      
      // If not found by ID or no ID provided, search by subscription
      if (!report) {
        console.log('[Voice Tool: get-report-context] Searching by subscriptionId (no userId filter):', finalSubscriptionId);
        report = await prisma.userReport.findFirst({
          where: {
            subscriptionId: finalSubscriptionId
            // Removed userId filter to match any report with this subscriptionId
          },
          orderBy: {
            createdAt: 'desc' // Get the most recent report
          },
          include: {
            ReportChunk: {
              orderBy: {
                chunkIndex: 'asc'
              },
              take: 10 // Get first 10 chunks for summary
            }
          }
        });
      }

      if (!report) {
        console.log('[Voice Tool: get-report-context] No report found with query:', {
          subscriptionId: finalSubscriptionId,
          userId: finalUserId
        });
        return NextResponse.json({
          success: false,
          error: 'Report not found'
        });
      }
      
      console.log('[Voice Tool: get-report-context] Report found:', {
        reportId: report.id,
        subscriptionId: report.subscriptionId,
        userId: report.userId,
        chunkCount: report.ReportChunk?.length || 0,
        hasJsonData: !!report.jsonData,
        jsonDataKeys: report.jsonData ? Object.keys(report.jsonData).slice(0, 10) : []
      });

      // Parse the JSON report data
      let reportData = report.jsonData as any;
      
      // Check if jsonData is wrapped in success/data structure
      if (reportData?.success && reportData?.data) {
        console.log('[Voice Tool: get-report-context] Unwrapping success/data structure');
        reportData = reportData.data;
      }
      
      // Build a summary from the report
      let summary = `# Assessment Report\n\n`;
      
      if (reportData) {
        // Add metadata
        summary += `## Report Information\n`;
        summary += `- Report Type: ${reportData.workflowType || 'TMP'}\n`;
        summary += `- Completed: ${report.createdAt.toISOString()}\n\n`;
        
        // Look for profile/role information in various possible locations
        const profile = reportData.profile || reportData.metadata?.profile;
        const majorRole = profile?.majorRole || 
                         reportData.majorRole || 
                         reportData.sections?.find((s: any) => s.visualization?.data?.majorRole)?.visualization?.data?.majorRole;
        
        console.log('[Voice Tool: get-report-context] Major role search:', {
          profileMajorRole: profile?.majorRole,
          reportDataMajorRole: reportData.majorRole,
          sectionsWithVisualization: reportData.sections?.filter((s: any) => s.visualization?.data?.majorRole).map((s: any) => ({
            title: s.title,
            majorRole: s.visualization?.data?.majorRole
          })),
          foundMajorRole: majorRole
        });
        
        // Add profile information if available
        if (profile || majorRole) {
          summary += `## Profile\n`;
          if (profile?.name) summary += `- Name: ${profile.name}\n`;
          if (majorRole) {
            summary += `- Major Role: ${typeof majorRole === 'object' ? majorRole.name : majorRole}\n`;
          }
          if (profile?.relatedRoles?.length > 0) {
            summary += `- Related Roles: ${profile.relatedRoles.join(', ')}\n`;
          }
          summary += '\n';
        }
        
        // Add scores if available
        if (reportData.scores) {
          summary += `## Key Scores\n`;
          Object.entries(reportData.scores).forEach(([key, value]) => {
            summary += `- ${key}: ${value}\n`;
          });
          summary += '\n';
        }
        
        // Add sections if available
        if (reportData.sections && Array.isArray(reportData.sections)) {
          summary += `## Report Sections\n`;
          reportData.sections.forEach((section: any) => {
            summary += `- ${section.title}\n`;
          });
        }
      }
      
      // Add chunk content if available
      if (report.ReportChunk && report.ReportChunk.length > 0) {
        summary += `\n## Key Content\n`;
        report.ReportChunk.forEach((chunk: any) => {
          if (chunk.sectionTitle) {
            summary += `\n### ${chunk.sectionTitle}\n`;
          }
          summary += `${chunk.content.substring(0, 200)}...\n`;
        });
      }

      console.log('[Voice Tool: get-report-context] Report context built successfully');

      return NextResponse.json({
        success: true,
        output: {
          subscriptionId: finalSubscriptionId,
          userId: report.userId,
          reportSummary: summary,
          reportData: reportData
        }
      });
    } catch (error) {
      console.error('[Voice Tool: get-report-context] Database error:', error);
      return NextResponse.json({
        success: false,
        output: null,
        error: `Failed to retrieve report context: ${error}`
      });
    }
  } catch (error) {
    console.error('[Voice Tool: get-report-context] Request error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}