import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '@/lib/db';

/**
 * Tool for getting the full context of a user's report
 */
export class GetReportContextSchema extends Tool {
  name = 'get_report_context';
  description = 'Get the full context and summary of the user\'s assessment report including scores, roles, and key sections.';
  
  schema = z.object({
    subscriptionId: z.string().describe('The subscription ID of the report'),
    userId: z.string().describe('The user ID requesting the report')
  });

  constructor() {
    super();
  }

  async _call(input: z.infer<typeof this.schema>, context?: any): Promise<string> {
    // Use input values or fallback to context
    const subscriptionId = input.subscriptionId || context?.metadata?.subscriptionId;
    const userId = input.userId || context?.metadata?.userId;
    
    if (!subscriptionId || !userId) {
      return 'Missing subscription ID or user ID to retrieve report.';
    }

    try {
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
        return `No completed report found for subscription ${subscriptionId}.`;
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

      return summary;
    } catch (error) {
      console.error('Error getting report context:', error);
      return `Error retrieving report: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}