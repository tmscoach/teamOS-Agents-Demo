import { ContextManager } from '@/src/lib/agents/context-manager';
import { ConversationStore } from '@/src/lib/agents/conversation-store';
import { Message } from '@/src/lib/agents/types';

// Since PersistentContextManager is defined in the route file, we'll need to recreate it here for testing
class PersistentContextManager extends ContextManager {
  private conversationStore: ConversationStore;

  constructor(conversationStore: ConversationStore) {
    super();
    this.conversationStore = conversationStore;
  }

  async getContext(conversationId: string) {
    let context = await super.getContext(conversationId);
    
    if (!context) {
      const conversationData = await this.conversationStore.loadConversation(conversationId);
      if (conversationData) {
        context = conversationData.context;
        await this.setContext(conversationId, context);
      }
    }
    
    return context;
  }

  async addMessage(conversationId: string, message: Message): Promise<void> {
    await super.addMessage(conversationId, message);
    
    try {
      await this.conversationStore.addMessage(conversationId, message);
    } catch (error) {
      throw error;
    }
  }
}

// Mock ConversationStore
jest.mock('@/src/lib/agents/conversation-store');

describe('PersistentContextManager', () => {
  let contextManager: PersistentContextManager;
  let mockConversationStore: jest.Mocked<ConversationStore>;

  beforeEach(() => {
    // Create a mock conversation store
    mockConversationStore = {
      loadConversation: jest.fn(),
      addMessage: jest.fn(),
      saveConversation: jest.fn(),
      updateContext: jest.fn(),
      addEvent: jest.fn(),
    } as any;

    // Create PersistentContextManager with mock
    contextManager = new PersistentContextManager(mockConversationStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getContext', () => {
    it('should return context from memory if available', async () => {
      const conversationId = 'test-conversation-1';
      const testContext = {
        conversationId,
        currentAgent: 'test-agent',
        messages: [],
        metadata: {},
      };

      // Set context in memory first
      await contextManager.setContext(conversationId, testContext);

      // Get context should return from memory without loading from DB
      const result = await contextManager.getContext(conversationId);

      expect(result).toEqual(testContext);
      expect(mockConversationStore.loadConversation).not.toHaveBeenCalled();
    });

    it('should load from database if not in memory', async () => {
      const conversationId = 'test-conversation-2';
      const testContext = {
        conversationId,
        currentAgent: 'test-agent',
        messages: [],
        metadata: {},
      };

      // Mock database load
      mockConversationStore.loadConversation.mockResolvedValue({
        id: conversationId,
        context: testContext,
        messages: [],
        events: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      // Get context should load from database
      const result = await contextManager.getContext(conversationId);

      expect(result).toEqual(testContext);
      expect(mockConversationStore.loadConversation).toHaveBeenCalledWith(conversationId);
    });

    it('should return null if conversation not found', async () => {
      const conversationId = 'non-existent';

      // Mock database load returning null
      mockConversationStore.loadConversation.mockResolvedValue(null);

      const result = await contextManager.getContext(conversationId);

      expect(result).toBeNull();
      expect(mockConversationStore.loadConversation).toHaveBeenCalledWith(conversationId);
    });
  });

  describe('addMessage', () => {
    it('should add message to both memory and database', async () => {
      const conversationId = 'test-conversation-3';
      const message: Message = {
        role: 'user',
        content: 'Hello, world!',
        agent: 'test-agent',
        timestamp: new Date(),
      };

      // Mock successful database save
      mockConversationStore.addMessage.mockResolvedValue(undefined);

      // Add message
      await contextManager.addMessage(conversationId, message);

      // Should save to database
      expect(mockConversationStore.addMessage).toHaveBeenCalledWith(conversationId, message);
    });

    it('should throw error if database save fails', async () => {
      const conversationId = 'test-conversation-4';
      const message: Message = {
        role: 'assistant',
        content: 'Test response',
        agent: 'test-agent',
        timestamp: new Date(),
      };

      // Mock database save failure
      const error = new Error('Database connection failed');
      mockConversationStore.addMessage.mockRejectedValue(error);

      // Should throw error
      await expect(contextManager.addMessage(conversationId, message))
        .rejects.toThrow('Database connection failed');

      expect(mockConversationStore.addMessage).toHaveBeenCalledWith(conversationId, message);
    });

    it('should handle messages with special characters', async () => {
      const conversationId = 'test-conversation-5';
      const message: Message = {
        role: 'user',
        content: 'I HATE YOU AND THIS FUCKING STUPID SYSTEM',
        agent: 'test-agent',
        timestamp: new Date(),
      };

      mockConversationStore.addMessage.mockResolvedValue(undefined);

      await contextManager.addMessage(conversationId, message);

      expect(mockConversationStore.addMessage).toHaveBeenCalledWith(conversationId, message);
    });
  });

  describe('integration with parent ContextManager', () => {
    it('should maintain message history in memory', async () => {
      const conversationId = 'test-conversation-6';
      const context = {
        conversationId,
        currentAgent: 'test-agent',
        messages: [],
        metadata: {},
      };

      // Set initial context
      await contextManager.setContext(conversationId, context);

      // Add multiple messages
      const messages: Message[] = [
        { role: 'user', content: 'First message', agent: 'user', timestamp: new Date() },
        { role: 'assistant', content: 'First response', agent: 'test-agent', timestamp: new Date() },
        { role: 'user', content: 'Second message', agent: 'user', timestamp: new Date() },
      ];

      mockConversationStore.addMessage.mockResolvedValue(undefined);

      for (const msg of messages) {
        await contextManager.addMessage(conversationId, msg);
      }

      // Get context to verify messages are in memory
      const updatedContext = await contextManager.getContext(conversationId);
      expect(updatedContext?.messages).toHaveLength(3);
      expect(updatedContext?.messages).toEqual(messages);
    });
  });
});