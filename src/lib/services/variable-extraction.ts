import { VariableExtraction } from '@/lib/generated/prisma';
import prisma from '@/lib/db';

export interface VariableExtractionInput {
  conversationId: string;
  agentName: string;
  fieldName: string;
  attempted: boolean;
  successful: boolean;
  extractedValue?: string;
  confidence?: number;
  extractionMethod?: 'regex' | 'llm';
}

export class VariableExtractionService {
  /**
   * Track a variable extraction attempt
   */
  static async trackExtraction(data: VariableExtractionInput): Promise<VariableExtraction> {
    return await prisma.variableExtraction.create({
      data: {
        id: `varextract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        conversationId: data.conversationId,
        agentName: data.agentName,
        fieldName: data.fieldName,
        attempted: data.attempted,
        successful: data.successful,
        extractedValue: data.extractedValue,
        confidence: data.confidence,
        extractionMethod: data.extractionMethod,
      },
    });
  }

  /**
   * Batch track multiple extractions
   */
  static async trackExtractionBatch(extractions: VariableExtractionInput[]): Promise<number> {
    const result = await prisma.variableExtraction.createMany({
      data: extractions.map(extraction => ({
        id: `varextract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...extraction
      })),
    });
    return result.count;
  }

  /**
   * Get extraction history for a conversation
   */
  static async getConversationExtractions(conversationId: string): Promise<VariableExtraction[]> {
    return await prisma.variableExtraction.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get extraction statistics
   */
  static async getExtractionStats(filters?: {
    agentName?: string;
    fieldName?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    
    if (filters?.agentName) {
      where.agentName = filters.agentName;
    }
    
    if (filters?.fieldName) {
      where.fieldName = filters.fieldName;
    }
    
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [totalAttempts, successfulExtractions] = await Promise.all([
      prisma.variableExtraction.count({ where: { ...where, attempted: true } }),
      prisma.variableExtraction.count({ where: { ...where, successful: true } }),
    ]);

    const fieldStats = await prisma.variableExtraction.groupBy({
      by: ['fieldName'],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        confidence: true,
      },
    });

    const agentStats = await prisma.variableExtraction.groupBy({
      by: ['agentName'],
      where,
      _count: {
        _all: true,
      },
    });

    // Calculate success rates by field
    const fieldSuccessRates = await Promise.all(
      fieldStats.map(async (field) => {
        const successful = await prisma.variableExtraction.count({
          where: {
            ...where,
            fieldName: field.fieldName,
            successful: true,
          },
        });
        return {
          fieldName: field.fieldName,
          attempts: field._count._all,
          successful,
          successRate: field._count._all > 0 ? (successful / field._count._all) * 100 : 0,
          avgConfidence: field._sum.confidence ? field._sum.confidence / successful : 0,
        };
      })
    );

    return {
      totalAttempts,
      successfulExtractions,
      overallSuccessRate: totalAttempts > 0 ? (successfulExtractions / totalAttempts) * 100 : 0,
      byField: fieldSuccessRates,
      byAgent: agentStats.map(stat => ({
        agentName: stat.agentName,
        attempts: stat._count._all,
      })),
    };
  }

  /**
   * Get fields with low extraction rates
   */
  static async getProblematicFields(threshold: number = 50): Promise<{
    fieldName: string;
    successRate: number;
    attempts: number;
    examples: VariableExtraction[];
  }[]> {
    const fieldStats = await prisma.variableExtraction.groupBy({
      by: ['fieldName'],
      _count: {
        _all: true,
      },
    });

    const problematicFields = [];

    for (const field of fieldStats) {
      const successful = await prisma.variableExtraction.count({
        where: {
          fieldName: field.fieldName,
          successful: true,
        },
      });

      const successRate = field._count._all > 0 ? (successful / field._count._all) * 100 : 0;

      if (successRate < threshold && field._count._all > 5) { // Only include fields with enough attempts
        const examples = await prisma.variableExtraction.findMany({
          where: {
            fieldName: field.fieldName,
            successful: false,
          },
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: {
            Conversation: {
              select: {
                id: true,
                contextData: true,
              },
            },
          },
        });

        problematicFields.push({
          fieldName: field.fieldName,
          successRate,
          attempts: field._count._all,
          examples,
        });
      }
    }

    return problematicFields.sort((a, b) => a.successRate - b.successRate);
  }

  /**
   * Get extraction patterns over time
   */
  static async getExtractionTrends(params: {
    agentName?: string;
    fieldName?: string;
    days?: number;
  }) {
    const days = params.days || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      timestamp: { gte: startDate },
    };

    if (params.agentName) where.agentName = params.agentName;
    if (params.fieldName) where.fieldName = params.fieldName;

    const extractions = await prisma.variableExtraction.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    // Group by day
    const trendsByDay = new Map<string, { attempts: number; successful: number }>();

    extractions.forEach(extraction => {
      const day = extraction.timestamp.toISOString().split('T')[0];
      if (!trendsByDay.has(day)) {
        trendsByDay.set(day, { attempts: 0, successful: 0 });
      }
      const dayStats = trendsByDay.get(day)!;
      if (extraction.attempted) dayStats.attempts++;
      if (extraction.successful) dayStats.successful++;
    });

    return Array.from(trendsByDay.entries()).map(([date, stats]) => ({
      date,
      attempts: stats.attempts,
      successful: stats.successful,
      successRate: stats.attempts > 0 ? (stats.successful / stats.attempts) * 100 : 0,
    }));
  }

  /**
   * Search extraction history
   */
  static async searchExtractions(params: {
    query?: string;
    agentName?: string;
    fieldName?: string;
    successful?: boolean;
    minConfidence?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.query) {
      where.extractedValue = { contains: params.query, mode: 'insensitive' };
    }

    if (params.agentName) where.agentName = params.agentName;
    if (params.fieldName) where.fieldName = params.fieldName;
    if (params.successful !== undefined) where.successful = params.successful;
    if (params.minConfidence !== undefined) where.confidence = { gte: params.minConfidence };

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = params.startDate;
      if (params.endDate) where.timestamp.lte = params.endDate;
    }

    const [results, total] = await Promise.all([
      prisma.variableExtraction.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
        include: {
          Conversation: {
            select: {
              id: true,
              teamId: true,
              managerId: true,
            },
          },
        },
      }),
      prisma.variableExtraction.count({ where }),
    ]);

    return { results, total };
  }

  /**
   * Get confidence distribution for a field
   */
  static async getConfidenceDistribution(fieldName: string) {
    const extractions = await prisma.variableExtraction.findMany({
      where: {
        fieldName,
        successful: true,
        confidence: { not: null },
      },
      select: {
        confidence: true,
      },
    });

    const bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const distribution = new Array(bins.length - 1).fill(0);

    extractions.forEach(extraction => {
      if (extraction.confidence !== null) {
        for (let i = 0; i < bins.length - 1; i++) {
          if (extraction.confidence >= bins[i] && extraction.confidence < bins[i + 1]) {
            distribution[i]++;
            break;
          }
        }
      }
    });

    return bins.slice(0, -1).map((bin, i) => ({
      range: `${bin * 100}-${bins[i + 1] * 100}%`,
      count: distribution[i],
    }));
  }
}