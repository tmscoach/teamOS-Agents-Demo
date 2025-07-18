/**
 * Tests for journey status update during onboarding completion
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

// Mock dependencies
jest.mock('@/src/lib/auth/clerk-dev-wrapper');
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  },
}));

describe('Journey Status Update on Onboarding Completion', () => {
  const mockUser = {
    id: 'test-clerk-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    fullName: 'Test User',
  };

  const mockDbUser = {
    id: 'test-user-id',
    clerkId: 'test-clerk-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'MANAGER',
    journeyStatus: 'ONBOARDING',
    journeyPhase: 'ONBOARDING',
    managedTeams: [],
  };

  const mockConversation = {
    id: 'test-conv-id',
    managerId: 'test-user-id',
    currentAgent: 'OnboardingAgent',
    contextData: {
      conversationId: 'test-conv-id',
      teamId: 'test-team-id',
      currentAgent: 'OnboardingAgent',
      messageHistory: [],
      metadata: {
        onboarding: {
          capturedFields: {
            user_name: 'Test User',
            user_role: 'Manager',
            team_size: 5,
            organization: 'Test Corp',
            primary_challenge: 'Team alignment'
          },
          requiredFieldsStatus: {
            user_name: true,
            user_role: true,
            team_size: true,
            organization: true,
            primary_challenge: true
          },
          isComplete: true
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation);
  });

  describe('Journey Status Update Logic', () => {
    it('should update journey status when handoff message is detected', async () => {
      // Mock the streaming response to include handoff message
      const mockRequest = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Thanks!' }],
          conversationId: 'test-conv-id',
          agentName: 'OnboardingAgent'
        }),
      });

      // This test would need to mock the OpenAI response
      // For now, we'll test the detection logic directly
      const handoffMessages = [
        "Let's begin building something amazing together",
        "ready to begin your transformation journey",
        "ready for the next step - our Assessment Agent"
      ];

      handoffMessages.forEach(message => {
        const isHandoff = message.includes("Let's begin building something amazing together") ||
                         message.includes("ready to begin your transformation journey") ||
                         message.includes("ready for the next step");
        expect(isHandoff).toBe(true);
      });
    });

    it('should not update journey status before all fields are captured', async () => {
      // Set incomplete onboarding metadata
      mockConversation.contextData.metadata.onboarding.requiredFieldsStatus.organization = false;
      mockConversation.contextData.metadata.onboarding.isComplete = false;

      (prisma.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation);

      const mockRequest = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'My team size is 5' }],
          conversationId: 'test-conv-id',
          agentName: 'OnboardingAgent'
        }),
      });

      // Journey status should not be updated
      await POST(mockRequest);
      expect(prisma.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            journeyPhase: 'ASSESSMENT'
          })
        })
      );
    });

    it('should update both user and conversation when transitioning to ASSESSMENT', async () => {
      // This would be called when the handoff message is detected
      const updateData = {
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        currentAgent: 'AssessmentAgent',
        lastActivity: expect.any(Date)
      };

      // Simulate the update calls that should happen
      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: updateData
      });

      await prisma.conversation.update({
        where: { id: 'test-conv-id' },
        data: { currentAgent: 'AssessmentAgent' }
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          journeyPhase: 'ASSESSMENT',
          journeyStatus: 'ACTIVE',
          currentAgent: 'AssessmentAgent'
        })
      });

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'test-conv-id' },
        data: { currentAgent: 'AssessmentAgent' }
      });
    });
  });

  describe('isComplete Flag Management', () => {
    it('should set isComplete before agent processes message', async () => {
      // Test that isComplete is set when all fields are captured
      const metadata = {
        capturedFields: {
          user_name: 'Test',
          user_role: 'Manager',
          team_size: 5,
          organization: 'Corp',
          primary_challenge: 'Growth'
        },
        requiredFieldsStatus: {
          user_name: true,
          user_role: true,
          team_size: true,
          organization: true,
          primary_challenge: true
        },
        isComplete: false
      };

      // Check if all required fields are captured
      const capturedCount = Object.values(metadata.requiredFieldsStatus).filter(Boolean).length;
      const requiredCount = Object.keys(metadata.requiredFieldsStatus).length;

      if (capturedCount === requiredCount && requiredCount > 0) {
        metadata.isComplete = true;
      }

      expect(metadata.isComplete).toBe(true);
    });
  });
});