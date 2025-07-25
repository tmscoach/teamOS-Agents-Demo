/**
 * @jest-environment node
 */

/**
 * Tests for DebriefAgent auto-detection and assessment-specific flows
 */

import { OpenAIDebriefAgent } from '../openai-debrief-agent';
import { OpenAIAgent } from '../base-openai-agent';
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

  beforeEach(async () => {
    jest.clearAllMocks();
    
    agent = new OpenAIDebriefAgent();
    
    // Mock JourneyTracker
    mockJourneyTracker = {
      getCurrentJourney: jest.fn(),
      markDebriefViewed: jest.fn(),
      updateJourneyProgress: jest.fn()
    } as any;
    
    (JourneyTracker as jest.MockedClass<typeof JourneyTracker>).mockImplementation(() => mockJourneyTracker);
    
    await agent.initialize();
    
    // Mock context
    mockContext = {
      managerId: 'test-user-123',
      conversationId: 'conv-123',
      metadata: {},
      messageHistory: []
    };
  });

  describe('Auto-Detection on Conversation Start', () => {
    it('should check for available reports when conversation starts', async () => {
      let capturedMessage = '';
      
      // Capture what message is sent to parent processMessage
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockImplementation(async (message: string) => {
        capturedMessage = message;
        return {
          message: 'I see you have completed the Team Management Profile (TMP) assessment. Would you like to review your results?',
          metadata: {},
          handoff: null
        };
      });
      
      await agent.processMessage('Hello', mockContext);
      
      // Verify the prompt was modified to include report check
      expect(OpenAIAgent.prototype.processMessage).toHaveBeenCalled();
      expect(capturedMessage).toContain('tms_get_dashboard_subscriptions');
      expect(capturedMessage).toContain('The user has just joined the conversation');
    });

    it('should not check for reports on subsequent messages', async () => {
      // Add message history to simulate not first message
      mockContext.messageHistory = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: new Date() }
      ];
      
      let capturedMessage = '';
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockImplementation(async (message: string) => {
        capturedMessage = message;
        return {
          message: 'Continuing conversation...',
          metadata: {},
          handoff: null
        };
      });
      
      await agent.processMessage('Tell me more', mockContext);
      
      // Should not add subscription check instruction
      expect(capturedMessage).not.toContain('tms_get_dashboard_subscriptions');
      expect(capturedMessage).toContain('Tell me more');
    });
  });

  describe('Confirmation Handling', () => {
    it('should skip to objectives when user confirms after debrief offer', async () => {
      // Mock context with previous offer
      mockContext.messageHistory = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'I see you have completed the Team Management Profile (TMP) assessment. Would you like to review your results?', timestamp: new Date() }
      ];
      
      let capturedMessage = '';
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockImplementation(async (message: string) => {
        capturedMessage = message;
        return {
          message: 'Great! The purpose of our session is...',
          metadata: {},
          handoff: null
        };
      });
      
      await agent.processMessage('Yes please!', mockContext);
      
      // Should skip subscription check and go to objectives
      expect(capturedMessage).toContain('The user has confirmed they want to start the TMP debrief');
      expect(capturedMessage).toContain('DO NOT check subscriptions again');
      expect(capturedMessage).toContain('what are your main objectives from the debrief session today?');
    });

    it('should check subscriptions on first message even with join message', async () => {
      let capturedMessage = '';
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockImplementation(async (message: string) => {
        capturedMessage = message;
        return {
          message: 'I see you have completed assessments...',
          metadata: {},
          handoff: null
        };
      });
      
      await agent.processMessage('[User joined the conversation]', mockContext);
      
      expect(capturedMessage).toContain('The user has just joined the conversation');
      expect(capturedMessage).toContain('tms_get_dashboard_subscriptions');
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
      
      // Mock the parent class's processMessage to return our response
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockResolvedValue(mockResponse);
      
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
      
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockResolvedValue(mockResponse);
      
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
      
      jest.spyOn(OpenAIAgent.prototype, 'processMessage').mockResolvedValue(mockResponse);
      
      mockJourneyTracker.getCurrentJourney.mockResolvedValue({
        currentPhase: JourneyPhase.DEBRIEF,
        viewedDebriefs: {
          'qo2_debrief': { viewedAt: new Date() }
          // Missing tmp_debrief
        },
        completedSteps: []
      } as any);
      
      await agent.processMessage('Complete QO2 debrief', mockContext);
      
      expect(mockJourneyTracker.markDebriefViewed).toHaveBeenCalled();
      expect(mockJourneyTracker.updateJourneyProgress).not.toHaveBeenCalled();
    });
  });
});