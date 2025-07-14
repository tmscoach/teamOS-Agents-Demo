import { GET } from '../route';
import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/db/prisma');

describe('GET /api/agents/chat/recent', () => {
  const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if user not found in database', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return empty result if no conversations found', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'db-user-123' });
    (prisma.conversation.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBeNull();
    expect(data.messages).toEqual([]);
  });

  it('should filter by agent name when provided', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'db-user-123' });

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent?agent=OnboardingAgent');

    await GET(request);

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        managerId: 'db-user-123',
        currentAgent: 'OnboardingAgent',
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  });

  it('should not filter by agent when not provided', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'db-user-123' });

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    await GET(request);

    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        managerId: 'db-user-123',
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  });

  it('should return conversation with messages when found', async () => {
    const mockConversation = {
      id: 'conv-123',
      currentAgent: 'OnboardingAgent',
      phase: 'onboarding',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          agent: null,
          timestamp: new Date('2024-01-01'),
          metadata: null,
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          agent: 'OnboardingAgent',
          timestamp: new Date('2024-01-02'),
          metadata: { extra: 'data' },
        },
      ],
    };

    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'db-user-123' });
    (prisma.conversation.findFirst as jest.Mock).mockResolvedValueOnce(mockConversation);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBe('conv-123');
    expect(data.messages).toHaveLength(2);
    expect(data.messages[0]).toEqual({
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      agent: null,
      timestamp: mockConversation.messages[0].timestamp.toISOString(),
      metadata: null,
    });
    expect(data.messages[1]).toEqual({
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi there!',
      agent: 'OnboardingAgent',
      timestamp: mockConversation.messages[1].timestamp.toISOString(),
      metadata: { extra: 'data' },
    });
  });

  it('should handle errors gracefully', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.message).toBe('Database connection failed');
  });

  it('should handle conversation without messages', async () => {
    const mockConversation = {
      id: 'conv-empty',
      currentAgent: 'OnboardingAgent',
      phase: 'onboarding',
      messages: [],
    };

    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'db-user-123' });
    (prisma.conversation.findFirst as jest.Mock).mockResolvedValueOnce(mockConversation);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/recent');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversationId).toBe('conv-empty');
    expect(data.messages).toEqual([]);
  });
});