/**
 * Tests for admin conversations API endpoints
 */

// @jest-environment node

import { NextRequest } from 'next/server';
import { GET as getConversationDetail } from '../[id]/route';
import { currentUser } from '@clerk/nextjs/server';

// Mock Next.js server runtime
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string) => ({
    url,
    method: 'GET',
    headers: new Map(),
  })),
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

interface MockUser {
  id: string;
  emailAddresses?: Array<{ emailAddress: string }>;
  fullName?: string;
  firstName?: string;
}

describe('Admin Conversations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/conversations/[id]', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/conversations/test-id');
      const response = await getConversationDetail(req, { params: Promise.resolve({ id: 'test-id' }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 if user is not an admin', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'user-123' } as MockUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        clerkId: 'user-123',
        role: 'USER',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/conversations/test-id');
      const response = await getConversationDetail(req, { params: Promise.resolve({ id: 'test-id' }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Admin access required');
    });

    it('should return 404 if conversation not found', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'admin-123' } as MockUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-123',
        clerkId: 'admin-123',
        role: 'ADMIN',
      });
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/conversations/non-existent');
      const response = await getConversationDetail(req, { params: Promise.resolve({ id: 'non-existent' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Conversation not found');
    });

    it('should return conversation details for admin users', async () => {
      const mockConversation = {
        id: 'conv-123',
        teamId: 'team-123',
        managerId: 'manager-123',
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
        contextData: { metadata: { test: true } },
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date('2025-01-01T10:00:00'),
            agent: null,
          },
          {
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there!',
            timestamp: new Date('2025-01-01T10:00:30'),
            agent: 'OnboardingAgent',
          },
        ],
        manager: {
          id: 'manager-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
        team: {
          id: 'team-123',
          name: 'Engineering Team',
          department: 'Tech',
        },
        events: [
          {
            id: 'event-1',
            type: 'guardrail',
            agent: 'OnboardingAgent',
            content: '{"type":"guardrail","guardrailName":"MessageLength","result":{"passed":true}}',
            timestamp: new Date('2025-01-01T10:00:15'),
          },
        ],
        guardrailChecks: [
          {
            id: 'check-1',
            guardrailType: 'MessageLength',
            passed: true,
            input: 'Hello',
            reasoning: '{"passed":true}',
            timestamp: new Date('2025-01-01T10:00:15'),
          },
        ],
        capturedVariables: [
          {
            name: 'userName',
            value: 'John',
            confidence: 0.95,
            timestamp: new Date('2025-01-01T10:01:00'),
          },
        ],
      };

      mockCurrentUser.mockResolvedValue({ id: 'admin-123' } as MockUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-123',
        clerkId: 'admin-123',
        role: 'ADMIN',
      });
      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const req = new NextRequest('http://localhost:3000/api/admin/conversations/conv-123');
      const response = await getConversationDetail(req, { params: Promise.resolve({ id: 'conv-123' }) });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toMatchObject({
        id: 'conv-123',
        managerId: 'manager-123',
        managerName: 'John Doe',
        managerEmail: 'john@example.com',
        teamId: 'team-123',
        teamName: 'Engineering Team',
        teamDepartment: 'Tech',
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        messages: expect.arrayContaining([
          expect.objectContaining({
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
          }),
          expect.objectContaining({
            id: 'msg-2',
            role: 'assistant',
            content: 'Hi there!',
            agent: 'OnboardingAgent',
          }),
        ]),
        events: expect.arrayContaining([
          expect.objectContaining({
            id: 'event-1',
            type: 'guardrail',
            agent: 'OnboardingAgent',
          }),
        ]),
        guardrailChecks: expect.arrayContaining([
          expect.objectContaining({
            id: 'check-1',
            guardrailType: 'MessageLength',
            passed: true,
          }),
        ]),
        capturedVariables: expect.arrayContaining([
          expect.objectContaining({
            name: 'userName',
            value: 'John',
            confidence: 0.95,
          }),
        ]),
      });
    });

    it('should handle database connection errors with retries', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'admin-123' } as MockUser);
      
      // Simulate database connection errors that succeed on retry
      let attempts = 0;
      mockPrisma.user.findUnique.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Can't reach database server");
        }
        return {
          id: 'admin-123',
          clerkId: 'admin-123',
          role: 'ADMIN',
        };
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-123',
        teamId: 'team-123',
        managerId: 'manager-123',
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        contextData: {},
        messages: [],
        manager: { id: 'manager-123', name: 'Test', email: 'test@example.com' },
        team: { id: 'team-123', name: 'Test Team', department: 'Test' },
        events: [],
        guardrailChecks: [],
        capturedVariables: [],
      });

      const req = new NextRequest('http://localhost:3000/api/admin/conversations/conv-123');
      const response = await getConversationDetail(req, { params: Promise.resolve({ id: 'conv-123' }) });

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(3); // Two failures + one success
    });

    it('should return 503 for persistent database connection errors', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'admin-123' } as MockUser);
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Can't reach database server"));

      const req = new NextRequest('http://localhost:3000/api/admin/conversations/conv-123');
      const response = await getConversationDetail(req, { params: Promise.resolve({ id: 'conv-123' }) });

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe('Database connection error');
      expect(data.message).toBe('Unable to connect to database. Please try again later.');
    });
  });
});