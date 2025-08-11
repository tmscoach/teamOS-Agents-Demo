/**
 * Tests for Report Storage Service
 */

import { ReportStorageService } from '../report-storage.service';
import { PrismaClient } from '@/lib/generated/prisma';

// Mock Prisma
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userReport: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn()
    },
    reportImage: {
      createMany: jest.fn()
    },
    reportChunk: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn()
    },
    $executeRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
    reportAccessLog: {
      create: jest.fn()
    }
  }))
}));

// Mock the processing and image services
jest.mock('../report-processing.service');
jest.mock('../image-download.service');

// Mock embedding service  
jest.mock('@/src/lib/knowledge-base/ingestion/embeddings', () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    generateEmbedding: jest.fn()
  }))
}));

describe('ReportStorageService', () => {
  let service: ReportStorageService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    service = new ReportStorageService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('storeReport', () => {
    it('should store a report and queue processing', async () => {
      const mockReportId = 'test-report-123';
      const storeOptions = {
        userId: 'user-123',
        organizationId: 'org-123',
        reportType: 'TMP' as const,
        subscriptionId: 'sub-123',
        templateId: '6',
        rawHtml: '<html>Test Report</html>'
      };

      mockPrisma.userReport.create.mockResolvedValue({
        id: mockReportId,
        ...storeOptions,
        processingStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const reportId = await service.storeReport(storeOptions);

      expect(reportId).toBe(mockReportId);
      expect(mockPrisma.userReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: storeOptions.userId,
          organizationId: storeOptions.organizationId,
          reportType: storeOptions.reportType,
          subscriptionId: storeOptions.subscriptionId,
          templateId: storeOptions.templateId,
          rawHtml: storeOptions.rawHtml,
          processingStatus: 'PENDING'
        })
      });
    });

    it('should handle storage errors', async () => {
      mockPrisma.userReport.create.mockRejectedValue(new Error('Database error'));

      const storeOptions = {
        userId: 'user-123',
        organizationId: 'org-123',
        reportType: 'TMP' as const,
        subscriptionId: 'sub-123',
        templateId: '6',
        rawHtml: '<html>Test Report</html>'
      };

      await expect(service.storeReport(storeOptions)).rejects.toThrow('Failed to store report');
    });
  });

  describe('getReport', () => {
    it('should retrieve a report for authorized user', async () => {
      const mockReport = {
        id: 'report-123',
        userId: 'user-123',
        rawHtml: '<html>Test</html>',
        processedHtml: '<html>Processed</html>',
        metadata: { title: 'Test Report' },
        ReportImage: []
      };

      mockPrisma.userReport.findFirst.mockResolvedValue(mockReport);

      const result = await service.getReport('report-123', 'user-123');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('report-123');
      expect(result?.processedHtml).toBe('<html>Processed</html>');
      expect(mockPrisma.reportAccessLog.create).toHaveBeenCalledWith({
        data: {
          reportId: 'report-123',
          accessedBy: 'user-123',
          accessType: 'VIEW'
        }
      });
    });

    it('should return null for unauthorized access', async () => {
      mockPrisma.userReport.findFirst.mockResolvedValue(null);

      const result = await service.getReport('report-123', 'other-user');

      expect(result).toBeNull();
      expect(mockPrisma.reportAccessLog.create).not.toHaveBeenCalled();
    });
  });

  describe('searchReports', () => {
    it('should search user reports', async () => {
      const mockChunks = [
        {
          id: 'chunk-1',
          reportId: 'report-123',
          sectionTitle: 'Overview',
          content: 'This is a test query match',
          metadata: {},
          UserReport: {
            id: 'report-123',
            reportType: 'TMP'
          }
        }
      ];

      mockPrisma.reportChunk.findMany.mockResolvedValue(mockChunks);

      const results = await service.searchReports({
        userId: 'user-123',
        query: 'test query',
        limit: 10
      });

      expect(results).toHaveLength(1);
      expect(results[0].reportId).toBe('report-123');
      expect(results[0].content).toContain('test query match');
      expect(mockPrisma.reportAccessLog.create).toHaveBeenCalledWith({
        data: {
          reportId: 'report-123',
          accessedBy: 'user-123',
          accessType: 'SEARCH'
        }
      });
    });
  });

  describe('getUserReports', () => {
    it('should get user report history', async () => {
      const mockReports = [
        {
          id: 'report-1',
          reportType: 'TMP',
          metadata: { title: 'Report 1' },
          processingStatus: 'COMPLETED',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'report-2',
          reportType: 'QO2',
          metadata: { title: 'Report 2' },
          processingStatus: 'PROCESSING',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      mockPrisma.userReport.findMany.mockResolvedValue(mockReports);

      const reports = await service.getUserReports('user-123', 10);

      expect(reports).toHaveLength(2);
      expect(reports[0].id).toBe('report-1');
      expect(mockPrisma.userReport.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 10
      });
    });
  });

  describe('processJSONReport', () => {
    const mockReportId = 'test-report-123';
    const mockJSONData = {
      success: true,
      data: {
        reportId: 'rpt_tmp_21989',
        subscriptionId: '21989',
        workflowType: 'TMP',
        sections: [
          {
            id: 'section-1',
            type: 'visual',
            title: 'Team Profile',
            order: 1,
            vectorChunk: 'Team profile showing leadership styles',
            visualization: {
              type: 'wheel',
              data: { majorRole: { name: 'Upholder' } }
            }
          },
          {
            id: 'section-2',
            type: 'content',
            title: 'Work Preferences',
            order: 2,
            content: {
              text: 'Analysis of work preferences',
              subsections: [
                { title: 'Communication', content: 'Prefers written' }
              ]
            }
          }
        ]
      }
    };

    it('should process JSON report and create chunks', async () => {
      // Setup mocks
      mockPrisma.userReport.update
        .mockResolvedValueOnce({ id: mockReportId, processingStatus: 'PROCESSING' })
        .mockResolvedValueOnce({ id: mockReportId, processingStatus: 'COMPLETED' });
      
      mockPrisma.userReport.findUnique.mockResolvedValue({
        id: mockReportId,
        userId: 'user-123',
        reportType: 'TMP'
      });

      mockPrisma.reportChunk.create
        .mockResolvedValueOnce({ id: 'chunk-1', reportId: mockReportId })
        .mockResolvedValueOnce({ id: 'chunk-2', reportId: mockReportId });

      await service.processJSONReport(mockReportId, mockJSONData);

      // Verify chunks were created
      expect(mockPrisma.reportChunk.create).toHaveBeenCalledTimes(2);
      
      // Verify first chunk
      expect(mockPrisma.reportChunk.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          reportId: mockReportId,
          sectionId: 'section-1',
          sectionTitle: 'Team Profile',
          content: 'Team profile showing leadership styles',
          chunkIndex: 0
        })
      });

      // Verify report was marked as completed
      expect(mockPrisma.userReport.update).toHaveBeenLastCalledWith({
        where: { id: mockReportId },
        data: expect.objectContaining({
          jsonData: mockJSONData,
          processingStatus: 'COMPLETED'
        })
      });
    });

    it('should generate embeddings when OpenAI key is available', async () => {
      // Setup environment
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-key';

      // Mock embedding service
      const { EmbeddingService } = require('@/src/lib/knowledge-base/ingestion/embeddings');
      const mockEmbedding = new Array(1536).fill(0.1);
      EmbeddingService.mockImplementation(() => ({
        generateEmbedding: jest.fn().mockResolvedValue(mockEmbedding)
      }));

      // Setup other mocks
      mockPrisma.userReport.findUnique.mockResolvedValue({
        id: mockReportId,
        userId: 'user-123'
      });

      mockPrisma.reportChunk.create.mockResolvedValue({
        id: 'chunk-1',
        reportId: mockReportId
      });

      mockPrisma.$executeRawUnsafe.mockResolvedValue(1);

      await service.processJSONReport(mockReportId, mockJSONData);

      // Verify embeddings were stored
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "ReportChunk" SET embedding'),
        expect.any(String),
        expect.any(String)
      );

      // Cleanup
      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should handle errors gracefully', async () => {
      // Setup mock to throw error
      mockPrisma.userReport.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      // Execute and expect error
      await expect(
        service.processJSONReport(mockReportId, mockJSONData)
      ).rejects.toThrow('Database error');

      // Verify status was updated to FAILED
      expect(mockPrisma.userReport.update).toHaveBeenLastCalledWith({
        where: { id: mockReportId },
        data: { processingStatus: 'FAILED' }
      });
    });

    it('should skip sections without content', async () => {
      const dataWithEmptySection = {
        ...mockJSONData,
        data: {
          ...mockJSONData.data,
          sections: [
            {
              id: 'empty-section',
              type: 'visual',
              title: 'Empty Section',
              order: 1
              // No vectorChunk or content
            },
            ...mockJSONData.data.sections
          ]
        }
      };

      mockPrisma.userReport.findUnique.mockResolvedValue({
        id: mockReportId,
        userId: 'user-123'
      });

      mockPrisma.reportChunk.create.mockResolvedValue({
        id: 'chunk-1',
        reportId: mockReportId
      });

      await service.processJSONReport(mockReportId, dataWithEmptySection);

      // Should only create 2 chunks (skipping the empty one)
      expect(mockPrisma.reportChunk.create).toHaveBeenCalledTimes(2);
    });
  });
});