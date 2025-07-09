import { GET } from '@/app/api/admin/guardrails/stats/route';
import { auth } from '@clerk/nextjs/server';
import { GuardrailTrackingService } from '@/src/lib/services/guardrail-tracking';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/src/lib/services/guardrail-tracking');

describe('/api/admin/guardrails/stats', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockGuardrailService = GuardrailTrackingService as jest.MockedClass<typeof GuardrailTrackingService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const request = new Request('http://localhost:3000/api/admin/guardrails/stats');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return guardrail statistics', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

      const mockStats = {
        total: 150,
        passed: 120,
        failed: 30,
        byAgent: [
          { agent: 'OnboardingAgent', total: 50, passed: 45, failed: 5 },
          { agent: 'EngagementAgent', total: 40, passed: 30, failed: 10 },
          { agent: 'PerformanceAgent', total: 60, passed: 45, failed: 15 },
        ],
        byGuardrail: [
          { name: 'profanity_check', total: 80, passed: 50, failed: 30 },
          { name: 'topic_relevance', total: 70, passed: 70, failed: 0 },
        ],
        recentChecks: [
          {
            id: 'check-1',
            conversationId: 'conv-1',
            agentName: 'OnboardingAgent',
            guardrailName: 'profanity_check',
            passed: false,
            message: 'User message contains profanity',
            context: { reason: 'Offensive language detected' },
            createdAt: new Date('2024-01-10T10:00:00Z'),
          },
          {
            id: 'check-2',
            conversationId: 'conv-2',
            agentName: 'EngagementAgent',
            guardrailName: 'topic_relevance',
            passed: true,
            message: null,
            context: {},
            createdAt: new Date('2024-01-10T09:00:00Z'),
          },
        ],
      };

      const mockServiceInstance = {
        getGuardrailStats: jest.fn().mockResolvedValue(mockStats),
      };
      mockGuardrailService.prototype.getGuardrailStats = mockServiceInstance.getGuardrailStats;

      const request = new Request('http://localhost:3000/api/admin/guardrails/stats');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toEqual(mockStats);
      expect(mockServiceInstance.getGuardrailStats).toHaveBeenCalledWith({
        recent: false,
        limit: 10,
      });
    });

    it('should handle recent query parameter', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

      const mockStats = {
        recentChecks: [
          {
            id: 'check-3',
            conversationId: 'conv-3',
            agentName: 'OnboardingAgent',
            guardrailName: 'profanity_check',
            passed: true,
            message: null,
            context: {},
            createdAt: new Date('2024-01-10T11:00:00Z'),
          },
        ],
      };

      const mockServiceInstance = {
        getGuardrailStats: jest.fn().mockResolvedValue(mockStats),
      };
      mockGuardrailService.prototype.getGuardrailStats = mockServiceInstance.getGuardrailStats;

      const request = new Request('http://localhost:3000/api/admin/guardrails/stats?recent=true&limit=5');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toEqual(mockStats);
      expect(mockServiceInstance.getGuardrailStats).toHaveBeenCalledWith({
        recent: true,
        limit: 5,
      });
    });

    it('should handle service errors gracefully', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

      const mockServiceInstance = {
        getGuardrailStats: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockGuardrailService.prototype.getGuardrailStats = mockServiceInstance.getGuardrailStats;

      const request = new Request('http://localhost:3000/api/admin/guardrails/stats');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch guardrail statistics');
    });

    it('should validate limit parameter', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

      const mockStats = {
        total: 10,
        passed: 8,
        failed: 2,
        byAgent: [],
        byGuardrail: [],
        recentChecks: [],
      };

      const mockServiceInstance = {
        getGuardrailStats: jest.fn().mockResolvedValue(mockStats),
      };
      mockGuardrailService.prototype.getGuardrailStats = mockServiceInstance.getGuardrailStats;

      // Test with invalid limit
      const request1 = new Request('http://localhost:3000/api/admin/guardrails/stats?limit=abc');
      const response1 = await GET(request1);
      expect(response1.status).toBe(200);
      expect(mockServiceInstance.getGuardrailStats).toHaveBeenCalledWith({
        recent: false,
        limit: 10, // Should default to 10
      });

      // Test with too large limit
      jest.clearAllMocks();
      const request2 = new Request('http://localhost:3000/api/admin/guardrails/stats?limit=1000');
      const response2 = await GET(request2);
      expect(response2.status).toBe(200);
      expect(mockServiceInstance.getGuardrailStats).toHaveBeenCalledWith({
        recent: false,
        limit: 100, // Should cap at 100
      });
    });
  });
});