import { Tool } from '@langchain/core/tools';
import { z } from 'zod';
import prisma from '@/lib/db';

/**
 * Tool for searching report chunks using vector similarity
 */
export class SearchReportChunksSchema extends Tool {
  name = 'search_report_chunks';
  description = 'Search through the user\'s report content using semantic search. Use this to find specific information in the report based on user questions.';
  
  schema = z.object({
    query: z.string().describe('The search query to find relevant report sections'),
    reportId: z.string().optional().describe('The report ID to search within (optional)'),
    limit: z.number().default(5).describe('Maximum number of results to return')
  });

  constructor() {
    super();
  }

  async _call(input: z.infer<typeof this.schema>, context?: any): Promise<string> {
    const { query, limit } = input;
    // Use reportId from input or fallback to context
    const reportId = input.reportId || context?.metadata?.reportId;
    
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
          return 'No report found for your subscription.';
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
          return `No relevant sections found for query "${query}".`;
        }
        
        const results = chunks.map(chunk => {
          return `**${chunk.sectionTitle}**\n${chunk.content}\n`;
        }).join('\n---\n');
        
        return `Found ${chunks.length} relevant sections:\n\n${results}`;
      }
    }

    try {
      // For now, do a text-based search since we haven't implemented embeddings yet
      // In the future, this will use vector similarity search
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
        },
        include: {
          UserReport: {
            select: {
              reportType: true,
              subscriptionId: true
            }
          }
        }
      });

      if (chunks.length === 0) {
        return `No relevant sections found for query "${query}".`;
      }

      // Format the results
      const results = chunks.map(chunk => {
        return `**${chunk.sectionTitle}**\n${chunk.content}\n`;
      }).join('\n---\n');

      return `Found ${chunks.length} relevant sections:\n\n${results}`;
    } catch (error) {
      console.error('Error searching report chunks:', error);
      return `Error searching report: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}