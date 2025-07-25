import { OpenAIDebriefAgent } from '../openai-debrief-agent';
import { AgentContext } from '../../types';

describe('OpenAIDebriefAgent', () => {
  let agent: OpenAIDebriefAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new OpenAIDebriefAgent({
      apiKey: 'test-key',
      tools: {},
    });

    mockContext = {
      conversationId: 'test-123',
      currentAgent: 'DebriefAgent',
      teamId: 'team-123',
      managerId: 'manager-123',
      variables: {},
      metadata: {},
      messageHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('buildSystemMessage', () => {
    it('should remove IMMEDIATELY subscription check instruction', () => {
      // Mock the parent buildSystemMessage
      const parentBuildSystemMessage = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(agent)),
        'buildSystemMessage'
      ).mockReturnValue(`
        You are the Debrief Agent.
        IMMEDIATELY use tms_get_dashboard_subscriptions to check for completed assessments.
        Other instructions here.
      `);

      const result = agent['buildSystemMessage'](mockContext);

      expect(result).not.toContain('IMMEDIATELY use tms_get_dashboard_subscriptions');
      expect(result).toContain('Wait for specific instructions about when to check for assessments');
      expect(result).toContain('You are the Debrief Agent');
      expect(result).toContain('Other instructions here');

      parentBuildSystemMessage.mockRestore();
    });

    it('should handle multiple occurrences of the instruction', () => {
      const parentBuildSystemMessage = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(agent)),
        'buildSystemMessage'
      ).mockReturnValue(`
        IMMEDIATELY use tms_get_dashboard_subscriptions to check for completed assessments.
        Some other text.
        IMMEDIATELY use tms_get_dashboard_subscriptions to check for completed assessments.
      `);

      const result = agent['buildSystemMessage'](mockContext);

      // Should not contain any instance of the instruction
      expect(result.match(/IMMEDIATELY use tms_get_dashboard_subscriptions/g)).toBeNull();
      // Should contain two instances of the replacement
      const replacements = result.match(/Wait for specific instructions about when to check for assessments/g);
      expect(replacements).toHaveLength(2);

      parentBuildSystemMessage.mockRestore();
    });

    it('should preserve rest of the system message unchanged', () => {
      const originalMessage = `
## Your Role
You provide comprehensive debriefs for completed assessments.

## CRITICAL: Proactive Report Detection & Performance
When conversation starts:
1. IMMEDIATELY use tms_get_dashboard_subscriptions to check for completed assessments
2. Other important instructions

## TMP Debrief Process (MUST FOLLOW)
When conducting a TMP debrief after user confirms:
1. Skip to objectives gathering immediately
2. EXTRACT and STORE each response
      `;

      const parentBuildSystemMessage = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(agent)),
        'buildSystemMessage'
      ).mockReturnValue(originalMessage);

      const result = agent['buildSystemMessage'](mockContext);

      expect(result).toContain('## Your Role');
      expect(result).toContain('You provide comprehensive debriefs');
      expect(result).toContain('## TMP Debrief Process (MUST FOLLOW)');
      expect(result).toContain('EXTRACT and STORE each response');
      expect(result).not.toContain('IMMEDIATELY use tms_get_dashboard_subscriptions');

      parentBuildSystemMessage.mockRestore();
    });
  });

  describe('constructor', () => {
    it('should create an instance with proper configuration', () => {
      expect(agent).toBeInstanceOf(OpenAIDebriefAgent);
      expect(agent.name).toBe('DebriefAgent');
      expect(agent.description).toContain('assessment debriefs');
    });
  });
});