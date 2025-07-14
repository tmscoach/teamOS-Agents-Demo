import { GET } from '../[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConversationStore } from '@/src/lib/agents';
import { prisma } from '@/lib/db/prisma';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/src/lib/agents');
jest.mock('@/lib/db/prisma');

describe('GET /api/agents/chat/conversation/[id]', () => {
  const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
  const mockLoadConversation = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (ConversationStore as jest.Mock).mockImplementation(() => ({
      loadConversation: mockLoadConversation,
    }));
  });

  it('should return 401 if user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if conversation not found', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Conversation not found');
  });

  it('should return 404 if user not found in database', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockResolvedValueOnce({
      context: { conversationId: 'conv-123' },
      messages: [],
      events: [],
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 403 if user does not have access to conversation', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockResolvedValueOnce({
      context: { conversationId: 'conv-123' },
      messages: [],
      events: [],
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'db-user-123',
      managedTeams: [],
      teamId: null,
    });
    
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'conv-123',
      teamId: 'team-456',
      managerId: 'manager-456',
    });

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Access denied');
  });

  it('should return conversation data if user is the manager', async () => {
    const mockConversationData = {
      context: {
        conversationId: 'conv-123',
        currentAgent: 'OnboardingAgent',
        transformationPhase: 'onboarding',
        metadata: { test: 'data' },
      },
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello',
          agent: null,
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          agent: 'OnboardingAgent',
          timestamp: new Date(),
          metadata: null,
        },
      ],
      events: [
        {
          type: 'conversation_started',
          timestamp: new Date(),
        },
      ],
    };

    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockResolvedValueOnce(mockConversationData);
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'db-user-123',
      managedTeams: [],
      teamId: null,
    });
    
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'conv-123',
      teamId: 'team-456',
      managerId: 'db-user-123', // User is the manager
    });

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('conv-123');
    expect(data.currentAgent).toBe('OnboardingAgent');
    expect(data.phase).toBe('onboarding');
    expect(data.messages).toHaveLength(2);
    expect(data.events).toHaveLength(1);
    expect(data.metadata).toEqual({ test: 'data' });
  });

  it('should return conversation data if user manages the team', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockResolvedValueOnce({
      context: { conversationId: 'conv-123' },
      messages: [],
      events: [],
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'db-user-123',
      managedTeams: [{ id: 'team-456' }], // User manages this team
      teamId: null,
    });
    
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'conv-123',
      teamId: 'team-456',
      managerId: 'manager-789',
    });

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    
    expect(response.status).toBe(200);
  });

  it('should return conversation data if user is part of the team', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockResolvedValueOnce({
      context: { conversationId: 'conv-123' },
      messages: [],
      events: [],
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'db-user-123',
      managedTeams: [],
      teamId: 'team-456', // User is part of the team
    });
    
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'conv-123',
      teamId: 'team-456',
      managerId: 'manager-789',
    });

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    
    expect(response.status).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-123' } as any);
    mockLoadConversation.mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/agents/chat/conversation/conv-123');
    const params = Promise.resolve({ id: 'conv-123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.message).toBe('Database error');
  });
});