import { GET } from '@/app/api/admin/conversations/route';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    conversation: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
    guardrailCheck: {
      count: jest.fn(),
    },
  },
}));

describe('/api/admin/conversations', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null } as any);

      const response = await GET();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return conversations with related data', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

      const mockConversations = [
        {
          id: 'conv-1',
          userId: 'user-1',
          teamId: 'team-1',
          currentAgentName: 'OnboardingAgent',
          status: 'active',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: { phase: 'discovery' },
          user: { id: 'user-1', email: 'user1@example.com' },
          team: { id: 'team-1', name: 'Test Team' },
          _count: { messages: 5, guardrailChecks: 1 },
        },
        {
          id: 'conv-2',
          userId: 'user-2',
          teamId: 'team-2',
          currentAgentName: 'EngagementAgent',
          status: 'completed',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          metadata: { phase: 'implementation' },
          user: { id: 'user-2', email: 'user2@example.com' },
          team: { id: 'team-2', name: 'Another Team' },
          _count: { messages: 10, guardrailChecks: 2 },
        },
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject({
        id: 'conv-1',
        userId: 'user-1',
        teamId: 'team-1',
        currentAgent: 'OnboardingAgent',
        status: 'active',
        messageCount: 5,
        guardrailViolations: 1,
        userEmail: 'user1@example.com',
        teamName: 'Test Team',
      });

      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: true,
          team: true,
          _count: {
            select: {
              messages: true,
              guardrailChecks: true,
            },
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
      mockPrisma.conversation.findMany.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch conversations');
    });

    it('should handle conversations without user or team', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);

      const mockConversations = [
        {
          id: 'conv-3',
          userId: 'user-3',
          teamId: null,
          currentAgentName: 'OnboardingAgent',
          status: 'active',
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          metadata: {},
          user: null,
          team: null,
          _count: { messages: 3, guardrailChecks: 0 },
        },
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data[0]).toMatchObject({
        id: 'conv-3',
        userEmail: 'Unknown',
        teamName: 'No Team',
      });
    });

    it('should handle empty conversation list', async () => {
      mockAuth.mockResolvedValue({ userId: 'test-user-id' } as any);
      mockPrisma.conversation.findMany.mockResolvedValue([]);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });
  });
});