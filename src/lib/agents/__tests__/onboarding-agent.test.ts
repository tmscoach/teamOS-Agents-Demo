import { OnboardingAgent, ConversationState } from '../implementations/onboarding-agent';
import { AgentContext } from '../types';

// Mock the OpenAI client
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked response'
            }
          }]
        })
      }
    }
  }))
}));

// Mock the knowledge base tools
jest.mock('../../knowledge-base', () => ({
  knowledgeBaseTools: []
}));

describe('OnboardingAgent', () => {
  let agent: OnboardingAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new OnboardingAgent();
    mockContext = {
      teamId: 'team-123',
      managerId: 'manager-123',
      transformationPhase: 'onboarding',
      currentAgent: 'OnboardingAgent',
      conversationId: 'conv-123',
      messageHistory: [],
      metadata: {}
    };
  });

  describe('initialization', () => {
    test('should initialize with greeting state', async () => {
      const response = await agent.processMessage('Hello', mockContext);
      expect(mockContext.metadata.onboarding).toBeDefined();
      expect(mockContext.metadata.onboarding.state).toBe(ConversationState.GREETING);
    });

    test('should have all required tools', () => {
      const toolNames = agent.tools.map(t => t.name);
      expect(toolNames).toContain('extractTeamInfo');
      expect(toolNames).toContain('validateRequiredFields');
      expect(toolNames).toContain('assessConversationQuality');
      expect(toolNames).toContain('generateHandoffDocument');
    });
  });

  describe('information extraction', () => {
    test('should extract team size from message', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.CONTEXT_DISCOVERY,
        startTime: new Date(),
        capturedFields: {},
        requiredFieldsStatus: {},
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      await agent.processMessage('I manage a team of 15 people', mockContext);
      
      expect(mockContext.metadata.onboarding.capturedFields.team_size).toBe(15);
      expect(mockContext.metadata.onboarding.requiredFieldsStatus.team_size).toBe(true);
    });

    test('should extract manager name', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.GREETING,
        startTime: new Date(),
        capturedFields: {},
        requiredFieldsStatus: {},
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      await agent.processMessage("Hi, I'm Sarah Johnson", mockContext);
      
      expect(mockContext.metadata.onboarding.capturedFields.name).toBe('Sarah Johnson');
    });

    test('should extract primary challenge', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.CHALLENGE_EXPLORATION,
        startTime: new Date(),
        capturedFields: {},
        requiredFieldsStatus: {},
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      await agent.processMessage('Our main challenge is poor communication between teams', mockContext);
      
      expect(mockContext.metadata.onboarding.capturedFields.primary_challenge).toContain('poor communication');
    });
  });

  describe('state transitions', () => {
    test('should transition from greeting to context discovery', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.GREETING,
        startTime: new Date(),
        capturedFields: { name: 'John' },
        requiredFieldsStatus: {},
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      await agent.processMessage("I'm looking to transform my team", mockContext);
      
      expect(mockContext.metadata.onboarding.state).toBe(ConversationState.CONTEXT_DISCOVERY);
      expect(mockContext.metadata.onboarding.stateTransitions).toHaveLength(1);
    });

    test('should not transition if required fields are missing', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.CONTEXT_DISCOVERY,
        startTime: new Date(),
        capturedFields: {},
        requiredFieldsStatus: {},
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      await agent.processMessage("I'm not sure about the team size yet", mockContext);
      
      expect(mockContext.metadata.onboarding.state).toBe(ConversationState.CONTEXT_DISCOVERY);
    });
  });

  describe('quality metrics', () => {
    test('should update completion percentage', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.CONTEXT_DISCOVERY,
        startTime: new Date(),
        capturedFields: {
          team_size: 10,
          team_tenure: '2 years',
          primary_challenge: 'communication'
        },
        requiredFieldsStatus: {
          team_size: true,
          team_tenure: true,
          primary_challenge: true,
          success_metrics: false,
          timeline_preference: false,
          budget_range: false,
          leader_commitment: false
        },
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      await agent.processMessage("We need better collaboration", mockContext);
      
      const completion = mockContext.metadata.onboarding.qualityMetrics.completionPercentage;
      expect(completion).toBeGreaterThan(40); // 3 out of 7 fields
    });

    test('should increase rapport score with engagement', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.CHALLENGE_EXPLORATION,
        startTime: new Date(),
        capturedFields: {},
        requiredFieldsStatus: {},
        qualityMetrics: { rapportScore: 0, managerConfidence: 'low', completionPercentage: 0 },
        stateTransitions: []
      };

      // Add some message history
      mockContext.messageHistory = [
        { id: '1', role: 'user', content: 'This is great! I\'m excited to get started.', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Response', timestamp: new Date() },
        { id: '3', role: 'user', content: 'Can you tell me more about how this works?', timestamp: new Date() }
      ];

      await agent.processMessage("I'm looking forward to seeing the results", mockContext);
      
      expect(mockContext.metadata.onboarding.qualityMetrics.rapportScore).toBeGreaterThan(0);
    });
  });

  describe('handoff preparation', () => {
    test('should prepare handoff when ready', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.RECAP_AND_HANDOFF,
        startTime: new Date(),
        capturedFields: {
          team_size: 10,
          team_tenure: '2 years',
          primary_challenge: 'communication',
          success_metrics: 'better collaboration',
          timeline_preference: '3 months',
          budget_range: '$10k',
          leader_commitment: 'high'
        },
        requiredFieldsStatus: {
          team_size: true,
          team_tenure: true,
          primary_challenge: true,
          success_metrics: true,
          timeline_preference: true,
          budget_range: true,
          leader_commitment: true
        },
        qualityMetrics: { rapportScore: 80, managerConfidence: 'high', completionPercentage: 100 },
        stateTransitions: []
      };

      const response = await agent.processMessage("Yes, let's move forward", mockContext);
      
      expect(response.handoff).toBeDefined();
      expect(response.handoff?.targetAgent).toBe('AssessmentAgent');
      expect(mockContext.metadata.handoffDocument).toBeDefined();
    });

    test('should not handoff if not ready', async () => {
      mockContext.metadata.onboarding = {
        state: ConversationState.GOAL_SETTING,
        startTime: new Date(),
        capturedFields: {
          team_size: 10
        },
        requiredFieldsStatus: {
          team_size: true,
          team_tenure: false,
          primary_challenge: false,
          success_metrics: false,
          timeline_preference: false,
          budget_range: false,
          leader_commitment: false
        },
        qualityMetrics: { rapportScore: 30, managerConfidence: 'low', completionPercentage: 14 },
        stateTransitions: []
      };

      const response = await agent.processMessage("I'm not sure yet", mockContext);
      
      expect(response.handoff).toBeUndefined();
    });
  });
});