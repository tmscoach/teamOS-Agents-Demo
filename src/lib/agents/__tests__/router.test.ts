/**
 * Unit tests for AgentRouter
 */

import { AgentRouter } from '../router';
import { Agent } from '../base';
import {
  AgentConfig,
  AgentContext,
  AgentResponse,
  AgentEvent,
} from '../types';

// Mock agent implementation
class MockAgent extends Agent {
  constructor(name: string, handoffs: string[] = []) {
    const config: AgentConfig = {
      name,
      description: `Mock ${name}`,
      handoffDescription: `Handles ${name} tasks`,
      instructions: 'Process messages',
      handoffs: handoffs.map(target => ({ targetAgent: target })),
    };
    super(config);
  }

  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const events: AgentEvent[] = [];

    // Simple handoff logic for testing
    if (message.includes('transfer to ')) {
      const targetAgent = message.split('transfer to ')[1];
      if (this.canHandoffTo(targetAgent)) {
        const handoffEvent = await this.executeHandoff(
          targetAgent,
          'User requested transfer',
          context
        );
        events.push(handoffEvent);
        return this.buildResponse(context, events, {
          message: `Transferring to ${targetAgent}`,
          handoff: {
            targetAgent,
            reason: 'User requested transfer',
          },
        });
      }
    }

    return this.buildResponse(context, events, {
      message: `${this.name} processed: ${message}`,
    });
  }
}

describe('AgentRouter', () => {
  let router: AgentRouter;
  let agent1: MockAgent;
  let agent2: MockAgent;
  let context: AgentContext;

  beforeEach(async () => {
    router = new AgentRouter({ enableEventLogging: false });
    agent1 = new MockAgent('Agent1', ['Agent2']);
    agent2 = new MockAgent('Agent2', ['Agent1']);
    
    router.registerAgent(agent1);
    router.registerAgent(agent2);

    // Create context through router to ensure it's properly initialized
    context = await router.createConversation('team-123', 'manager-456', {
      initialAgent: 'Agent1',
    });
  });

  describe('agent registration', () => {
    it('should register agents', () => {
      const agent = router.getAgent('Agent1');
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('Agent1');
    });

    it('should throw error for duplicate registration', () => {
      expect(() => {
        router.registerAgent(new MockAgent('Agent1'));
      }).toThrow('Agent already registered: Agent1');
    });

    it('should unregister agents', () => {
      router.unregisterAgent('Agent1');
      expect(router.getAgent('Agent1')).toBeUndefined();
    });

    it('should throw error when unregistering non-existent agent', () => {
      expect(() => {
        router.unregisterAgent('NonExistent');
      }).toThrow('Agent not found: NonExistent');
    });
  });

  describe('message routing', () => {
    it('should route message to current agent', async () => {
      const response = await router.routeMessage('Hello', context);

      expect(response.message).toBe('Agent1 processed: Hello');
      expect(response.context.currentAgent).toBe('Agent1');
    });

    it('should throw error for non-existent agent', async () => {
      // Create a new context with non-existent agent
      const badContext = {
        ...context,
        currentAgent: 'NonExistent',
      };

      await expect(
        router.routeMessage('Hello', badContext)
      ).rejects.toThrow('Agent not found: NonExistent');
    });

    it('should add messages to history', async () => {
      const contextManager = router['contextManager'];
      jest.spyOn(contextManager, 'addMessage');

      await router.routeMessage('Test message', context);

      expect(contextManager.addMessage).toHaveBeenCalledTimes(2); // User + Assistant
    });
  });

  describe('handoff handling', () => {
    it('should handle agent handoff', async () => {
      const response = await router.routeMessage('transfer to Agent2', context);

      expect(response.message).toBe('Transferring to Agent2');
      expect(response.handoff).toEqual({
        targetAgent: 'Agent2',
        reason: 'User requested transfer',
      });
      expect(response.context.currentAgent).toBe('Agent2');
    });

    it('should throw error for handoff to non-existent agent', async () => {
      // Create an agent that can handoff to a non-existent agent
      const badAgent = new MockAgent('BadAgent', ['NonExistent']);
      router.registerAgent(badAgent);
      
      // Create new context for bad agent
      const badContext = await router.createConversation('team-123', 'manager-456', {
        initialAgent: 'BadAgent',
      });

      // The router should throw when attempting handoff to non-existent agent
      await expect(
        router.routeMessage('transfer to NonExistent', badContext)
      ).rejects.toThrow('Target agent not found: NonExistent');
    });
  });

  describe('conversation management', () => {
    it('should create new conversation', async () => {
      const newContext = await router.createConversation('team-456', 'manager-789', {
        initialAgent: 'Agent2',
        metadata: { source: 'test' },
      });

      expect(newContext.teamId).toBe('team-456');
      expect(newContext.managerId).toBe('manager-789');
      expect(newContext.currentAgent).toBe('Agent2');
      expect(newContext.metadata.source).toBe('test');
    });

    it('should process conversation message', async () => {
      const conversationId = context.conversationId;
      
      // Mock context retrieval
      jest.spyOn(router['contextManager'], 'getContext').mockResolvedValue(context);

      const response = await router.processConversationMessage(
        conversationId,
        'Test message'
      );

      expect(response.message).toBe('Agent1 processed: Test message');
    });
  });

  describe('handoff graph', () => {
    it('should return handoff graph', () => {
      const graph = router.getHandoffGraph();

      expect(graph).toEqual({
        Agent1: ['Agent2'],
        Agent2: ['Agent1'],
      });
    });
  });

  describe('handoff validation', () => {
    it('should validate correct handoffs', () => {
      const validation = router.validateHandoffs();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid handoffs', () => {
      const invalidAgent = new MockAgent('InvalidAgent', ['NonExistent']);
      router.registerAgent(invalidAgent);

      const validation = router.validateHandoffs();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        "Agent 'InvalidAgent' has handoff to non-existent agent 'NonExistent'"
      );
    });
  });

  describe('event handling', () => {
    it('should emit events during message processing', async () => {
      const events: any[] = [];
      
      router.on('message:processing', (event) => events.push({ type: 'processing', ...event }));
      router.on('message:processed', (event) => events.push({ type: 'processed', ...event }));

      await router.routeMessage('Hello', context);

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('processing');
      expect(events[1].type).toBe('processed');
    });

    it('should emit error events', async () => {
      const badContext = {
        ...context,
        currentAgent: 'NonExistent',
      };
      
      const errorHandler = jest.fn();
      router.on('message:error', errorHandler);

      await expect(router.routeMessage('Hello', badContext)).rejects.toThrow('Agent not found: NonExistent');
      
      expect(errorHandler).toHaveBeenCalled();
      expect(errorHandler.mock.calls[0][0]).toMatchObject({
        conversationId: badContext.conversationId,
        agent: 'NonExistent',
        error: 'Agent not found: NonExistent',
      });
    });
  });
});