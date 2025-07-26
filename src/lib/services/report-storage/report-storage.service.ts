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
          metadata: metadata as Prisma.JsonObject,
          processingStatus: 'PENDING'
        }
      });

      // Queue async processing
      this.processReportAsync(report.id).catch(error => {
        console.error(`Failed to process report ${report.id}:`, error);
      });

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
        metadata: report.metadata as ReportMetadata
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
  private async processReportAsync(reportId: string): Promise<void> {
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

      // 1. Download and store images
      const imageMap = await this.imageService.downloadReportImages(
        report.rawHtml,
        reportId
      );

      // 2. Store image records
      if (imageMap.size > 0) {
        await this.prisma.reportImage.createMany({
          data: Array.from(imageMap.entries()).map(([originalUrl, processed]) => ({
            reportId,
            originalUrl,
            storagePath: processed.storagePath,
            imageType: processed.imageType,
            altText: processed.altText,
            metadata: processed.metadata as Prisma.JsonObject
          }))
        });
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