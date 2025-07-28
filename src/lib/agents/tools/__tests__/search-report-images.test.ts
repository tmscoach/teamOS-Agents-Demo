import { createSearchReportImagesTool } from '../search-report-images';
import { AgentContext } from '../../types';
import prisma from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    userReport: {
      findFirst: jest.fn()
    },
    reportImage: {
      findMany: jest.fn()
    }
  }
}));

describe('searchReportImages tool', () => {
  let tool: any;
  let mockContext: AgentContext;

  beforeEach(() => {
    tool = createSearchReportImagesTool();
    mockContext = {
      conversationId: 'test-conv-123',
      userId: 'test-user-123',
      managerId: 'test-manager-123',
      organizationId: 'test-org',
      currentAgent: 'DebriefAgent',
      metadata: {
        userId: 'test-user-123',
        subscriptionId: '21989',
        reportType: 'TMP'
      },
      userRole: 'user',
      messageHistory: []
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should find and return wheel images with vision descriptions', async () => {
      const mockReport = { id: 'report-123' };
      const mockImages = [
        {
          id: 'img-1',
          imageType: 'wheel',
          altText: 'Team Management Wheel',
          detailedDescription: 'The Team Management Wheel displays 8 sectors...',
          extractedData: {
            sectors: [
              { name: 'Maintaining', percentage: 19 },
              { name: 'Inspecting', percentage: 15 }
            ],
            pattern: 'focused on maintaining'
          },
          insights: ['High maintaining preference', 'Attention to detail']
        }
      ];

      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce(mockImages);

      const result = await tool.execute(
        { query: 'wheel', includeData: true },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Found 1 image');
      expect(result.output).toContain('The Team Management Wheel displays 8 sectors');
      expect(result.output).toContain('Maintaining: 19%');
      expect(result.output).toContain('Pattern: focused on maintaining');
      expect(result.output).toContain('High maintaining preference');

      expect(prisma.userReport.findFirst).toHaveBeenCalledWith({
        where: {
          subscriptionId: '21989',
          userId: 'test-user-123',
          processingStatus: 'COMPLETED'
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: { id: true }
      });
    });

    it('should handle "all images" query correctly', async () => {
      const mockReport = { id: 'report-123' };
      const mockImages = [
        {
          imageType: 'wheel',
          detailedDescription: 'Wheel description',
          extractedData: null,
          insights: []
        },
        {
          imageType: 'graph',
          detailedDescription: 'Graph description',
          extractedData: null,
          insights: []
        }
      ];

      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce(mockImages);

      const result = await tool.execute(
        { query: 'all images' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Found 2 images');
      
      // Should not have added text search filters
      expect(prisma.reportImage.findMany).toHaveBeenCalledWith({
        where: {
          reportId: 'report-123'
        },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should filter by image type when specified', async () => {
      const mockReport = { id: 'report-123' };
      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce([]);

      await tool.execute(
        { query: 'data', imageType: 'graph' },
        mockContext
      );

      expect(prisma.reportImage.findMany).toHaveBeenCalledWith({
        where: {
          reportId: 'report-123',
          imageType: 'graph',
          OR: [
            { detailedDescription: { contains: 'data', mode: 'insensitive' } },
            { altText: { contains: 'data', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
    });

    it('should return error when context is missing', async () => {
      const invalidContext = {
        ...mockContext,
        metadata: {}
      };

      const result = await tool.execute(
        { query: 'wheel' },
        invalidContext
      );

      expect(result.success).toBe(false);
      expect(result.output).toBe('Unable to access report images - missing context.');
      expect(result.error).toBe('Missing subscription or user ID');
    });

    it('should return error when no report is found', async () => {
      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await tool.execute(
        { query: 'wheel' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.output).toBe('No report found for your session.');
      expect(result.error).toBe('Report not found');
    });

    it('should handle no matching images gracefully', async () => {
      const mockReport = { id: 'report-123' };
      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await tool.execute(
        { query: 'nonexistent' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toBe('No images found matching "nonexistent".');
    });

    it('should handle graph data extraction correctly', async () => {
      const mockReport = { id: 'report-123' };
      const mockImages = [
        {
          imageType: 'graph',
          altText: 'RIDO graph',
          detailedDescription: 'Horizontal bar graph',
          extractedData: {
            dataPoints: [
              { label: 'Relationships', value: 22 },
              { label: 'Information', value: 18 }
            ],
            trends: ['Balanced distribution', 'Strong in relationships']
          },
          insights: ['Team-oriented']
        }
      ];

      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce(mockImages);

      const result = await tool.execute(
        { query: 'graph', includeData: true },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Relationships: 22');
      expect(result.output).toContain('Information: 18');
      expect(result.output).toContain('Balanced distribution, Strong in relationships');
    });

    it('should handle multi-word queries with AND logic', async () => {
      const mockReport = { id: 'report-123' };
      const mockImages = [
        {
          imageType: 'wheel',
          altText: 'Work Preference Wheel',
          detailedDescription: 'This shows the distribution of work preferences across sectors',
          extractedData: null,
          insights: []
        }
      ];

      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce(mockImages);

      const result = await tool.execute(
        { query: 'Work Preference Distribution' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Found 1 image');
      
      // Check that the query was split into words with AND conditions
      const findManyCall = (prisma.reportImage.findMany as jest.Mock).mock.calls[0][0];
      expect(findManyCall.where.AND).toBeDefined();
      expect(findManyCall.where.AND).toHaveLength(3); // "work", "preference", "distribution"
      expect(findManyCall.where.AND[0].OR).toBeDefined();
      expect(findManyCall.where.AND[0].OR[0].detailedDescription.contains).toBe('work');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.userReport.findFirst as jest.Mock).mockRejectedValueOnce(
        new Error('Database connection error')
      );

      const result = await tool.execute(
        { query: 'wheel' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.output).toBe('Failed to search images');
      expect(result.error).toBe('Database connection error');
    });

    it('should use alt text as fallback when no detailed description', async () => {
      const mockReport = { id: 'report-123' };
      const mockImages = [
        {
          imageType: 'wheel',
          altText: 'Simple wheel image',
          detailedDescription: null,
          extractedData: null,
          insights: []
        }
      ];

      (prisma.userReport.findFirst as jest.Mock).mockResolvedValueOnce(mockReport);
      (prisma.reportImage.findMany as jest.Mock).mockResolvedValueOnce(mockImages);

      const result = await tool.execute(
        { query: 'wheel' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('Simple wheel image');
    });
  });

  describe('tool configuration', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('search_report_images');
      expect(tool.description).toContain('Search and retrieve information from report images');
    });

    it('should have correct parameter schema', () => {
      expect(tool.parameters.properties).toHaveProperty('query');
      expect(tool.parameters.properties).toHaveProperty('imageType');
      expect(tool.parameters.properties).toHaveProperty('includeData');
      expect(tool.parameters.required).toEqual(['query']);
    });
  });
});