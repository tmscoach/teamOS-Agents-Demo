import { GuardrailCheck } from '@/lib/generated/prisma';
import { GuardrailResult } from '@/src/lib/agents/types';
import prisma from '@/lib/db';

export interface GuardrailCheckInput {
  conversationId: string;
  agentName: string;
  guardrailType: string;
  input: string;
  result: GuardrailResult;
}

export class GuardrailTrackingService {
  /**
   * Track a guardrail check result
   */
  static async trackGuardrailCheck(data: GuardrailCheckInput): Promise<GuardrailCheck> {
    // Determine severity based on the failed check
    let severity: string | null = null;
    if (!data.result.passed) {
      // Analyze the guardrail type and metadata to determine severity
      severity = this.determineSeverity(data.guardrailType, data.result);
    }

    return await prisma.guardrailCheck.create({
      data: {
        conversationId: data.conversationId,
        agentName: data.agentName,
        guardrailType: data.guardrailType,
        input: data.input,
        passed: data.result.passed,
        severity,
        reasoning: data.result.reason || 'Check passed',
      },
    });
  }

  /**
   * Get guardrail checks for a conversation
   */
  static async getConversationGuardrails(conversationId: string): Promise<GuardrailCheck[]> {
    return await prisma.guardrailCheck.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get guardrail statistics
   */
  static async getGuardrailStats(filters?: {
    agentName?: string;
    guardrailType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    
    if (filters?.agentName) {
      where.agentName = filters.agentName;
    }
    
    if (filters?.guardrailType) {
      where.guardrailType = filters.guardrailType;
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

    const [totalChecks, failedChecks, severityCounts] = await Promise.all([
      prisma.guardrailCheck.count({ where }),
      prisma.guardrailCheck.count({ where: { ...where, passed: false } }),
      prisma.guardrailCheck.groupBy({
        by: ['severity'],
        where: { ...where, passed: false },
        _count: true,
      }),
    ]);

    const violationsByType = await prisma.guardrailCheck.groupBy({
      by: ['guardrailType'],
      where: { ...where, passed: false },
      _count: true,
    });

    const violationsByAgent = await prisma.guardrailCheck.groupBy({
      by: ['agentName'],
      where: { ...where, passed: false },
      _count: true,
    });

    return {
      totalChecks,
      failedChecks,
      passRate: totalChecks > 0 ? ((totalChecks - failedChecks) / totalChecks) * 100 : 100,
      severityBreakdown: severityCounts.reduce((acc, item) => {
        acc[item.severity || 'unknown'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      violationsByType: violationsByType.map(item => ({
        type: item.guardrailType,
        count: item._count,
      })),
      violationsByAgent: violationsByAgent.map(item => ({
        agent: item.agentName,
        count: item._count,
      })),
    };
  }

  /**
   * Get recent violations
   */
  static async getRecentViolations(limit: number = 10): Promise<GuardrailCheck[]> {
    return await prisma.guardrailCheck.findMany({
      where: { passed: false },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        conversation: {
          select: {
            id: true,
            teamId: true,
            managerId: true,
          },
        },
      },
    });
  }

  /**
   * Search guardrail checks
   */
  static async searchGuardrailChecks(params: {
    query?: string;
    agentName?: string;
    guardrailType?: string;
    passed?: boolean;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.query) {
      where.OR = [
        { input: { contains: params.query, mode: 'insensitive' } },
        { reasoning: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.agentName) where.agentName = params.agentName;
    if (params.guardrailType) where.guardrailType = params.guardrailType;
    if (params.passed !== undefined) where.passed = params.passed;
    if (params.severity) where.severity = params.severity;

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = params.startDate;
      if (params.endDate) where.timestamp.lte = params.endDate;
    }

    const [results, total] = await Promise.all([
      prisma.guardrailCheck.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
        include: {
          conversation: {
            select: {
              id: true,
              teamId: true,
              managerId: true,
            },
          },
        },
      }),
      prisma.guardrailCheck.count({ where }),
    ]);

    return { results, total };
  }

  /**
   * Determine severity of a guardrail violation
   */
  private static determineSeverity(guardrailType: string, result: GuardrailResult): string {
    // High severity violations
    const highSeverityTypes = [
      'Jailbreak',
      'DataExfiltration',
      'SystemPromptExtraction',
      'UnauthorizedAccess',
    ];

    // Medium severity violations  
    const mediumSeverityTypes = [
      'Professionalism',
      'TopicRelevance',
      'ConversationTimeLimit',
    ];

    // Check guardrail type
    if (highSeverityTypes.some(type => guardrailType.toLowerCase().includes(type.toLowerCase()))) {
      return 'high';
    }

    if (mediumSeverityTypes.some(type => guardrailType.toLowerCase().includes(type.toLowerCase()))) {
      return 'medium';
    }

    // Check metadata for additional signals
    if (result.metadata) {
      if (result.metadata.capsRatio > 0.8) return 'medium';
      if (result.metadata.detectedPattern?.includes('competitor')) return 'medium';
    }

    return 'low';
  }
}