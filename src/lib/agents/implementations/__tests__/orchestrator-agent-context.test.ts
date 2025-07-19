import { OrchestratorAgent } from '../orchestrator-agent';
import { AgentContext } from '../../types';
import { PrismaClient } from '@/lib/generated/prisma';

// Mock Prisma
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn()
    },
    conversation: {
      findMany: jest.fn()
    }
  }))
}));

// Mock the base class methods
jest.mock('../base-openai-agent', () => ({
  BaseOpenAIAgent: class {
    constructor(name: string) {}
    async processMessage(message: string, context: AgentContext) {
      return { response: 'base response' };
    }
    buildContextPrompt(context: AgentContext) {
      return 'base context';
    }
  }
}));

// Mock knowledge base tools
jest.mock('../../../knowledge-base', () => ({
  knowledgeBaseTools: []
}));

describe('OrchestratorAgent Context', () => {
  let agent: OrchestratorAgent;
  let mockPrismaClient: any;
  
  beforeEach(() => {
    agent = new OrchestratorAgent();
    mockPrismaClient = (agent as any).prisma;
    jest.clearAllMocks();
  });

  describe('processMessage', () => {
    it('loads user data when managerId is present', async () => {
      const mockUser = {
        name: 'Test User',
        email: 'test@example.com',
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        onboardingData: {
          extractedFields: {
            team_size: 5,
            user_name: 'Test User',
            user_role: 'Manager',
            organization: 'Test Corp',
            primary_challenge: 'Team alignment'
          }
        },
        completedAssessments: { tmp: true },
        viewedDebriefs: {},
        teamSignalsEligible: true
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'assessment',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {}
      };

      await agent.processMessage('Hello', context);

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: {
          name: true,
          email: true,
          journeyPhase: true,
          journeyStatus: true,
          onboardingData: true,
          completedAssessments: true,
          viewedDebriefs: true,
          teamSignalsEligible: true
        }
      });

      expect(context.metadata.userName).toBe('Test User');
      expect(context.metadata.userEmail).toBe('test@example.com');
      expect(context.metadata.journeyPhase).toBe('ASSESSMENT');
      expect(context.metadata.onboardingCompleted).toBe(true);
      expect(context.metadata.onboarding?.extractedFields.team_size).toBe(5);
    });

    it('does not reload user data if already loaded', async () => {
      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'assessment',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {
          userDataLoaded: true
        }
      };

      await agent.processMessage('Hello', context);

      expect(mockPrismaClient.user.findUnique).not.toHaveBeenCalled();
    });

    it('handles missing onboarding data gracefully', async () => {
      const mockUser = {
        name: 'Test User',
        email: 'test@example.com',
        journeyPhase: 'ONBOARDING',
        journeyStatus: 'ONBOARDING',
        onboardingData: null,
        completedAssessments: {},
        viewedDebriefs: {},
        teamSignalsEligible: false
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'onboarding',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {}
      };

      await agent.processMessage('Hello', context);

      expect(context.metadata.onboardingCompleted).toBe(false);
      expect(context.metadata.onboarding).toBeUndefined();
    });

    it('handles database errors gracefully', async () => {
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database error'));

      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'assessment',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {}
      };

      // Should not throw
      await expect(agent.processMessage('Hello', context)).resolves.toBeDefined();
      expect(context.metadata.userDataLoaded).toBeUndefined();
    });
  });

  describe('buildContextPrompt', () => {
    it('includes user journey information in context', () => {
      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'assessment',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {
          userName: 'John Doe',
          userEmail: 'john@example.com',
          journeyPhase: 'ASSESSMENT',
          journeyStatus: 'ACTIVE',
          onboardingCompleted: true,
          completedAssessments: { tmp: true },
          onboarding: {
            extractedFields: {
              user_name: 'John Doe',
              organization: 'Acme Corp',
              team_size: 10,
              user_role: 'Director',
              primary_challenge: 'Team communication'
            }
          }
        }
      };

      const prompt = (agent as any).buildContextPrompt(context);

      expect(prompt).toContain('User Journey Information:');
      expect(prompt).toContain('User Name: John Doe');
      expect(prompt).toContain('User Email: john@example.com');
      expect(prompt).toContain('Current Journey Phase: ASSESSMENT');
      expect(prompt).toContain('Onboarding Completed: Yes');
      expect(prompt).toContain('Organization: Acme Corp');
      expect(prompt).toContain('Team Size: 10');
      expect(prompt).toContain('Primary Challenge: Team communication');
      expect(prompt).toContain('Current Focus: Assessment Phase');
    });

    it('provides phase-specific guidance for DEBRIEF phase', () => {
      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'analysis',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {
          journeyPhase: 'DEBRIEF'
        }
      };

      const prompt = (agent as any).buildContextPrompt(context);

      expect(prompt).toContain('Current Focus: Debrief Phase');
      expect(prompt).toContain('completed assessments and needs to review results');
    });

    it('provides phase-specific guidance for CONTINUOUS_ENGAGEMENT phase', () => {
      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'monitoring',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {
          journeyPhase: 'CONTINUOUS_ENGAGEMENT'
        }
      };

      const prompt = (agent as any).buildContextPrompt(context);

      expect(prompt).toContain('Current Focus: Continuous Engagement');
      expect(prompt).toContain('ongoing transformation phase');
    });

    it('handles missing metadata gracefully', () => {
      const context: AgentContext = {
        teamId: 'team1',
        managerId: 'user1',
        transformationPhase: 'assessment',
        currentAgent: 'OrchestratorAgent',
        conversationId: 'conv1',
        messageHistory: [],
        metadata: {}
      };

      // Should not throw
      expect(() => (agent as any).buildContextPrompt(context)).not.toThrow();
    });
  });
});