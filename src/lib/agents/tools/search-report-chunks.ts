import { AgentTool, ToolResult, AgentContext } from '../types';
import prisma from '@/lib/db';

/**
 * Tool for searching report chunks
 */
export function createSearchReportChunksTool(): AgentTool {
  return {
    name: 'search_report_chunks',
    description: 'Search through the user\'s report content. Use this to find specific information in the report based on user questions.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant report sections'
        },
        reportId: {
          type: 'string',
          description: 'The report ID to search within (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5
        }
      },
      required: ['query']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const { query, limit = 5 } = params;
        // Use reportId from input or fallback to context
        const reportId = params.reportId || context?.metadata?.reportId;
        
        if (!reportId) {
          // If no reportId, try to find by subscription ID
          const subscriptionId = context?.metadata?.subscriptionId;
          const userId = context?.metadata?.userId;
          
          if (subscriptionId && userId) {
            const report = await prisma.userReport.findFirst({
              where: {
                subscriptionId,
                userId,
                processingStatus: 'COMPLETED'
              },
              select: { id: true }
            });
            
            if (!report) {
              return {
                success: false,
                output: 'No report found for your subscription.',
                error: 'Report not found'
              };
            }
            
            // Use the found report ID
            const foundReportId = report.id;
            
            const chunks = await prisma.reportChunk.findMany({
              where: {
                reportId: foundReportId,
                OR: [
                  { content: { contains: query, mode: 'insensitive' } },
                  { sectionTitle: { contains: query, mode: 'insensitive' } }
                ]
              },
              take: limit,
              orderBy: {
                chunkIndex: 'asc'
              }
            });
            
            if (chunks.length === 0) {
              return {
                success: true,
                output: `No relevant sections found for query "${query}".`
              };
            }
            
            const results = chunks.map(chunk => {
              return `**${chunk.sectionTitle}**\n${chunk.content}\n`;
            }).join('\n---\n');
            
            return {
              success: true,
              output: `Found ${chunks.length} relevant sections:\n\n${results}`
            };
          }
        }

        // For now, do a text-based search since we haven't implemented embeddings yet
        const chunks = await prisma.reportChunk.findMany({
          where: {
            ...(reportId && { reportId }),
            OR: [
              { content: { contains: query, mode: 'insensitive' } },
              { sectionTitle: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: limit,
          orderBy: {
            chunkIndex: 'asc'
          }
        });

        if (chunks.length === 0) {
          return {
            success: true,
            output: `No relevant sections found for query "${query}".`
          };
        }

        // Format the results
        const results = chunks.map(chunk => {
          return `**${chunk.sectionTitle}**\n${chunk.content}\n`;
        }).join('\n---\n');

        return {
          success: true,
          output: `Found ${chunks.length} relevant sections:\n\n${results}`
        };
      } catch (error) {
        console.error('Error searching report chunks:', error);
        return {
          success: false,
          output: 'Failed to search report',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}