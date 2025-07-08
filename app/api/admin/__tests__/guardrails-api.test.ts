import { NextRequest } from 'next/server';
import { GET, POST } from '../guardrails/route';
import { GuardrailTrackingService } from '@/lib/services/guardrail-tracking';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/services/guardrail-tracking');

describe('Guardrails API', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockGuardrailService = GuardrailTrackingService as jest.Mocked<typeof GuardrailTrackingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
  });

  describe('GET /api/admin/guardrails', () => {
    it('should return unauthorized if not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails');
      const response = await GET(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return guardrails for a specific conversation', async () => {
      const mockGuardrails = [
        {
          id: '1',
          conversationId: 'conv-123',
          agentName: 'TestAgent',
          guardrailType: 'MessageLength',
          passed: true,
        },
      ];

      mockGuardrailService.getConversationGuardrails.mockResolvedValue(mockGuardrails as any);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails?conversationId=conv-123');
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.getConversationGuardrails).toHaveBeenCalledWith('conv-123');
      const data = await response.json();
      expect(data).toEqual(mockGuardrails);
    });

    it('should search guardrails with filters', async () => {
      const mockResults = {
        results: [],
        total: 0,
      };

      mockGuardrailService.searchGuardrailChecks.mockResolvedValue(mockResults);

      const req = new NextRequest(
        'http://localhost:3000/api/admin/guardrails?query=test&agentName=OnboardingAgent&passed=false&severity=high&limit=25'
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.searchGuardrailChecks).toHaveBeenCalledWith({
        query: 'test',
        agentName: 'OnboardingAgent',
        guardrailType: undefined,
        passed: false,
        severity: 'high',
        startDate: undefined,
        endDate: undefined,
        limit: 25,
        offset: 0,
      });
    });

    it('should handle date filters correctly', async () => {
      mockGuardrailService.searchGuardrailChecks.mockResolvedValue({ results: [], total: 0 });

      const req = new NextRequest(
        'http://localhost:3000/api/admin/guardrails?startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.searchGuardrailChecks).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      mockGuardrailService.searchGuardrailChecks.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails');
      const response = await GET(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch guardrails');
    });
  });

  describe('POST /api/admin/guardrails', () => {
    it('should track a new guardrail check', async () => {
      const mockCheck = {
        id: 'check-id',
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        guardrailType: 'MessageLength',
        input: 'Test input',
        passed: true,
        severity: null,
        reasoning: 'Check passed',
        timestamp: new Date(),
      };

      mockGuardrailService.trackGuardrailCheck.mockResolvedValue(mockCheck as any);

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          agentName: 'OnboardingAgent',
          guardrailType: 'MessageLength',
          input: 'Test input',
          result: { passed: true },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(200);
      expect(mockGuardrailService.trackGuardrailCheck).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        agentName: 'OnboardingAgent',
        guardrailType: 'MessageLength',
        input: 'Test input',
        result: { passed: true },
      });
      const data = await response.json();
      expect(data).toEqual(mockCheck);
    });

    it('should return 400 for missing required fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/guardrails', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          // Missing required fields
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing required fields');
    });

    it('should handle tracking errors', async () => {
      mockGuardrailService.trackGuardrailCheck.mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/admin/guardrails', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'conv-123',
          agentName: 'OnboardingAgent',
          guardrailType: 'MessageLength',
          input: 'Test input',
          result: { passed: true },
        }),
      });

      const response = await POST(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to track guardrail check');
    });
  });
});