import { OnboardingAgent } from '../onboarding-agent';
import { AgentContext } from '../../types';

// Mock dependencies
jest.mock('../../../services/variable-extraction', () => ({
  VariableExtractionService: {
    trackExtractionBatch: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('../../config/agent-config-loader');

// Mock the LLM provider
jest.mock('../../llm', () => ({
  LLMProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue({
      content: 'Mocked response',
      toolCalls: []
    })
  }))
}));

// Mock the knowledge base
jest.mock('../../../knowledge-base', () => ({
  knowledgeBaseTools: []
}));

describe('OnboardingAgent Context Prompt', () => {
  let agent: OnboardingAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new OnboardingAgent();
  });

  test('should include captured fields in context prompt', () => {
    mockContext = {
      conversationId: 'test-123',
      managerId: 'manager-123',
      teamId: 'team-123',
      messageHistory: [],
      metadata: {
        onboarding: {
          state: 'context_discovery',
          startTime: new Date(),
          capturedFields: {
            manager_name: 'John Smith',
            team_size: 15,
            organization: 'TechCorp'
          },
          requiredFieldsStatus: {
            manager_name: true,
            team_size: true,
            organization: false,
            team_tenure: false,
            primary_challenge: false
          },
          qualityMetrics: {
            rapportScore: 0,
            managerConfidence: 'low',
            completionPercentage: 40
          },
          stateTransitions: []
        }
      }
    };

    // Access the protected method via type assertion
    const contextPrompt = (agent as any).buildContextPrompt(mockContext);

    // Verify captured fields are included
    expect(contextPrompt).toContain('Already captured information:');
    expect(contextPrompt).toContain('Manager Name: John Smith');
    expect(contextPrompt).toContain('Team Size: 15');
    expect(contextPrompt).toContain('Organization: TechCorp');

    // Verify important instruction is included
    expect(contextPrompt).toContain('IMPORTANT: Do not ask for information that has already been captured above');

    // Verify missing fields are listed
    expect(contextPrompt).toContain('Still need to capture:');
    expect(contextPrompt).toContain('Team Tenure');
    expect(contextPrompt).toContain('Primary Challenge');
  });

  test('should not add captured fields section when no fields are captured', () => {
    mockContext = {
      conversationId: 'test-456',
      managerId: 'manager-456',
      teamId: 'team-456',
      messageHistory: [],
      metadata: {
        onboarding: {
          state: 'greeting',
          startTime: new Date(),
          capturedFields: {},
          requiredFieldsStatus: {
            manager_name: false,
            team_size: false,
            team_tenure: false
          },
          qualityMetrics: {
            rapportScore: 0,
            managerConfidence: 'low',
            completionPercentage: 0
          },
          stateTransitions: []
        }
      }
    };

    const contextPrompt = (agent as any).buildContextPrompt(mockContext);

    // Should not contain captured fields section
    expect(contextPrompt).not.toContain('Already captured information:');
    
    // Should still list fields to capture
    expect(contextPrompt).toContain('Still need to capture:');
    expect(contextPrompt).toContain('Manager Name');
    expect(contextPrompt).toContain('Team Size');
    expect(contextPrompt).toContain('Team Tenure');
  });

  test('should handle metadata without onboarding section gracefully', () => {
    mockContext = {
      conversationId: 'test-789',
      managerId: 'manager-789',
      teamId: 'team-789',
      messageHistory: [],
      metadata: {}
    };

    // Should not throw error
    expect(() => {
      (agent as any).buildContextPrompt(mockContext);
    }).not.toThrow();

    const contextPrompt = (agent as any).buildContextPrompt(mockContext);
    
    // Should not contain any onboarding-specific sections
    expect(contextPrompt).not.toContain('Already captured information:');
    expect(contextPrompt).not.toContain('Still need to capture:');
  });

  test('should format field names properly', () => {
    mockContext = {
      conversationId: 'test-999',
      managerId: 'manager-999',
      teamId: 'team-999',
      messageHistory: [],
      metadata: {
        onboarding: {
          state: 'context_discovery',
          startTime: new Date(),
          capturedFields: {
            primary_challenge: 'Communication issues',
            budget_range: '$50k-$100k',
            leader_commitment: '5 hours per week'
          },
          requiredFieldsStatus: {
            primary_challenge: true,
            budget_range: true,
            leader_commitment: true,
            success_metrics: false
          },
          qualityMetrics: {
            rapportScore: 0,
            managerConfidence: 'medium',
            completionPercentage: 75
          },
          stateTransitions: []
        }
      }
    };

    const contextPrompt = (agent as any).buildContextPrompt(mockContext);

    // Check proper formatting of multi-word field names
    expect(contextPrompt).toContain('Primary Challenge: Communication issues');
    expect(contextPrompt).toContain('Budget Range: $50k-$100k');
    expect(contextPrompt).toContain('Leader Commitment: 5 hours per week');
    expect(contextPrompt).toContain('Success Metrics');
  });
});