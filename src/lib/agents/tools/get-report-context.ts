import { AgentTool, ToolResult, AgentContext } from '../types';
import prisma from '@/lib/db';

/**
 * Tool for getting the full context of a user's report
 */
export function createGetReportContextTool(): AgentTool {
  return {
    name: 'get_report_context',
    description: 'Get the full context and summary of the user\'s assessment report including scores, roles, and key sections.',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID of the report'
        },
        userId: {
          type: 'string',
          description: 'The user ID requesting the report'
        }
      },
      required: []
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        // Use input values or fallback to context
        const subscriptionId = params.subscriptionId || context?.metadata?.subscriptionId;
        const userId = params.userId || context?.metadata?.userId;
        
        if (!subscriptionId || !userId) {
          return {
            success: false,
            output: 'Missing subscription ID or user ID to retrieve report.',
            error: 'Missing required parameters'
          };
        }

        // Get the report with all its chunks
        const report = await prisma.userReport.findFirst({
          where: {
            subscriptionId,
            userId,
            processingStatus: 'COMPLETED'
          },
          include: {
            ReportChunk: {
              orderBy: {
                chunkIndex: 'asc'
              }
            }
          }
        });

        if (!report) {
          return {
            success: false,
            output: `No completed report found for subscription ${subscriptionId}.`,
            error: 'Report not found'
          };
        }

        // Extract key information from metadata
        const metadata = report.metadata as any;
        let summary = `# ${report.reportType} Assessment Report\n\n`;
        
        if (metadata) {
          if (metadata.profile) {
            summary += `## Profile Summary\n`;
            summary += `- **Name**: ${metadata.profile.name || 'Not specified'}\n`;
            summary += `- **Major Role**: ${metadata.profile.majorRole || 'Not specified'}\n`;
            summary += `- **Related Roles**: ${metadata.profile.relatedRoles?.join(', ') || 'Not specified'}\n\n`;
          }

          if (metadata.scores) {
            summary += `## Scores\n`;
            Object.entries(metadata.scores).forEach(([key, value]) => {
              summary += `- **${key}**: ${value}\n`;
            });
            summary += '\n';
          }

          if (metadata.preferences) {
            summary += `## Work Preferences\n`;
            Object.entries(metadata.preferences).forEach(([key, value]) => {
              summary += `- **${key}**: ${value}%\n`;
            });
            summary += '\n';
          }
        }

        // Add section summaries
        if (report.ReportChunk.length > 0) {
          summary += `## Report Sections\n`;
          const sections = new Map<string, string>();
          
          report.ReportChunk.forEach(chunk => {
            if (!sections.has(chunk.sectionTitle)) {
              sections.set(chunk.sectionTitle, chunk.content.substring(0, 200) + '...');
            }
          });

          sections.forEach((content, title) => {
            summary += `\n### ${title}\n${content}\n`;
          });
        }

        return {
          success: true,
          output: summary
        };
      } catch (error) {
        console.error('Error getting report context:', error);
        return {
          success: false,
          output: 'Failed to retrieve report',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}