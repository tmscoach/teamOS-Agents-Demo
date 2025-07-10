import { NextRequest } from 'next/server';
import { GET } from '../guardrails/stats/route';
import { GuardrailTrackingService } from '@/src/lib/services/guardrail-tracking';
import { auth } from '@clerk/nextjs/server';

type AuthResult = { userId: string | null };

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/src/lib/services/guardrail-tracking');

describe('Guardrails Stats API', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockGuardrailService = GuardrailTrackingService as jest.Mocked<typeof GuardrailTrackingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as AuthResult);
  });

  describe('GET /api/admin/guardrails/stats', () => {
    it('should return unauthorized if not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as AuthResult);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails/stats');
      const response = await GET(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return recent violations when requested', async () => {
      const mockViolations = [
        {
          id: '1',
          conversationId: 'conv-123',
          agentName: 'TestAgent',
          guardrailType: 'Jailbreak',
          passed: false,
          severity: 'high',
          conversation: {
            id: 'conv-123',
            teamId: 'team-1',
            managerId: 'mgr-1',
          },
        },
      ];

      mockGuardrailService.getRecentViolations.mockResolvedValue(mockViolations);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails/stats?recent=true&limit=5');
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.getRecentViolations).toHaveBeenCalledWith(5);
      const data = await response.json();
      expect(data).toEqual(mockViolations);
    });

    it('should return statistics with default filters', async () => {
      const mockStats = {
        totalChecks: 1000,
        failedChecks: 50,
        passRate: 95,
        severityBreakdown: { high: 10, medium: 20, low: 20 },
        violationsByType: [
          { type: 'Jailbreak', count: 15 },
          { type: 'Professionalism', count: 35 },
        ],
        violationsByAgent: [
          { agent: 'OnboardingAgent', count: 40 },
          { agent: 'AssessmentAgent', count: 10 },
        ],
      };

      mockGuardrailService.getGuardrailStats.mockResolvedValue(mockStats);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails/stats');
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.getGuardrailStats).toHaveBeenCalledWith({
        agentName: undefined,
        guardrailType: undefined,
        startDate: undefined,
        endDate: undefined,
      });
      const data = await response.json();
      expect(data).toEqual(mockStats);
    });

    it('should apply filters to statistics', async () => {
      const mockStats = {
        totalChecks: 500,
        failedChecks: 25,
        passRate: 95,
        severityBreakdown: { high: 5, medium: 10, low: 10 },
        violationsByType: [],
        violationsByAgent: [],
      };

      mockGuardrailService.getGuardrailStats.mockResolvedValue(mockStats);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/guardrails/stats?agentName=OnboardingAgent&guardrailType=MessageLength&startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.getGuardrailStats).toHaveBeenCalledWith({
        agentName: 'OnboardingAgent',
        guardrailType: 'MessageLength',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });

    it('should handle service errors gracefully', async () => {
      mockGuardrailService.getGuardrailStats.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails/stats');
      const response = await GET(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch guardrail statistics');
    });

    it('should use default limit of 10 for recent violations', async () => {
      mockGuardrailService.getRecentViolations.mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails/stats?recent=true');
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.getRecentViolations).toHaveBeenCalledWith(10);
    });
  });
});