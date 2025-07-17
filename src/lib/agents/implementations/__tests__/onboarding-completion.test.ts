/**
 * High-level tests for onboarding completion flow
 */

import { OnboardingAgent } from '../onboarding-agent';
import { AgentContext } from '../../types';
import { ConversationState } from '../onboarding-agent';

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: "Test response with Let's begin building something amazing together",
              role: 'assistant'
            }
          }]
        })
      }
    }
  }))
}));

// Mock the configuration loader
jest.mock('../../config/agent-config-loader', () => ({
  AgentConfigLoader: {
    loadConfiguration: jest.fn().mockResolvedValue({
      systemPrompt: 'Test system prompt',
      extractionRules: {
        user_name: { type: 'string', required: true },
        user_role: { type: 'string', required: true },
        team_size: { type: 'number', required: true },
        organization: { type: 'string', required: true },
        primary_challenge: { type: 'string', required: true }
      },
      guardrailConfig: {}
    }),
    getDefaultExtractionRules: jest.fn().mockReturnValue({})
  }
}));

// Mock knowledge base
jest.mock('../../knowledge-base', () => ({
  KnowledgeBase: {
    getInstance: jest.fn().mockReturnValue({
      searchTopics: jest.fn().mockResolvedValue([]),
      initialized: true
    })
  }
}));

describe('OnboardingAgent Completion Flow', () => {
  let agent: OnboardingAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new OnboardingAgent();
    mockContext = {
      conversationId: 'test-conv-123',
      teamId: 'test-team-123',
      currentAgent: 'OnboardingAgent',
      messageHistory: [],
      metadata: {
        onboarding: {
          capturedFields: {},
          requiredFieldsStatus: {
            user_name: false,
            user_role: false,
            team_size: false,
            organization: false,
            primary_challenge: false
          },
          isComplete: false,
          state: ConversationState.GREETING,
          startTime: new Date(),
          userRole: 'MANAGER',
          qualityMetrics: {
            rapportScore: 0,
            managerConfidence: 'low',
            completionPercentage: 0
          },
          stateTransitions: []
        }
      }
    };
  });

  describe('Metadata Update on Field Capture', () => {
    it('should set isComplete to true when all required fields are captured', async () => {
      // Simulate capturing all required fields
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'Test User',
        user_role: 'Engineering Manager',
        team_size: 5,
        organization: 'Test Corp',
        primary_challenge: 'Team alignment'
      };
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: true,
        team_size: true,
        organization: true,
        primary_challenge: true
      };

      // Process a message that should trigger completion
      await agent.processMessage('Thank you!', mockContext);

      // Verify isComplete is set
      expect(mockContext.metadata.onboarding?.isComplete).toBe(true);
    });

    it('should not set isComplete when some fields are missing', async () => {
      // Simulate partial field capture
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'Test User',
        team_size: 5
      };
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: false,
        team_size: true,
        organization: false,
        primary_challenge: false
      };

      await agent.processMessage('Thanks', mockContext);

      expect(mockContext.metadata.onboarding?.isComplete).toBe(false);
    });
  });

  describe('Completion Message Generation', () => {
    it('should generate completion message with exact phrase when all fields captured', async () => {
      // Set up completed onboarding
      mockContext.metadata.onboarding!.isComplete = true;
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'John Doe',
        user_role: 'Team Lead',
        team_size: 8,
        organization: 'Acme Corp',
        primary_challenge: 'Communication gaps'
      };

      const response = await agent.processMessage('Anything else?', mockContext);

      // Should contain the exact completion phrase
      expect(response.message).toBeDefined();
      expect(response.message).toContain("Let's begin building something amazing together");
      // Should not ask any questions
      if (response.message) {
        expect(response.message).not.toMatch(/\?$/);
        // Should mention captured information
        expect(response.message).toMatch(/John Doe|Team Lead|Acme Corp/);
      }
    });

    it('should not generate greeting when isComplete is true', async () => {
      mockContext.metadata.onboarding!.isComplete = true;
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'Test User',
        user_role: 'Manager',
        team_size: 5,
        organization: 'Test Inc',
        primary_challenge: 'Team growth'
      };

      const response = await agent.processMessage('Hello', mockContext);

      // Should not contain greeting phrases
      expect(response.message).not.toMatch(/Welcome to TMS|I'm OSmos/i);
      expect(response.message).not.toMatch(/nice to meet you/i);
    });
  });

  describe('System Message Override', () => {
    it('should use special system message when onboarding is complete', async () => {
      mockContext.metadata.onboarding!.isComplete = true;
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'Alice',
        user_role: 'VP Engineering',
        team_size: 20,
        organization: 'Tech Co',
        primary_challenge: 'Scaling challenges'
      };

      // Access protected method for testing
      const systemMessage = (agent as any).buildSystemMessage(mockContext);

      expect(systemMessage).toContain('ONBOARDING IS NOW COMPLETE');
      expect(systemMessage).toContain('DO NOT greet the user');
      expect(systemMessage).toContain('DO NOT ask any questions');
      expect(systemMessage).toContain("Let's begin building something amazing together");
    });

    it('should use normal system message when onboarding is not complete', async () => {
      mockContext.metadata.onboarding!.isComplete = false;

      const systemMessage = (agent as any).buildSystemMessage(mockContext);

      expect(systemMessage).not.toContain('ONBOARDING IS NOW COMPLETE');
    });
  });

  describe('State Transitions', () => {
    it('should transition to RECAP_AND_HANDOFF when all fields captured', async () => {
      // Start with some state other than RECAP_AND_HANDOFF
      mockContext.metadata.onboarding!.state = ConversationState.GOAL_SETTING;
      
      // Capture all fields
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'Test User',
        user_role: 'Manager',
        team_size: 5,
        organization: 'Company',
        primary_challenge: 'Challenge'
      };
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: true,
        team_size: true,
        organization: true,
        primary_challenge: true
      };

      await agent.processMessage('Done', mockContext);

      expect(mockContext.metadata.onboarding?.state).toBe(ConversationState.RECAP_AND_HANDOFF);
    });
  });

  describe('Handoff Preparation', () => {
    it('should prepare handoff when onboarding is complete', async () => {
      mockContext.metadata.onboarding!.isComplete = true;
      mockContext.metadata.onboarding!.state = ConversationState.RECAP_AND_HANDOFF;
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'User',
        user_role: 'Role',
        team_size: 5,
        organization: 'Org',
        primary_challenge: 'Challenge'
      };

      const response = await agent.processMessage('Ready', mockContext);

      // Should indicate readiness for handoff
      expect(response.handoff).toBeDefined();
      expect(response.handoff?.targetAgent).toBe('AssessmentAgent');
      expect(response.handoff?.reason).toContain('completed successfully');
    });
  });
});