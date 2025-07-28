import { AgentTool, ToolResult, AgentContext } from '../types';
import prisma from '@/lib/db';

/**
 * Tool for searching and understanding report images
 */
export function createSearchReportImagesTool(): AgentTool {
  return {
    name: 'search_report_images',
    description: 'Search and retrieve information from report images including wheels and graphs. Returns detailed descriptions and extracted data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for in the images (e.g., "wheel", "graph", "work preferences", "scores")'
        },
        imageType: {
          type: 'string',
          description: 'Filter by image type (optional): wheel, graph, or asset',
          enum: ['wheel', 'graph', 'asset']
        },
        includeData: {
          type: 'boolean',
          description: 'Include extracted data points from the images',
          default: true
        }
      },
      required: ['query']
    },
    execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
      try {
        const { query, imageType, includeData = true } = params;
        
        // Get report ID from context
        const subscriptionId = context?.metadata?.subscriptionId;
        const userId = context?.metadata?.userId;
        
        console.log('[search_report_images] Context metadata:', {
          subscriptionId,
          userId,
          hasContext: !!context,
          hasMetadata: !!context?.metadata
        });
        
        if (!subscriptionId || !userId) {
          return {
            success: false,
            output: 'Unable to access report images - missing context.',
            error: 'Missing subscription or user ID'
          };
        }
        
        // Find the latest report
        const report = await prisma.userReport.findFirst({
          where: {
            subscriptionId,
            userId,
            processingStatus: 'COMPLETED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: { id: true }
        });
        
        console.log('[search_report_images] Report search result:', {
          found: !!report,
          reportId: report?.id
        });
        
        if (!report) {
          return {
            success: false,
            output: 'No report found for your session.',
            error: 'Report not found'
          };
        }
        
        // Build the query
        const whereClause: any = {
          reportId: report.id
        };
        
        if (imageType) {
          whereClause.imageType = imageType;
        }
        
        // Search in descriptions and insights
        if (query && query.trim()) {
          // Check if user is asking for all images
          const lowerQuery = query.toLowerCase();
          if (lowerQuery.includes('all') && (lowerQuery.includes('image') || lowerQuery.includes('visual'))) {
            // Don't add any additional filters - return all images
            console.log('[search_report_images] Returning all images');
          } else {
            whereClause.OR = [
              { detailedDescription: { contains: query, mode: 'insensitive' } },
              { altText: { contains: query, mode: 'insensitive' } },
              // Note: Can't directly search in array fields with Prisma
            ];
          }
        }
        
        // Get matching images
        const images = await prisma.reportImage.findMany({
          where: whereClause,
          orderBy: { createdAt: 'asc' }
        });
        
        if (images.length === 0) {
          return {
            success: true,
            output: `No images found matching "${query}".`
          };
        }
        
        // Format the results
        let output = `Found ${images.length} image${images.length > 1 ? 's' : ''}:\n\n`;
        
        for (const image of images) {
          output += `**${image.imageType.charAt(0).toUpperCase() + image.imageType.slice(1)}**\n`;
          
          if (image.detailedDescription) {
            output += `${image.detailedDescription}\n`;
          } else if (image.altText) {
            output += `${image.altText}\n`;
          }
          
          if (includeData && image.extractedData) {
            const data = image.extractedData as any;
            
            if (image.imageType === 'wheel' && data.sectors) {
              output += '\nWork Preference Distribution:\n';
              for (const sector of data.sectors) {
                output += `- ${sector.name}: ${sector.percentage}%\n`;
              }
              if (data.pattern) {
                output += `\nPattern: ${data.pattern}\n`;
              }
            } else if (image.imageType === 'graph' && data.dataPoints) {
              output += '\nData Points:\n';
              for (const point of data.dataPoints) {
                output += `- ${point.label}: ${point.value}\n`;
              }
              if (data.trends && data.trends.length > 0) {
                output += `\nTrends: ${data.trends.join(', ')}\n`;
              }
            }
          }
          
          if (image.insights && image.insights.length > 0) {
            output += '\nKey Insights:\n';
            for (const insight of image.insights) {
              output += `- ${insight}\n`;
            }
          }
          
          output += '\n---\n';
        }
        
        return {
          success: true,
          output: output.trim()
        };
      } catch (error) {
        console.error('Error searching report images:', error);
        return {
          success: false,
          output: 'Failed to search images',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  };
}