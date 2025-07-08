import { VariableExtractionService } from '../variable-extraction';
import { PrismaClient } from '@/lib/generated/prisma';

// Mock Prisma Client
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    variableExtraction: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  })),
}));

describe('VariableExtractionService', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('trackExtraction', () => {
    it('should track a successful extraction', async () => {
      const mockExtraction = {
        id: 'test-id',
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        fieldName: 'team_size',
        attempted: true,
        successful: true,
        extractedValue: '15-20 people',
        confidence: 0.95,
        timestamp: new Date(),
      };

      mockPrisma.variableExtraction.create.mockResolvedValue(mockExtraction);

      const result = await VariableExtractionService.trackExtraction({
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        fieldName: 'team_size',
        attempted: true,
        successful: true,
        extractedValue: '15-20 people',
        confidence: 0.95,
      });

      expect(mockPrisma.variableExtraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          conversationId: 'conv-123',
          agentName: 'OnboardingAgent',
          fieldName: 'team_size',
          attempted: true,
          successful: true,
          extractedValue: '15-20 people',
          confidence: 0.95,
        }),
      });
      expect(result).toEqual(mockExtraction);
    });

    it('should track a failed extraction attempt', async () => {
      const mockExtraction = {
        id: 'test-id',
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        fieldName: 'budget_range',
        attempted: true,
        successful: false,
        extractedValue: null,
        confidence: null,
        timestamp: new Date(),
      };

      mockPrisma.variableExtraction.create.mockResolvedValue(mockExtraction);

      const result = await VariableExtractionService.trackExtraction({
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        fieldName: 'budget_range',
        attempted: true,
        successful: false,
      });

      expect(result.successful).toBe(false);
      expect(result.extractedValue).toBeNull();
      expect(result.confidence).toBeNull();
    });
  });

  describe('trackExtractionBatch', () => {
    it('should track multiple extractions at once', async () => {
      const extractions = [
        {
          conversationId: 'conv-123',
          agentName: 'OnboardingAgent',
          fieldName: 'team_size',
          attempted: true,
          successful: true,
          extractedValue: '10',
          confidence: 0.9,
        },
        {
          conversationId: 'conv-123',
          agentName: 'OnboardingAgent',
          fieldName: 'team_tenure',
          attempted: true,
          successful: true,
          extractedValue: '2 years',
          confidence: 0.85,
        },
      ];

      mockPrisma.variableExtraction.createMany.mockResolvedValue({ count: 2 });

      const result = await VariableExtractionService.trackExtractionBatch(extractions);

      expect(mockPrisma.variableExtraction.createMany).toHaveBeenCalledWith({
        data: extractions,
      });
      expect(result).toBe(2);
    });
  });

  describe('getExtractionStats', () => {
    it('should calculate comprehensive statistics', async () => {
      mockPrisma.variableExtraction.count.mockResolvedValueOnce(100); // total attempts
      mockPrisma.variableExtraction.count.mockResolvedValueOnce(80);  // successful
      
      mockPrisma.variableExtraction.groupBy.mockResolvedValueOnce([
        { fieldName: 'team_size', _count: { _all: 20 }, _sum: { confidence: 18 } },
        { fieldName: 'budget_range', _count: { _all: 15 }, _sum: { confidence: 10.5 } },
      ]);
      
      mockPrisma.variableExtraction.groupBy.mockResolvedValueOnce([
        { agentName: 'OnboardingAgent', _count: { _all: 85 } },
        { agentName: 'AssessmentAgent', _count: { _all: 15 } },
      ]);

      // Mock successful counts for each field
      mockPrisma.variableExtraction.count
        .mockResolvedValueOnce(18) // team_size successful
        .mockResolvedValueOnce(10); // budget_range successful

      const stats = await VariableExtractionService.getExtractionStats();

      expect(stats.totalAttempts).toBe(100);
      expect(stats.successfulExtractions).toBe(80);
      expect(stats.overallSuccessRate).toBe(80);
      expect(stats.byField).toHaveLength(2);
      expect(stats.byField[0]).toEqual({
        fieldName: 'team_size',
        attempts: 20,
        successful: 18,
        successRate: 90,
        avgConfidence: 1, // 18/18
      });
      expect(stats.byAgent).toHaveLength(2);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        agentName: 'OnboardingAgent',
        fieldName: 'team_size',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockPrisma.variableExtraction.count.mockResolvedValue(50);
      mockPrisma.variableExtraction.groupBy.mockResolvedValue([]);

      await VariableExtractionService.getExtractionStats(filters);

      expect(mockPrisma.variableExtraction.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          agentName: 'OnboardingAgent',
          fieldName: 'team_size',
          timestamp: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      });
    });
  });

  describe('getProblematicFields', () => {
    it('should identify fields with low extraction rates', async () => {
      mockPrisma.variableExtraction.groupBy.mockResolvedValue([
        { fieldName: 'budget_range', _count: { _all: 20 } },
        { fieldName: 'timeline_preference', _count: { _all: 15 } },
        { fieldName: 'team_size', _count: { _all: 3 } }, // Too few attempts
      ]);

      // Mock successful counts
      mockPrisma.variableExtraction.count
        .mockResolvedValueOnce(6)  // budget_range successful (30%)
        .mockResolvedValueOnce(5)  // timeline_preference successful (33%)
        .mockResolvedValueOnce(2); // team_size successful (ignored due to low attempts)

      // Mock example failures
      mockPrisma.variableExtraction.findMany.mockResolvedValue([
        {
          id: '1',
          fieldName: 'budget_range',
          successful: false,
          conversation: { id: 'conv-1', contextData: {} },
        },
      ]);

      const problematicFields = await VariableExtractionService.getProblematicFields(50);

      expect(problematicFields).toHaveLength(2);
      expect(problematicFields[0].fieldName).toBe('budget_range');
      expect(problematicFields[0].successRate).toBe(30);
      expect(problematicFields[0].attempts).toBe(20);
    });
  });

  describe('getExtractionTrends', () => {
    it('should calculate daily trends', async () => {
      const mockExtractions = [
        {
          timestamp: new Date('2024-01-01'),
          attempted: true,
          successful: true,
        },
        {
          timestamp: new Date('2024-01-01'),
          attempted: true,
          successful: false,
        },
        {
          timestamp: new Date('2024-01-02'),
          attempted: true,
          successful: true,
        },
      ];

      mockPrisma.variableExtraction.findMany.mockResolvedValue(mockExtractions);

      const trends = await VariableExtractionService.getExtractionTrends({
        days: 7,
      });

      expect(trends).toContainEqual({
        date: '2024-01-01',
        attempts: 2,
        successful: 1,
        successRate: 50,
      });
      expect(trends).toContainEqual({
        date: '2024-01-02',
        attempts: 1,
        successful: 1,
        successRate: 100,
      });
    });
  });

  describe('searchExtractions', () => {
    it('should search with all parameters', async () => {
      const searchParams = {
        query: 'team',
        agentName: 'OnboardingAgent',
        fieldName: 'team_size',
        successful: true,
        minConfidence: 0.8,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 20,
        offset: 5,
      };

      mockPrisma.variableExtraction.findMany.mockResolvedValue([]);
      mockPrisma.variableExtraction.count.mockResolvedValue(50);

      const result = await VariableExtractionService.searchExtractions(searchParams);

      expect(mockPrisma.variableExtraction.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          extractedValue: { contains: 'team', mode: 'insensitive' },
          agentName: 'OnboardingAgent',
          fieldName: 'team_size',
          successful: true,
          confidence: { gte: 0.8 },
          timestamp: {
            gte: searchParams.startDate,
            lte: searchParams.endDate,
          },
        }),
        orderBy: { timestamp: 'desc' },
        take: 20,
        skip: 5,
        include: expect.any(Object),
      });

      expect(result).toEqual({
        results: [],
        total: 50,
      });
    });
  });

  describe('getConfidenceDistribution', () => {
    it('should calculate confidence distribution in bins', async () => {
      const mockExtractions = [
        { confidence: 0.15 },  // 0-20%
        { confidence: 0.25 },  // 20-40%
        { confidence: 0.35 },  // 20-40%
        { confidence: 0.65 },  // 60-80%
        { confidence: 0.85 },  // 80-100%
        { confidence: 0.95 },  // 80-100%
      ];

      mockPrisma.variableExtraction.findMany.mockResolvedValue(mockExtractions);

      const distribution = await VariableExtractionService.getConfidenceDistribution('team_size');

      expect(distribution).toEqual([
        { range: '0-20%', count: 1 },
        { range: '20-40%', count: 2 },
        { range: '40-60%', count: 0 },
        { range: '60-80%', count: 1 },
        { range: '80-100%', count: 2 },
      ]);
    });

    it('should handle null confidence values', async () => {
      const mockExtractions = [
        { confidence: 0.5 },
        { confidence: null },
        { confidence: 0.8 },
      ];

      mockPrisma.variableExtraction.findMany.mockResolvedValue(
        mockExtractions.filter(e => e.confidence !== null)
      );

      const distribution = await VariableExtractionService.getConfidenceDistribution('field');

      expect(distribution.reduce((sum, bin) => sum + bin.count, 0)).toBe(2);
    });
  });
});