import { AgentTool, ToolResult, AgentContext } from '../types';
import prisma from '@/lib/db';

/**
 * Tool to get user's completed assessments from the database
 * This ensures we can always find completed assessments regardless of mock data state
 */
export function createGetUserCompletedAssessmentsDbTool(): AgentTool {
  return {
    name: 'get_user_completed_assessments_db',
    description: 'Get completed assessments for the current user from the database. Use this when TMS API returns no completed assessments.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const userId = context?.metadata?.userId || context?.managerId;
        
        if (!userId) {
          return {
            success: false,
            output: 'Unable to identify user',
            error: 'Missing user ID'
          };
        }

        // Get completed reports from database
        const completedReports = await prisma.userReport.findMany({
          where: {
            userId,
            processingStatus: 'COMPLETED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            reportType: true,
            subscriptionId: true,
            createdAt: true,
            viewedDebriefs: true
          }
        });

        if (completedReports.length === 0) {
          return {
            success: true,
            output: 'No completed assessments found in database.'
          };
        }

        // Format the results
        const formatted = completedReports.map(report => {
          const viewed = report.viewedDebriefs && report.viewedDebriefs.length > 0;
          return `${report.reportType}: Completed on ${report.createdAt.toLocaleDateString()} (${viewed ? 'Debriefed' : 'Ready for debrief'})`;
        }).join('\n');

        return {
          success: true,
          output: `Found ${completedReports.length} completed assessment(s) in database:\n${formatted}`,
          metadata: {
            reports: completedReports,
            source: 'database'
          }
        };
      } catch (error) {
        console.error('Error getting completed assessments from DB:', error);
        return {
          success: false,
          output: 'Failed to retrieve completed assessments',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}