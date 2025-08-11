/**
 * Report Storage Service
 * Handles persistent storage of TMS reports
 */

import { PrismaClient, Prisma } from '@/lib/generated/prisma';
import { 
  StoreReportOptions, 
  ProcessedReport, 
  ReportMetadata,
  ReportSearchOptions,
  ReportSearchResult 
} from './types';
import { ReportProcessingService } from './report-processing.service';
import { ImageDownloadService } from './image-download.service';

export class ReportStorageService {
  private prisma: PrismaClient;
  private processingService: ReportProcessingService;
  private imageService: ImageDownloadService;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.processingService = new ReportProcessingService();
    this.imageService = new ImageDownloadService();
  }

  /**
   * Store a new report
   */
  async storeReport(options: StoreReportOptions): Promise<string> {
    try {
      // Extract metadata from HTML
      const metadata = this.processingService.extractMetadata(options.rawHtml, options.reportType);

      // Create report record
      const report = await this.prisma.userReport.create({
        data: {
          userId: options.userId,
          teamId: options.teamId,
          organizationId: options.organizationId,
          reportType: options.reportType,
          subscriptionId: options.subscriptionId,
          templateId: options.templateId,
          rawHtml: options.rawHtml,
          metadata: metadata as unknown as Prisma.JsonObject,
          processingStatus: 'PENDING'
        }
      });

      // Always process the report to download images and create embeddings
      // But only do vision analysis if processImmediately is true
      if (options.processImmediately) {
        // Process synchronously with vision analysis
        await this.processReportAsync(report.id, options.jwt, true);
      } else {
        // Process asynchronously without vision analysis
        this.processReportAsync(report.id, options.jwt, false).catch(error => {
          console.error(`Failed to process report ${report.id}:`, error);
        });
      }

      return report.id;
    } catch (error) {
      console.error('Failed to store report:', error);
      throw new Error('Failed to store report');
    }
  }

  /**
   * Get a stored report by ID
   */
  async getReport(reportId: string, userId: string): Promise<ProcessedReport | null> {
    try {
      // Check access permissions
      const report = await this.prisma.userReport.findFirst({
        where: {
          id: reportId,
          OR: [
            { userId },
            // TODO: Add manager access check
          ]
        },
        include: {
          ReportImage: true
        }
      });

      if (!report) {
        return null;
      }

      // Log access
      await this.logAccess(reportId, userId, 'VIEW');

      // Return processed report if available, otherwise raw
      return {
        id: report.id,
        processedHtml: report.processedHtml || report.rawHtml,
        images: report.ReportImage.map(img => ({
          originalUrl: img.originalUrl,
          storagePath: img.storagePath,
          imageType: img.imageType as 'wheel' | 'graph' | 'asset',
          altText: img.altText || undefined
        })),
        metadata: report.metadata as unknown as ReportMetadata
      };
    } catch (error) {
      console.error('Failed to get report:', error);
      throw new Error('Failed to retrieve report');
    }
  }

  /**
   * Search within user reports
   */
  async searchReports(options: ReportSearchOptions): Promise<ReportSearchResult[]> {
    try {
      // For now, do a simple text search
      // TODO: Implement vector search in Phase 3
      const chunks = await this.prisma.reportChunk.findMany({
        where: {
          UserReport: {
            userId: options.userId,
            reportType: options.reportTypes ? {
              in: options.reportTypes as any
            } : undefined
          },
          content: {
            contains: options.query,
            mode: 'insensitive'
          }
        },
        include: {
          UserReport: {
            select: {
              id: true,
              reportType: true
            }
          }
        },
        take: options.limit || 10
      });

      // Log search access
      const reportIds = [...new Set(chunks.map(c => c.reportId))];
      await Promise.all(
        reportIds.map(id => this.logAccess(id, options.userId, 'SEARCH'))
      );

      return chunks.map(chunk => ({
        reportId: chunk.reportId,
        reportType: chunk.UserReport.reportType,
        sectionTitle: chunk.sectionTitle,
        content: chunk.content,
        relevance: 1.0, // TODO: Calculate actual relevance
        metadata: chunk.metadata
      }));
    } catch (error) {
      console.error('Failed to search reports:', error);
      throw new Error('Failed to search reports');
    }
  }

  /**
   * Process report asynchronously
   */
  private async processReportAsync(reportId: string, jwt?: string, enableVisionAnalysis: boolean = true): Promise<void> {
    try {
      // Update status to processing
      await this.prisma.userReport.update({
        where: { id: reportId },
        data: { processingStatus: 'PROCESSING' }
      });

      const report = await this.prisma.userReport.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // 1. Download and store images (with or without vision analysis)
      const imageMap = await this.imageService.downloadReportImages(
        report.rawHtml,
        reportId,
        { userId: report.userId, jwt, enableVisionAnalysis }
      );

      // 2. Store image records with vision analysis
      if (imageMap.size > 0) {
        // Use individual creates to handle arrays and embeddings
        for (const [originalUrl, processed] of imageMap.entries()) {
          const imageData: any = {
            reportId,
            originalUrl,
            storagePath: processed.storagePath,
            imageType: processed.imageType,
            altText: processed.altText,
            detailedDescription: processed.detailedDescription,
            extractedData: processed.extractedData as Prisma.JsonObject,
            insights: processed.insights || [],
            metadata: processed.metadata as Prisma.JsonObject
          };
          
          // Add embedding if available (using raw SQL for vector type)
          if (processed.embedding && processed.embedding.length > 0) {
            await this.prisma.$executeRaw`
              INSERT INTO "ReportImage" 
              (id, "reportId", "originalUrl", "storagePath", "imageType", "altText", 
               "detailedDescription", "extractedData", insights, metadata, embedding, "createdAt")
              VALUES 
              (gen_random_uuid()::text, ${reportId}, ${originalUrl}, ${processed.storagePath}, 
               ${processed.imageType}, ${processed.altText}, ${processed.detailedDescription}, 
               ${JSON.stringify(processed.extractedData)}::jsonb, ${processed.insights}::text[], 
               ${JSON.stringify(processed.metadata)}::jsonb, ${processed.embedding}::vector, NOW())
            `;
          } else {
            await this.prisma.reportImage.create({
              data: imageData
            });
          }
        }
      }

      // 3. Replace image URLs in HTML
      const processedHtml = this.processingService.replaceImageUrls(
        report.rawHtml,
        imageMap
      );

      // 4. Extract and chunk content
      const chunks = this.processingService.extractChunks(
        report.rawHtml,
        report.reportType
      );

      // 5. Store chunks (without embeddings for now)
      if (chunks.length > 0) {
        await this.prisma.reportChunk.createMany({
          data: chunks.map((chunk, index) => ({
            reportId,
            sectionId: chunk.sectionId,
            sectionTitle: chunk.sectionTitle,
            content: chunk.content,
            chunkIndex: index,
            charCount: chunk.content.length,
            metadata: chunk.metadata as Prisma.JsonObject
          }))
        });
      }

      // 6. Update report with processed HTML
      await this.prisma.userReport.update({
        where: { id: reportId },
        data: {
          processedHtml,
          processingStatus: 'COMPLETED',
          processedAt: new Date()
        }
      });

      console.log(`Successfully processed report ${reportId}`);
    } catch (error) {
      console.error(`Failed to process report ${reportId}:`, error);
      
      // Update status to failed
      await this.prisma.userReport.update({
        where: { id: reportId },
        data: { processingStatus: 'FAILED' }
      }).catch(() => {}); // Ignore update errors
    }
  }

  /**
   * Process JSON report and generate vector embeddings
   */
  async processJSONReport(reportId: string, jsonData: any): Promise<void> {
    try {
      // Update status to processing
      await this.prisma.userReport.update({
        where: { id: reportId },
        data: { processingStatus: 'PROCESSING' }
      });

      const report = await this.prisma.userReport.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // Extract sections from JSON data
      const sections = jsonData.data?.sections || jsonData.sections || [];
      
      // Import embedding service
      const { EmbeddingService } = await import('@/src/lib/knowledge-base/ingestion/embeddings');
      const embeddingService = new EmbeddingService();

      // Process each section
      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        
        // Extract meaningful text for embedding
        let content = '';
        
        // Add vector chunk if present
        if (section.vectorChunk) {
          content = section.vectorChunk;
        } else {
          // Build content from section data
          if (section.title) {
            content += section.title + '. ';
          }
          
          if (section.content?.text) {
            content += section.content.text + ' ';
          }
          
          if (section.content?.subsections) {
            for (const subsection of section.content.subsections) {
              content += subsection.title + ': ' + subsection.content + ' ';
            }
          }
          
          // Add visualization description if present
          if (section.visualization?.data?.majorRole) {
            const role = section.visualization.data.majorRole;
            content += `Major role: ${role.name}. `;
          }
          
          if (section.visualization?.data?.relatedRoles) {
            const roles = section.visualization.data.relatedRoles.map((r: any) => r.name).join(', ');
            content += `Related roles: ${roles}. `;
          }
        }
        
        // Skip if no content
        if (!content.trim()) continue;
        
        // First create the chunk without embedding
        const chunk = await this.prisma.reportChunk.create({
          data: {
            reportId,
            sectionId: section.id,
            sectionTitle: section.title,
            content,
            chunkIndex: index,
            charCount: content.length,
            metadata: {
              sectionType: section.type,
              hasVisualization: !!section.visualization,
              order: section.order
            } as Prisma.JsonObject
          }
        });
        
        // Generate embedding
        let embedding;
        try {
          embedding = await embeddingService.generateEmbedding(content);
          
          if (embedding && embedding.length > 0) {
            // Update with embedding using raw SQL
            const vectorString = `[${embedding.join(',')}]`;
            await this.prisma.$executeRawUnsafe(
              `UPDATE "ReportChunk" SET embedding = $1::vector WHERE id = $2`,
              vectorString,
              chunk.id
            );
          }
        } catch (embError) {
          console.error(`Failed to generate/store embedding for ${section.title}:`, embError);
          // Continue without embedding
        }
      }

      // Update report with JSON data and mark as completed
      await this.prisma.userReport.update({
        where: { id: reportId },
        data: {
          jsonData: jsonData as Prisma.JsonObject,
          processingStatus: 'COMPLETED',
          processedAt: new Date()
        }
      });

      console.log(`Successfully processed JSON report ${reportId} with ${sections.length} sections`);
    } catch (error) {
      console.error(`Failed to process JSON report ${reportId}:`, error);
      
      // Update status to failed
      await this.prisma.userReport.update({
        where: { id: reportId },
        data: { processingStatus: 'FAILED' }
      }).catch(() => {}); // Ignore update errors
      
      throw error;
    }
  }

  /**
   * Log report access
   */
  private async logAccess(reportId: string, userId: string, accessType: 'VIEW' | 'SEARCH' | 'SHARE'): Promise<void> {
    try {
      await this.prisma.reportAccessLog.create({
        data: {
          reportId,
          accessedBy: userId,
          accessType
        }
      });
    } catch (error) {
      // Don't fail on logging errors
      console.error('Failed to log access:', error);
    }
  }

  /**
   * Get user's report history
   */
  async getUserReports(userId: string, limit?: number): Promise<any[]> {
    try {
      const reports = await this.prisma.userReport.findMany({
        where: { userId },
        select: {
          id: true,
          reportType: true,
          metadata: true,
          processingStatus: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit || 10
      });

      return reports;
    } catch (error) {
      console.error('Failed to get user reports:', error);
      throw new Error('Failed to retrieve report history');
    }
  }
}