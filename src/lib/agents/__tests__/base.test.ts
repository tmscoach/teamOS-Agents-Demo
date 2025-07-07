/**
 * Unit tests for base Agent class
 */

import { Agent } from '../base';
import {
  AgentConfig,
  AgentContext,
  AgentResponse,
  GuardrailResult,
} from '../types';

// Mock implementation for testing
class TestAgent extends Agent {
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const events = [];

    // Test guardrails
    try {
      const guardrailEvents = await this.validateInput(message, context);
      events.push(...guardrailEvents);
    } catch (error) {
      return this.buildResponse(context, events, {
        message: error instanceof Error ? error.message : 'Guardrail failed',
      });
    }

    // Test tool calling
    if (message.includes('call tool')) {
      const { callEvent, outputEvent } = await this.callTool(
        'test-tool',
        { input: message },
        context
      );
      events.push(callEvent, outputEvent);
    }

    // Test handoff
    if (message.includes('handoff to')) {
      const targetAgent = message.split('handoff to ')[1];
      try {
        const handoffEvent = await this.executeHandoff(
          targetAgent,
          'User requested handoff',
          context
        );
        events.push(handoffEvent);
        return this.buildResponse(context, events, {
          handoff: {
            targetAgent,
            reason: 'User requested handoff',
          },
        });
      } catch (error) {
        return this.buildResponse(context, events, {
          message: error instanceof Error ? error.message : 'Handoff failed',
        });
      }
    }

    return this.buildResponse(context, events, {
      message: `Echo: ${message}`,
    });
  }
}

describe('Agent Base Class', () => {
  let agent: TestAgent;
  let context: AgentContext;

  beforeEach(() => {
    const config: AgentConfig = {
      name: 'TestAgent',
      description: 'A test agent',
      handoffDescription: 'Handles test scenarios',
      instructions: 'Echo messages back to the user',
      tools: [
        {
          name: 'test-tool',
          description: 'A test tool',
          parameters: {
            type: 'object',
            properties: {
              input: { type: 'string' },
            },
          },
          execute: async (params) => ({
            success: true,
            output: `Tool executed with: ${params.input}`,
          }),
        },
      ],
      handoffs: [
        {
          targetAgent: 'OtherAgent',
        },
      ],
      inputGuardrails: [
        {
          name: 'no-profanity',
          description: 'Block profanity',
          validate: async (input) => ({
            passed: !input.includes('bad-word'),
            reason: input.includes('bad-word') ? 'Profanity detected' : undefined,
          }),
        },
      ],
    };

    agent = new TestAgent(config);
    context = {
      teamId: 'team-123',
      managerId: 'manager-456',
      transformationPhase: 'onboarding',
      currentAgent: 'TestAgent',
      conversationId: 'conv-789',
      messageHistory: [],
      metadata: {},
    };
  });

  describe('processMessage', () => {
    it('should process a simple message', async () => {
      const response = await agent.processMessage('Hello', context);

      expect(response.message).toBe('Echo: Hello');
      // Should have guardrail event and message event
      expect(response.events).toHaveLength(2);
      expect(response.events[0].type).toBe('guardrail');
      expect(response.events[1].type).toBe('message');
    });

    it('should fail guardrail validation', async () => {
      const response = await agent.processMessage('bad-word test', context);

      expect(response.message).toContain('Guardrail no-profanity failed');
      // Should have at least a message event
      expect(response.events.length).toBeGreaterThan(0);
    });

    it('should execute tool calls', async () => {
      const response = await agent.processMessage('please call tool', context);

      expect(response.events.some(e => e.type === 'tool_call')).toBe(true);
      expect(response.events.some(e => e.type === 'tool_output')).toBe(true);
      
      const toolOutput = response.events.find(e => e.type === 'tool_output');
      expect(toolOutput).toBeDefined();
    });

    it('should handle handoffs', async () => {
      const response = await agent.processMessage('handoff to OtherAgent', context);

      expect(response.handoff).toEqual({
        targetAgent: 'OtherAgent',
        reason: 'User requested handoff',
      });
      
      const handoffEvent = response.events.find(e => e.type === 'handoff');
      expect(handoffEvent).toBeDefined();
    });

    it('should fail handoff to non-configured agent', async () => {
      const response = await agent.processMessage('handoff to UnknownAgent', context);

      expect(response.message).toContain('No handoff configured');
      expect(response.handoff).toBeUndefined();
    });
  });

  describe('getInstructions', () => {
    it('should return static instructions', () => {
      const instructions = agent['getInstructions'](context);
      expect(instructions).toBe('Echo messages back to the user');
    });

    it('should return dynamic instructions', () => {
      const dynamicAgent = new TestAgent({
        name: 'DynamicAgent',
        description: 'Test',
        handoffDescription: 'Test',
        instructions: (ctx) => `Agent for team ${ctx.teamId}`,
      });

      const instructions = dynamicAgent['getInstructions'](context);
      expect(instructions).toBe('Agent for team team-123');
    });
  });

  describe('tool management', () => {
    it('should find tool by name', () => {
      const tool = agent['getTool']('test-tool');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('test-tool');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = agent['getTool']('non-existent');
      expect(tool).toBeUndefined();
    });
  });

  describe('handoff management', () => {
    it('should check if handoff is allowed', () => {
      expect(agent['canHandoffTo']('OtherAgent')).toBe(true);
      expect(agent['canHandoffTo']('UnknownAgent')).toBe(false);
    });
  });
});