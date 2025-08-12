import { AgentTool, ToolResult, AgentContext } from '../types';
import prisma from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Tool for vector-based semantic search through report chunks
 */
export function createSearchReportChunksVectorTool(): AgentTool {
  return {
    name: 'search_report_chunks_vector',
    description: 'Semantically search through the user\'s report content using AI embeddings. Better for finding conceptually related content.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The semantic search query'
        },
        reportId: {
          type: 'string',
          description: 'The report ID to search within (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)'
        },
        similarity_threshold: {
          type: 'number',
          description: 'Minimum similarity score (0-1, default: 0.7)'
        }
      },
      required: ['query']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const { query, limit = 5, similarity_threshold = 0.7 } = params;
        
        // Get reportId from params or context
        let reportId = params.reportId || context?.metadata?.reportId;
        
        // If no reportId, find the latest report for this user
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
        }
        
        // Generate embedding for the query
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: query,
          }),
        });
        
        if (!embeddingResponse.ok) {
          throw new Error('Failed to generate embedding');
        }
        
        const { data } = await embeddingResponse.json();
        const queryEmbedding = data[0].embedding;
        
        // Perform vector similarity search
        const { data: chunks, error } = await supabase.rpc('search_report_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: similarity_threshold,
          match_count: limit,
          filter_report_id: reportId
        });
        
        if (error) {
          console.error('Vector search error:', error);
          throw error;
        }
        
        if (!chunks || chunks.length === 0) {
          return {
            success: true,
            output: `No relevant sections found for query "${query}" in the report.`
          };
        }
        
        // Format the results with similarity scores
        const results = chunks.map((chunk: any) => {
          const similarity = (chunk.similarity * 100).toFixed(1);
          return `**${chunk.section_title}** (${similarity}% match)\n${chunk.content}\n`;
        }).join('\n---\n');
        
        return {
          success: true,
          output: `Found ${chunks.length} relevant sections:\n\n${results}`
        };
      } catch (error) {
        console.error('Error in vector search:', error);
        return {
          success: false,
          output: 'Failed to search report',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}