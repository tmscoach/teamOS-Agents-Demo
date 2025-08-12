import { AgentTool, ToolResult, AgentContext } from '../types';
import prisma from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
          description: 'Maximum number of results to return (default: 5)'
        }
      },
      required: ['query']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const { query, limit = 5 } = params;
        
        // Priority: params.reportId > context.metadata.reportId > find by subscription
        let reportId = params.reportId || context?.metadata?.reportId;
        
        // If no reportId provided, try to find the latest report for this subscription
        if (!reportId) {
          const subscriptionId = context?.metadata?.subscriptionId;
          const userId = context?.metadata?.userId;
          
          if (!subscriptionId || !userId) {
            return {
              success: false,
              output: 'Unable to identify the report to search. Please provide a report ID or subscription ID.',
              error: 'Missing report identification'
            };
          }
          
          // Get the latest report for this subscription (removed processingStatus filter)
          const report = await prisma.userReport.findFirst({
            where: {
              subscriptionId,
              userId
            },
            orderBy: {
              createdAt: 'desc'
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
          
          reportId = report.id;
          console.log(`[search_report_chunks] Found report ID ${reportId} for subscription ${subscriptionId}`);
        }
        
        // Now search ONLY within this specific report
        console.log(`[search_report_chunks] Searching in report ${reportId} for query: "${query}"`);
        
        // First try keyword search for exact matches
        const chunks = await prisma.reportChunk.findMany({
          where: {
            reportId: reportId, // IMPORTANT: Only search in this specific report
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

        console.log(`[search_report_chunks] Found ${chunks.length} chunks in report ${reportId}`);
        
        // If keyword search found results, return them
        if (chunks.length > 0) {
          // Format the results
          const results = chunks.map(chunk => {
            // Truncate very long content
            const contentPreview = chunk.content.length > 1000 
              ? chunk.content.substring(0, 1000) + '...'
              : chunk.content;
            return `**${chunk.sectionTitle}**\n${contentPreview}\n`;
          }).join('\n---\n');

          return {
            success: true,
            output: `Found ${chunks.length} relevant sections in your report:\n\n${results}`
          };
        }
        
        // If no keyword matches, use vector similarity search
        console.log(`[search_report_chunks] No keyword matches, using vector search for: "${query}"`);
        
        try {
          // Generate embedding for the query
          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: query
          });
          const queryEmbedding = embeddingResponse.data[0].embedding;
          
          // Use vector similarity search to find relevant chunks
          const vectorResults = await prisma.$queryRaw<any[]>`
            SELECT 
              id,
              "sectionTitle",
              content,
              "chunkIndex",
              1 - (embedding <=> ${queryEmbedding}::vector) as similarity
            FROM "ReportChunk"
            WHERE "reportId" = ${reportId}
            AND embedding IS NOT NULL
            ORDER BY embedding <=> ${queryEmbedding}::vector
            LIMIT ${limit}
          `;
          
          console.log(`[search_report_chunks] Found ${vectorResults.length} vector matches`);
          
          if (vectorResults.length === 0) {
            return {
              success: true,
              output: `No relevant sections found for query "${query}" in the current report.`
            };
          }
          
          // Filter by similarity threshold (0.6 = somewhat relevant, lower than usual for better recall)
          const relevantChunks = vectorResults.filter(r => r.similarity > 0.6);
          
          if (relevantChunks.length === 0) {
            // If no results above threshold, take the top result anyway if it's above 0.5
            if (vectorResults[0].similarity > 0.5) {
              relevantChunks.push(vectorResults[0]);
            }
          }
          
          if (relevantChunks.length === 0) {
            return {
              success: true,
              output: `No relevant sections found for query "${query}" in the current report.`
            };
          }
          
          // Format the results
          const results = relevantChunks.map(chunk => {
            // Truncate very long content
            const contentPreview = chunk.content.length > 1000 
              ? chunk.content.substring(0, 1000) + '...'
              : chunk.content;
            const similarityPercent = (chunk.similarity * 100).toFixed(0);
            return `**${chunk.sectiontitle || chunk.sectionTitle}** (${similarityPercent}% relevant)\n${contentPreview}\n`;
          }).join('\n---\n');

          return {
            success: true,
            output: `Found ${relevantChunks.length} relevant sections in your report:\n\n${results}`
          };
          
        } catch (vectorError) {
          console.error('Vector search failed, falling back to no results:', vectorError);
          return {
            success: true,
            output: `No relevant sections found for query "${query}" in the current report.`
          };
        }
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