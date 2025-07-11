import { OnboardingGuardrails, GuardrailConfig } from '../onboarding-guardrails';
import { AgentContext } from '../../types';

describe('OnboardingGuardrails', () => {
  const mockContext: AgentContext = {
    conversationId: 'test-123',
    agentName: 'OnboardingAgent',
    messageHistory: [
      // Add a previous user message so it's not the first message
      {
        id: '0',
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      }
    ],
    metadata: {
      onboarding: {
        startTime: new Date()
      }
    }
  };

  describe('createGuardrails with configuration', () => {
    it('should use default values when no config is provided', async () => {
      const guardrails = OnboardingGuardrails.createGuardrails();
      const messageLengthGuardrail = guardrails.find(g => g.name === 'MessageLength');
      
      // Test with a short message that should fail with default config
      const result = await messageLengthGuardrail!.validate('Hi', mockContext);
      expect(result.passed).toBe(true); // Special greeting allowed
      
      // Test with short non-greeting
      const result2 = await messageLengthGuardrail!.validate('xyz', mockContext);
      expect(result2.passed).toBe(false);
      expect(result2.metadata?.min).toBe(10); // Default minimum
    });

    it('should use custom config values when provided', async () => {
      const config: GuardrailConfig = {
        minMessageLength: 1,
        maxMessageLength: 500
      };
      
      const guardrails = OnboardingGuardrails.createGuardrails(config);
      const messageLengthGuardrail = guardrails.find(g => g.name === 'MessageLength');
      
      // Test with single character (should pass with min=1)
      const result = await messageLengthGuardrail!.validate('x', mockContext);
      expect(result.passed).toBe(true);
      
      // Test with message over 500 chars
      const longMessage = 'a'.repeat(501);
      const result2 = await messageLengthGuardrail!.validate(longMessage, mockContext);
      expect(result2.passed).toBe(false);
      expect(result2.metadata?.max).toBe(500);
    });

    it('should allow short responses when agent asks for role', async () => {
      const config: GuardrailConfig = {
        minMessageLength: 1
      };
      
      const contextWithRoleQuestion: AgentContext = {
        ...mockContext,
        messageHistory: [
          {
            id: '1',
            role: 'assistant',
            content: 'Next, could you tell me your role in the organization?',
            timestamp: new Date()
          }
        ]
      };
      
      const guardrails = OnboardingGuardrails.createGuardrails(config);
      const messageLengthGuardrail = guardrails.find(g => g.name === 'MessageLength');
      
      // Test with "ceo" (should pass)
      const result = await messageLengthGuardrail!.validate('ceo', contextWithRoleQuestion);
      expect(result.passed).toBe(true);
    });

    it('should disable topic relevance when configured', async () => {
      const config: GuardrailConfig = {
        enableTopicRelevance: false
      };
      
      const guardrails = OnboardingGuardrails.createGuardrails(config);
      const topicGuardrail = guardrails.find(g => g.name === 'TopicRelevance');
      
      // Test with off-topic content (should pass when disabled)
      const result = await topicGuardrail!.validate('Who is Michael Jackson?', mockContext);
      expect(result.passed).toBe(true);
    });

    it('should disable profanity check when configured', async () => {
      const config: GuardrailConfig = {
        enableProfanityCheck: false
      };
      
      const guardrails = OnboardingGuardrails.createGuardrails(config);
      const professionalismGuardrail = guardrails.find(g => g.name === 'Professionalism');
      
      // Test with mild profanity (should pass when disabled)
      const result = await professionalismGuardrail!.validate('This is damn frustrating', mockContext);
      expect(result.passed).toBe(true);
    });

    it('should use custom conversation time limit', async () => {
      const config: GuardrailConfig = {
        maxConversationTime: 30 * 60 * 1000 // 30 minutes
      };
      
      const guardrails = OnboardingGuardrails.createGuardrails(config);
      const timeGuardrail = guardrails.find(g => g.name === 'ConversationTimeLimit');
      
      // Create context with old start time (35 minutes ago)
      const oldContext: AgentContext = {
        ...mockContext,
        metadata: {
          onboarding: {
            startTime: new Date(Date.now() - 35 * 60 * 1000)
          }
        }
      };
      
      const result = await timeGuardrail!.validate('test', oldContext);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('30 minutes');
    });
  });
});