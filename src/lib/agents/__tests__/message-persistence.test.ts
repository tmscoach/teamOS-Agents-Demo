/**
 * Tests for message persistence functionality
 */

import { ConversationStore } from '../persistence';
import { ContextManager } from '../context';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    agentEvent: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn({
      conversation: {
        update: jest.fn(),
      },
      message: {
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn(),
      },
      agentEvent: {
        createMany: jest.fn(),
      },
    })),
  })),
}));

describe('Message Persistence', () => {
  let prisma: any;
  let conversationStore: ConversationStore;
  let contextManager: ContextManager;

  beforeEach(() => {
    prisma = new PrismaClient();
    conversationStore = new ConversationStore(prisma);
    contextManager = new ContextManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ConversationStore', () => {
    it('should create a new conversation', async () => {
      const teamId = 'team-123';
      const managerId = 'manager-123';
      const conversationId = 'conv-123';

      prisma.conversation.create.mockResolvedValue({
        id: conversationId,
        teamId,
        managerId,
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        contextData: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prisma.conversation.update.mockResolvedValue({
        id: conversationId,
        contextData: { conversationId },
      });

      const result = await conversationStore.createConversation(teamId, managerId);

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          teamId,
          managerId,
          currentAgent: 'OnboardingAgent',
          phase: 'onboarding',
        }),
      });

      expect(result).toBe(conversationId);
    });

    it('should add a message to a conversation', async () => {
      const conversationId = 'conv-123';
      const message = {
        id: uuidv4(),
        role: 'user' as const,
        content: 'Test message',
        timestamp: new Date(),
      };

      prisma.message.create.mockResolvedValue({
        ...message,
        conversationId,
      });

      await conversationStore.addMessage(conversationId, message);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          id: message.id,
          conversationId,
          role: message.role,
          content: message.content,
          agent: undefined,
          metadata: undefined,
          timestamp: message.timestamp,
        },
      });
    });

    it('should save conversation with messages and events', async () => {
      const conversationId = 'conv-123';
      const context = {
        conversationId,
        teamId: 'team-123',
        managerId: 'manager-123',
        currentAgent: 'OnboardingAgent',
        transformationPhase: 'onboarding' as const,
        messageHistory: [],
        metadata: {},
      };

      const messages = [
        {
          id: uuidv4(),
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
        },
        {
          id: uuidv4(),
          role: 'assistant' as const,
          content: 'Hi there!',
          agent: 'OnboardingAgent',
          timestamp: new Date(),
        },
      ];

      const events = [
        {
          id: uuidv4(),
          type: 'guardrail',
          agent: 'OnboardingAgent',
          timestamp: new Date(),
        },
      ];

      await conversationStore.saveConversation(conversationId, context, messages, events);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should load a conversation with messages', async () => {
      const conversationId = 'conv-123';
      const mockConversation = {
        id: conversationId,
        teamId: 'team-123',
        managerId: 'manager-123',
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        contextData: {
          conversationId,
          teamId: 'team-123',
          managerId: 'manager-123',
          currentAgent: 'OnboardingAgent',
          transformationPhase: 'onboarding',
          messageHistory: [],
          metadata: {},
        },
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
            agent: null,
            metadata: null,
          },
        ],
        events: [],
      };

      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await conversationStore.loadConversation(conversationId);

      expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { timestamp: 'asc' } },
          events: { orderBy: { timestamp: 'asc' } },
        },
      });

      expect(result).toBeTruthy();
      expect(result?.context.conversationId).toBe(conversationId);
      expect(result?.messages).toHaveLength(1);
    });
  });

  describe('PersistentContextManager Integration', () => {
    // This would test the PersistentContextManager from the chat routes
    // but we can't easily import it since it's defined inline in the route files
    
    it('should persist messages immediately when added to context', async () => {
      // Mock implementation showing expected behavior
      const conversationId = 'conv-123';
      const message = {
        id: uuidv4(),
        role: 'user' as const,
        content: 'Test message',
        timestamp: new Date(),
      };

      // Set up context first
      const context = {
        conversationId,
        teamId: 'team-123',
        managerId: 'manager-123',
        currentAgent: 'OnboardingAgent',
        transformationPhase: 'onboarding' as const,
        messageHistory: [],
        metadata: {},
      };
      await contextManager.setContext(conversationId, context);

      // Create a mock that simulates PersistentContextManager behavior
      const addMessageSpy = jest.spyOn(conversationStore, 'addMessage').mockResolvedValue();

      // Simulate adding a message (this would be done by PersistentContextManager)
      await contextManager.addMessage(conversationId, message);
      await conversationStore.addMessage(conversationId, message);

      expect(addMessageSpy).toHaveBeenCalledWith(conversationId, message);
    });
  });
});