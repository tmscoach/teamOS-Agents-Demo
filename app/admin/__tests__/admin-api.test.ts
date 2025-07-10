/**
 * Integration tests for admin API endpoints
 */

import { NextRequest } from 'next/server';

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    conversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    agentEvent: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'admin-user-id' }),
}));

import prisma from '@/lib/db';

describe('Admin API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/conversations', () => {
    test('should return list of conversations with metadata', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          managerId: 'manager-1',
          teamId: 'team-1',
          currentAgent: 'OnboardingAgent',
          status: 'active',
          startedAt: new Date(),
          messages: [{ id: 'msg-1' }, { id: 'msg-2' }],
          metadata: {
            onboarding: {
              state: 'context_discovery',
              qualityMetrics: { completionPercentage: 45 }
            }
          }
        }
      ];

      (prisma.conversation.findMany as jest.Mock).mockResolvedValue(mockConversations);

      // Import the handler
      const conversationsRoute = await import('../../../api/admin/conversations/route');
      const { GET } = conversationsRoute;
      const request = new NextRequest('http://localhost:3000/api/admin/conversations');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversations).toHaveLength(1);
      expect(data.conversations[0].id).toBe('conv-1');
      expect(data.conversations[0].messageCount).toBe(2);
    });

    test('should filter conversations by status', async () => {
      const mockConversations = [
        { id: 'conv-1', status: 'active' },
        { id: 'conv-2', status: 'completed' }
      ];

      (prisma.conversation.findMany as jest.Mock).mockResolvedValue(
        mockConversations.filter(c => c.status === 'active')
      );

      const conversationsRoute = await import('../../../api/admin/conversations/route');
      const { GET } = conversationsRoute;
      const request = new NextRequest('http://localhost:3000/api/admin/conversations?status=active');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversations).toHaveLength(1);
      expect(data.conversations[0].status).toBe('active');
    });
  });

  describe('GET /api/admin/conversations/[id]', () => {
    test('should return detailed conversation data', async () => {
      const mockConversation = {
        id: 'conv-1',
        managerId: 'manager-1',
        messages: [
          {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello!',
            timestamp: new Date()
          }
        ],
        events: [
          {
            id: 'evt-1',
            type: 'state_transition',
            payload: { from: 'greeting', to: 'context_discovery' }
          }
        ],
        metadata: {
          onboarding: {
            capturedFields: { name: 'Sarah', team_size: 10 }
          }
        }
      };

      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation);

      const conversationDetailRoute = await import('../../../api/admin/conversations/[id]/route');
      const { GET } = conversationDetailRoute;
      const request = new NextRequest('http://localhost:3000/api/admin/conversations/conv-1');
      
      const response = await GET(request, { params: { id: 'conv-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('conv-1');
      expect(data.messages).toHaveLength(1);
      expect(data.events).toHaveLength(1);
      expect(data.metadata.onboarding.capturedFields.name).toBe('Sarah');
    });
  });

  describe('GET /api/admin/stats', () => {
    test('should return variable extraction statistics', async () => {
      (prisma.conversation.count as jest.Mock).mockResolvedValue(100);
      
      (prisma.agentEvent.groupBy as jest.Mock).mockResolvedValue([
        { 
          _count: { id: 45 },
          payload: { field: 'team_size', success: true }
        },
        {
          _count: { id: 42 },
          payload: { field: 'team_size', success: false }
        }
      ]);

      const statsRoute = await import('../../../api/admin/stats/route');
      const { GET } = statsRoute;
      const request = new NextRequest('http://localhost:3000/api/admin/stats');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalConversations).toBe(100);
      expect(data.variableExtractionStats).toBeDefined();
    });
  });

  describe('GET /api/admin/guardrails', () => {
    test('should return guardrail violation statistics', async () => {
      const mockViolations = [
        {
          conversationId: 'conv-1',
          type: 'jailbreak_attempt',
          severity: 'high',
          timestamp: new Date()
        },
        {
          conversationId: 'conv-2',
          type: 'topic_violation',
          severity: 'medium',
          timestamp: new Date()
        }
      ];

      (prisma.message.findMany as jest.Mock).mockResolvedValue(
        mockViolations.map(v => ({
          conversationId: v.conversationId,
          metadata: { guardrailViolation: v }
        }))
      );

      const guardrailsRoute = await import('../../../api/admin/guardrails/route');
      const { GET } = guardrailsRoute;
      const request = new NextRequest('http://localhost:3000/api/admin/guardrails');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.violations).toHaveLength(2);
      expect(data.violations[0].type).toBe('jailbreak_attempt');
      expect(data.statistics.total).toBe(2);
      expect(data.statistics.byType.jailbreak_attempt).toBe(1);
    });
  });
});