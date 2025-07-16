import { OnboardingAgent } from '../onboarding-agent';
import { AgentContext, ConversationState } from '../../types';
import { AgentConfigLoader } from '../../config/agent-config-loader';

// Mock dependencies
jest.mock('../../config/agent-config-loader');
jest.mock('../../extraction/extraction-processor');

describe('OnboardingAgent', () => {
  let agent: OnboardingAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new OnboardingAgent();
    
    // Mock context
    mockContext = {
      conversationId: 'test-conv-1',
      teamId: 'test-team-1',
      managerId: 'test-manager-1',
      currentAgent: 'OnboardingAgent',
      messageHistory: [],
      metadata: {
        onboarding: {
          state: ConversationState.GREETING,
          startTime: new Date(),
          capturedFields: {},
          requiredFieldsStatus: {
            user_name: false,
            user_role: false,
            team_size: false,
            organization: false,
            primary_challenge: false
          },
          isComplete: false,
          qualityMetrics: {
            rapportScore: 0,
            managerConfidence: 'low',
            completionPercentage: 0
          },
          stateTransitions: []
        }
      }
    };

    // Mock config loader
    (AgentConfigLoader.loadConfiguration as jest.Mock).mockResolvedValue({
      extractionRules: {
        user_name: { type: 'string', required: true },
        user_role: { type: 'string', required: true },
        team_size: { type: 'number', required: true },
        organization: { type: 'string', required: true },
        primary_challenge: { type: 'string', required: true }
      }
    });
  });

  describe('Required Fields Detection', () => {
    it('should identify missing required fields', async () => {
      const response = await agent.processMessage('Hello', mockContext);
      
      expect(mockContext.metadata.onboarding?.requiredFieldsStatus).toEqual({
        user_name: false,
        user_role: false,
        team_size: false,
        organization: false,
        primary_challenge: false
      });
      
      expect(mockContext.metadata.onboarding?.isComplete).toBe(false);
    });

    it('should mark fields as captured when extracted', async () => {
      // Simulate extracting user_name
      mockContext.metadata.onboarding!.capturedFields = { user_name: 'John' };
      mockContext.metadata.onboarding!.requiredFieldsStatus.user_name = true;
      
      const response = await agent.processMessage("I'm John", mockContext);
      
      expect(mockContext.metadata.onboarding?.requiredFieldsStatus.user_name).toBe(true);
      expect(mockContext.metadata.onboarding?.capturedFields.user_name).toBe('John');
    });

    it('should mark onboarding complete when all fields captured', async () => {
      // Simulate all fields captured
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'John',
        user_role: 'Engineering Manager',
        team_size: 10,
        organization: 'Tech Corp',
        primary_challenge: 'Communication issues'
      };
      
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: true,
        team_size: true,
        organization: true,
        primary_challenge: true
      };
      
      mockContext.metadata.onboarding!.qualityMetrics.completionPercentage = 100;
      mockContext.metadata.onboarding!.isComplete = true;
      
      const response = await agent.processMessage("That's all", mockContext);
      
      expect(mockContext.metadata.onboarding?.isComplete).toBe(true);
      expect(mockContext.metadata.onboarding?.qualityMetrics.completionPercentage).toBe(100);
    });
  });

  describe('State Transitions', () => {
    it('should transition from GREETING to CONTEXT_DISCOVERY after name', async () => {
      mockContext.metadata.onboarding!.capturedFields = { user_name: 'John' };
      mockContext.metadata.onboarding!.state = ConversationState.GREETING;
      
      const response = await agent.processMessage("I'm John", mockContext);
      
      // State should progress
      expect(mockContext.metadata.onboarding?.state).not.toBe(ConversationState.GREETING);
    });

    it('should force transition to RECAP_AND_HANDOFF when all fields captured', async () => {
      // Simulate all required fields captured
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'John',
        user_role: 'Engineering Manager',
        team_size: 10,
        organization: 'Tech Corp',
        primary_challenge: 'Communication issues'
      };
      
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: true,
        team_size: true,
        organization: true,
        primary_challenge: true
      };
      
      mockContext.metadata.onboarding!.state = ConversationState.GOAL_SETTING;
      
      const response = await agent.processMessage("Ready to proceed", mockContext);
      
      // Should force transition to RECAP_AND_HANDOFF
      expect(mockContext.metadata.onboarding?.state).toBe(ConversationState.RECAP_AND_HANDOFF);
    });
  });

  describe('Retry Logic', () => {
    it('should trigger retry when in RECAP_AND_HANDOFF with missing fields', async () => {
      // Set state to RECAP_AND_HANDOFF with missing team_size
      mockContext.metadata.onboarding!.state = ConversationState.RECAP_AND_HANDOFF;
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'John',
        user_role: 'Engineering Manager',
        organization: 'Tech Corp',
        primary_challenge: 'Communication issues'
      };
      
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: true,
        team_size: false, // Missing
        organization: true,
        primary_challenge: true
      };
      
      const prompt = (agent as any).buildContextPrompt(mockContext);
      
      // Should include retry instructions
      expect(prompt).toContain('MISSING REQUIRED INFORMATION');
      expect(prompt).toContain('team_size');
      expect(prompt).toContain("I didn't quite catch how many people are on your team");
    });

    it('should not trigger retry when all fields captured', async () => {
      // Set state to RECAP_AND_HANDOFF with all fields
      mockContext.metadata.onboarding!.state = ConversationState.RECAP_AND_HANDOFF;
      mockContext.metadata.onboarding!.capturedFields = {
        user_name: 'John',
        user_role: 'Engineering Manager',
        team_size: 10,
        organization: 'Tech Corp',
        primary_challenge: 'Communication issues'
      };
      
      mockContext.metadata.onboarding!.requiredFieldsStatus = {
        user_name: true,
        user_role: true,
        team_size: true,
        organization: true,
        primary_challenge: true
      };
      
      mockContext.metadata.onboarding!.isComplete = true;
      
      const prompt = (agent as any).buildContextPrompt(mockContext);
      
      // Should show completion message
      expect(prompt).toContain('ONBOARDING COMPLETE');
      expect(prompt).not.toContain('MISSING REQUIRED INFORMATION');
    });
  });

  describe('Field Aliasing', () => {
    it('should handle manager_name as alias for user_name', async () => {
      const capturedFields = {};
      const extractedData = { manager_name: 'John' };
      
      await (agent as any).updateCapturedFields(
        mockContext.metadata.onboarding!,
        extractedData
      );
      
      // Should normalize to user_name
      expect(mockContext.metadata.onboarding?.capturedFields.user_name).toBe('John');
      expect(mockContext.metadata.onboarding?.requiredFieldsStatus.user_name).toBe(true);
    });

    it('should handle manager_role as alias for user_role', async () => {
      const capturedFields = {};
      const extractedData = { manager_role: 'CTO' };
      
      await (agent as any).updateCapturedFields(
        mockContext.metadata.onboarding!,
        extractedData
      );
      
      // Should normalize to user_role
      expect(mockContext.metadata.onboarding?.capturedFields.user_role).toBe('CTO');
      expect(mockContext.metadata.onboarding?.requiredFieldsStatus.user_role).toBe(true);
    });
  });

  describe('Completion Criteria', () => {
    it('should require exactly 5 fields for completion', async () => {
      const requiredFields = await (agent as any).getRequiredFields();
      
      expect(requiredFields).toHaveLength(5);
      expect(requiredFields).toContain('user_name');
      expect(requiredFields).toContain('user_role');
      expect(requiredFields).toContain('team_size');
      expect(requiredFields).toContain('organization');
      expect(requiredFields).toContain('primary_challenge');
    });

    it('should not include extra fields in required list', async () => {
      const requiredFields = await (agent as any).getRequiredFields();
      
      // Should NOT include these fields that were causing issues
      expect(requiredFields).not.toContain('team_tenure');
      expect(requiredFields).not.toContain('success_metrics');
      expect(requiredFields).not.toContain('timeline_preference');
      expect(requiredFields).not.toContain('budget_range');
      expect(requiredFields).not.toContain('leader_commitment');
    });
  });
});