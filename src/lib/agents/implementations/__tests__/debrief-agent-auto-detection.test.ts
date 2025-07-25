/**
 * @jest-environment node
 */

/**
 * Tests for DebriefAgent auto-detection and assessment-specific flows
 */

import { OpenAIDebriefAgent } from '../openai-debrief-agent';
import { AgentContext } from '../../types';
import { JourneyTracker } from '@/lib/orchestrator/journey-tracker';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';

// Mock dependencies
jest.mock('@/lib/orchestrator/journey-tracker');
jest.mock('../../tools/tms-tool-factory');
jest.mock('../../../knowledge-base', () => ({
  knowledgeBaseTools: []
}));

// Mock Prisma
jest.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

describe('DebriefAgent Auto-Detection and Assessment-Specific Flows', () => {
  let agent: OpenAIDebriefAgent;
  let mockContext: AgentContext;
  let mockJourneyTracker: jest.Mocked<JourneyTracker>;
  let mockProcessMessage: jest.SpyInstance;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock journey tracker
    mockJourneyTracker = {
      markDebriefViewed: jest.fn(),
      getCurrentJourney: jest.fn(),
      updateJourneyProgress: jest.fn()
    } as any;
    
    (JourneyTracker as jest.MockedClass<typeof JourneyTracker>).mockImplementation(() => mockJourneyTracker);
    
    // Create agent
    agent = new OpenAIDebriefAgent();
    
    // Mock the parent class processMessage method
    mockProcessMessage = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(agent)), 'processMessage');
    mockProcessMessage.mockImplementation(async (message: string, context: AgentContext) => {
      return {
        message: 'Default response',
        metadata: {},
        handoff: null
      };
    });
    
    await agent.initialize();
    
    // Mock context
    mockContext = {
      managerId: 'test-user-123',
      conversationId: 'conv-123',
      messageCount: 0,
      timestamp: new Date(),
      metadata: {}
    };
  });

  describe('Auto-Detection on Conversation Start', () => {
    it('should check for available reports when conversation starts', async () => {
      let capturedMessage = '';
      
      // Capture what message is sent to parent processMessage
      mockProcessMessage.mockImplementation(async (message: string) => {
        capturedMessage = message;
        return {
          message: 'I see you have completed assessments...',
          metadata: {},
          handoff: null
        };
      });
      
      // Start conversation
      await agent.processMessage('Hello', mockContext);
      
      // Verify the prompt was modified to include report check
      expect(mockProcessMessage).toHaveBeenCalled();
      expect(capturedMessage).toContain('tms_get_dashboard_subscriptions');
      expect(capturedMessage).toContain('The user has just joined the conversation');
    });

    it('should not check for reports on subsequent messages', async () => {
      mockContext.messageCount = 5; // Not first message
      
      let capturedMessage = '';
      mockProcessMessage.mockImplementation(async (message: string) => {
        capturedMessage = message;
        return {
          message: 'Continuing conversation...',
          metadata: {},
          handoff: null
        };
      });
      
      await agent.processMessage('Tell me more', mockContext);
      
      // Should not modify the message for report checking
      expect(capturedMessage).not.toContain('tms_get_dashboard_subscriptions');
      expect(capturedMessage).toBe('Tell me more');
    });
  });

  describe('TMP Debrief Flow', () => {
    it('should follow TMP-specific debrief flow when TMP is selected', async () => {
      const mockResponse = {
        message: 'Starting TMP debrief...',
        metadata: {
          extractedVariables: {
            assessment_type: 'TMP',
            objectives: 'Understand my work style better',
            highlights: ['Creative', 'Strategic', 'Innovative'],
            communication: ['Be direct', 'Give context'],
            support: 'Help with detailed tasks'
          }
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      const response = await agent.processMessage('I want to debrief my TMP', mockContext);
      
      expect(response.metadata?.extractedVariables?.assessment_type).toBe('TMP');
      expect(response.metadata?.extractedVariables?.objectives).toBeDefined();
      expect(response.metadata?.extractedVariables?.highlights).toHaveLength(3);
    });

    it('should extract all TMP variables correctly', async () => {
      const tmpVariables = {
        assessment_type: 'TMP',
        objectives: 'Better understand my leadership style',
        highlights: ['Explorer Promoter', 'Creative thinking', 'Big picture focus'],
        communication: ['Start with the big picture', 'Allow time for brainstorming'],
        support: 'Help with administrative details'
      };
      
      const mockResponse = {
        message: 'TMP debrief complete',
        metadata: {
          extractedVariables: tmpVariables
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      const response = await agent.processMessage('My objectives are to better understand my leadership style', mockContext);
      
      expect(response.metadata?.extractedVariables).toMatchObject(tmpVariables);
    });
  });

  describe('Journey Tracker Integration', () => {
    it('should mark debrief as viewed when completed', async () => {
      const mockResponse = {
        message: 'Debrief complete!',
        metadata: {
          extractedVariables: {
            assessment_type: 'TMP',
            debrief_completed: true,
            objectives: 'Test objectives',
            highlights: ['Test1', 'Test2', 'Test3']
          }
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      mockJourneyTracker.getCurrentJourney.mockResolvedValue({
        currentPhase: JourneyPhase.DEBRIEF,
        viewedDebriefs: {},
        completedSteps: []
      } as any);
      
      await agent.processMessage('Thank you for the debrief', mockContext);
      
      expect(mockJourneyTracker.markDebriefViewed).toHaveBeenCalledWith(
        'TMP_debrief',
        expect.objectContaining({
          objectives: 'Test objectives',
          highlights: ['Test1', 'Test2', 'Test3']
        })
      );
    });

    it('should update journey phase to CONTINUOUS_ENGAGEMENT after TMP debrief', async () => {
      const mockResponse = {
        message: 'Debrief complete!',
        metadata: {
          extractedVariables: {
            assessment_type: 'TMP',
            debrief_completed: true
          }
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      mockJourneyTracker.getCurrentJourney.mockResolvedValue({
        currentPhase: JourneyPhase.DEBRIEF,
        viewedDebriefs: {
          'tmp_debrief': { viewedAt: new Date() }
        },
        completedSteps: []
      } as any);
      
      await agent.processMessage('Complete debrief', mockContext);
      
      expect(mockJourneyTracker.updateJourneyProgress).toHaveBeenCalledWith(
        'debrief_complete',
        expect.objectContaining({
          phase: JourneyPhase.CONTINUOUS_ENGAGEMENT
        })
      );
    });

    it('should not update phase if required debriefs not complete', async () => {
      const mockResponse = {
        message: 'Debrief complete!',
        metadata: {
          extractedVariables: {
            assessment_type: 'QO2',
            debrief_completed: true
          }
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      mockJourneyTracker.getCurrentJourney.mockResolvedValue({
        currentPhase: JourneyPhase.DEBRIEF,
        viewedDebriefs: {}, // No TMP debrief yet
        completedSteps: []
      } as any);
      
      await agent.processMessage('Complete QO2 debrief', mockContext);
      
      expect(mockJourneyTracker.markDebriefViewed).toHaveBeenCalled();
      expect(mockJourneyTracker.updateJourneyProgress).not.toHaveBeenCalled();
    });
  });

  describe('QO2 Debrief Flow', () => {
    it('should extract QO2-specific variables', async () => {
      const qo2Variables = {
        assessment_type: 'QO2',
        culture_type: 'Achievement Culture',
        alignment_gaps: ['Leadership style', 'Communication patterns'],
        culture_actions: ['Implement regular feedback', 'Create innovation time']
      };
      
      const mockResponse = {
        message: 'QO2 debrief in progress',
        metadata: {
          extractedVariables: qo2Variables
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      const response = await agent.processMessage('Review my QO2 culture assessment', mockContext);
      
      expect(response.metadata?.extractedVariables?.culture_type).toBe('Achievement Culture');
      expect(response.metadata?.extractedVariables?.alignment_gaps).toHaveLength(2);
    });
  });

  describe('Team Signals Debrief Flow', () => {
    it('should extract Team Signals-specific variables', async () => {
      const tsVariables = {
        assessment_type: 'Team Signals',
        team_strengths: ['Strong collaboration', 'Clear goals'],
        improvement_areas: ['Communication frequency', 'Decision making'],
        priority_actions: ['Weekly team meetings', 'Define decision matrix']
      };
      
      const mockResponse = {
        message: 'Team Signals debrief in progress',
        metadata: {
          extractedVariables: tsVariables
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      const response = await agent.processMessage('Review my Team Signals results', mockContext);
      
      expect(response.metadata?.extractedVariables?.team_strengths).toHaveLength(2);
      expect(response.metadata?.extractedVariables?.priority_actions).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle journey tracker errors gracefully', async () => {
      const mockResponse = {
        message: 'Debrief complete!',
        metadata: {
          extractedVariables: {
            assessment_type: 'TMP',
            debrief_completed: true
          }
        },
        handoff: null
      };
      
      mockProcessMessage.mockResolvedValue(mockResponse);
      
      // Make journey tracker throw an error
      mockJourneyTracker.markDebriefViewed.mockRejectedValue(new Error('DB error'));
      
      // Should not throw - error should be caught
      const response = await agent.processMessage('Complete debrief', mockContext);
      
      expect(response).toBeDefined();
      expect(response.message).toBe('Debrief complete!');
    });
  });
});