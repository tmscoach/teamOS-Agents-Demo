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
    const finalSubscriptionId = subscriptionId || context?.subscriptionId;
    const finalUserId = userId || context?.userId;
    
    if (!finalSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    console.log('[Voice Tool: get-report-context] Getting report context:', {
      subscriptionId: finalSubscriptionId,
      userId: finalUserId
    });

    try {
      // Fetch the report from the database
      const report = await prisma.userReport.findFirst({
        where: {
          subscriptionId: finalSubscriptionId,
          ...(finalUserId ? { userId: finalUserId } : {})
        },
        include: {
          chunks: {
            orderBy: {
              sequenceNumber: 'asc'
            },
            take: 10 // Get first 10 chunks for summary
          }
        }
      });

      if (!report) {
        console.log('[Voice Tool: get-report-context] No report found');
        return NextResponse.json({
          success: false,
          error: 'Report not found'
        });
      }

      // Parse the JSON report data
      const reportData = report.reportData as any;
      
      // Build a summary from the report
      let summary = `# Assessment Report\n\n`;
      
      if (reportData) {
        // Add metadata
        summary += `## Report Information\n`;
        summary += `- Report Type: ${reportData.workflowType || 'TMP'}\n`;
        summary += `- Completed: ${report.createdAt.toISOString()}\n\n`;
        
        // Add profile information if available
        if (reportData.profile) {
          summary += `## Profile\n`;
          summary += `- Name: ${reportData.profile.name || 'N/A'}\n`;
          summary += `- Major Role: ${reportData.profile.majorRole || 'N/A'}\n`;
          if (reportData.profile.relatedRoles?.length > 0) {
            summary += `- Related Roles: ${reportData.profile.relatedRoles.join(', ')}\n`;
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
      if (report.chunks.length > 0) {
        summary += `\n## Key Content\n`;
        report.chunks.forEach(chunk => {
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