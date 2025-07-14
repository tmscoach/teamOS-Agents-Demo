import { OnboardingAgent } from '../onboarding-agent';
import { AgentContext } from '../../types';
import { AgentConfigLoader } from '../../config/agent-config-loader';

// Mock the config loader
jest.mock('../../config/agent-config-loader');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

// Mock tools
jest.mock('../../tools/onboarding-tools', () => ({
  createOnboardingTools: jest.fn(() => [])
}));

// Mock guardrails
jest.mock('../../guardrails/onboarding-guardrails', () => ({
  OnboardingGuardrails: {
    createGuardrails: jest.fn(() => [])
  }
}));

// Mock knowledge base
jest.mock('../../../knowledge-base', () => ({
  knowledgeBaseTools: []
}));

describe('OnboardingAgent - Suggested Values', () => {
  let agent: OnboardingAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock config with suggested values
    const mockConfig = {
      systemPrompt: 'Test prompt',
      extractionRules: {
        primary_challenge: {
          type: 'string',
          description: 'Main team challenge',
          required: true,
          patterns: ['challenge', 'problem'],
          suggestedValues: [
            'Communication issues',
            'Low team morale',
            'Unclear goals',
            'Performance concerns'
          ]
        },
        manager_role: {
          type: 'string',
          description: 'Role at company',
          required: true,
          patterns: ['role', 'position'],
          suggestedValues: ['CTO', 'VP Engineering', 'Team Lead']
        },
        team_size: {
          type: 'number',
          required: true,
          patterns: ['(\\d+) people']
          // No suggested values
        }
      },
      flowConfig: {},
      version: 1
    };

    (AgentConfigLoader.loadConfiguration as jest.Mock).mockResolvedValue(mockConfig);
    
    agent = new OnboardingAgent();
    
    mockContext = {
      conversationId: 'test-123',
      managerId: 'manager-123',
      teamId: 'team-123',
      transformationPhase: 'onboarding',
      currentAgent: 'OnboardingAgent',
      messageHistory: [],
      metadata: {
        onboarding: {
          state: 'challenge_exploration',
          startTime: new Date(),
          capturedFields: {},
          requiredFieldsStatus: {},
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

  describe('getSuggestedValuesForCurrentContext', () => {
    it('should return suggested values when agent asks about a field with suggestions', async () => {
      const userMessage = "I'm managing a team";
      const agentResponse = "What primary challenge are you facing with your team?";
      
      // Use private method access for testing
      const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
        userMessage,
        agentResponse,
        mockContext.metadata.onboarding
      );

      expect(suggestedValues).toEqual({
        field: 'primary_challenge',
        values: [
          'Communication issues',
          'Low team morale',
          'Unclear goals',
          'Performance concerns'
        ],
        helpText: 'Main team challenge'
      });
    });

    it('should return suggested values for role questions', async () => {
      const userMessage = "Hi there";
      const agentResponse = "What's your role at the company?";
      
      const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
        userMessage,
        agentResponse,
        mockContext.metadata.onboarding
      );

      expect(suggestedValues).toEqual({
        field: 'manager_role',
        values: ['CTO', 'VP Engineering', 'Team Lead'],
        helpText: 'Role at company'
      });
    });

    it('should return null for fields without suggested values', async () => {
      const userMessage = "Hello";
      const agentResponse = "How many people are on your team?";
      
      const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
        userMessage,
        agentResponse,
        mockContext.metadata.onboarding
      );

      expect(suggestedValues).toBeNull();
    });

    it('should return null when no field is being asked about', async () => {
      const userMessage = "That sounds great";
      const agentResponse = "Excellent! Let me explain how TMS can help.";
      
      const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
        userMessage,
        agentResponse,
        mockContext.metadata.onboarding
      );

      expect(suggestedValues).toBeNull();
    });

    it('should handle missing extraction rules gracefully', async () => {
      (AgentConfigLoader.loadConfiguration as jest.Mock).mockResolvedValue(null);
      
      const userMessage = "I don't know";
      const agentResponse = "What challenge are you facing?";
      
      const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
        userMessage,
        agentResponse,
        mockContext.metadata.onboarding
      );

      expect(suggestedValues).toBeNull();
    });

    it('should detect various challenge-related patterns', async () => {
      const challengeQuestions = [
        "What challenges are you dealing with?",
        "What problems does your team face?",
        "Any specific issues you're struggling with?",
        "What difficulties have you encountered?",
        "What concerns do you have about your team?"
      ];

      // The patterns should match at least some of these questions
      let matchedCount = 0;
      for (const question of challengeQuestions) {
        const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
          "Not sure",
          question,
          mockContext.metadata.onboarding
        );

        if (suggestedValues !== null && suggestedValues.field === 'primary_challenge') {
          matchedCount++;
        }
      }
      
      // Expect at least 3 out of 5 patterns to match
      expect(matchedCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('processMessage with suggested values', () => {
    it('should include suggested values in response metadata', async () => {
      const userMessage = "8 people";
      
      // Mock the parent processMessage to return a basic response
      const mockResponse = {
        message: "Thank you for confirming your team size. What primary challenge are you facing?",
        events: [],
        context: mockContext
      };
      
      // Spy on super.processMessage
      const processMessageSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(agent)), 'processMessage')
        .mockResolvedValue(mockResponse);

      const response = await agent.processMessage(userMessage, mockContext);

      expect(response.metadata).toBeDefined();
      expect(response.metadata?.suggestedValues).toEqual({
        field: 'primary_challenge',
        values: [
          'Communication issues',
          'Low team morale',
          'Unclear goals',
          'Performance concerns'
        ],
        helpText: 'Main team challenge'
      });

      processMessageSpy.mockRestore();
    });

    it('should not include suggested values when not asking about a configured field', async () => {
      const userMessage = "Thanks!";
      
      const mockResponse = {
        message: "You're welcome! Let me explain how TMS works.",
        events: [],
        context: mockContext
      };
      
      const processMessageSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(agent)), 'processMessage')
        .mockResolvedValue(mockResponse);

      const response = await agent.processMessage(userMessage, mockContext);

      expect(response.metadata?.suggestedValues).toBeUndefined();

      processMessageSpy.mockRestore();
    });
  });

  describe('Field pattern matching', () => {
    it('should match organization patterns correctly', async () => {
      const orgQuestions = [
        "What company do you work for?",
        "What's your organization?",
        "Where do you work?",
        "Who's your employer?"
      ];

      // Add organization to the mock config
      const mockConfig = {
        extractionRules: {
          organization: {
            type: 'string',
            suggestedValues: ['Small startup', 'Mid-size company', 'Enterprise']
          }
        }
      };
      (AgentConfigLoader.loadConfiguration as jest.Mock).mockResolvedValue(mockConfig);

      for (const question of orgQuestions) {
        const suggestedValues = await (agent as any).getSuggestedValuesForCurrentContext(
          "Hmm",
          question,
          mockContext.metadata.onboarding
        );

        expect(suggestedValues?.field).toBe('organization');
      }
    });
  });
});