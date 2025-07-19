import { POST } from '../route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}));

jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn()
    },
    conversation: {
      update: jest.fn()
    }
  }))
}));

// Mock conversation store
jest.mock('@/src/lib/agents/persistence', () => ({
  ConversationStore: jest.fn().mockImplementation(() => ({
    createConversation: jest.fn(),
    loadConversation: jest.fn(),
    updateContext: jest.fn(),
    addMessage: jest.fn()
  }))
}));

// Mock router
jest.mock('@/src/lib/agents/router', () => ({
  router: {
    getAgent: jest.fn()
  }
}));

// Mock agent config loader
jest.mock('@/src/lib/agents/config/agent-config-loader', () => ({
  AgentConfigLoader: {
    clearCache: jest.fn()
  }
}));

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

describe('Journey Status Update on Onboarding Completion', () => {
  let mockPrismaClient: any;
  let mockAuth: jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = auth as jest.MockedFunction<typeof auth>;
    mockPrismaClient = new PrismaClient();
  });

  it('updates journey status when onboarding completes', async () => {
    // Mock auth
    mockAuth.mockResolvedValue({
      userId: 'clerk_user_123',
      redirectToSignIn: jest.fn()
    } as any);

    // Mock user data
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      journeyPhase: 'ONBOARDING',
      journeyStatus: 'ONBOARDING',
      managedTeams: []
    };

    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.user.upsert.mockResolvedValue(mockUser);

    // Mock conversation with onboarding metadata
    const mockConversation = {
      context: {
        teamId: 'team_123',
        managerId: 'user_123',
        transformationPhase: 'onboarding',
        currentAgent: 'OnboardingAgent',
        conversationId: 'conv_123',
        messageHistory: [],
        metadata: {
          onboarding: {
            isComplete: true,
            capturedFields: {
              team_size: 5,
              user_name: 'Test User',
              user_role: 'Manager',
              organization: 'Test Corp',
              primary_challenge: 'Team alignment'
            }
          }
        }
      }
    };

    // Mock agent response that triggers handoff
    const handoffMessage = "Thank you for completing onboarding! You're ready to begin your transformation journey. Let's begin building something amazing together.";
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
      method: 'POST',
      body: JSON.stringify({
        message: 'ok',
        conversationId: 'conv_123'
      })
    });

    // Mock the conversation store to return our mock conversation
    const { ConversationStore } = await import('@/src/lib/agents/persistence');
    const mockStore = new ConversationStore();
    (mockStore.loadConversation as jest.Mock).mockResolvedValue(mockConversation);

    // Mock the agent
    const { router } = await import('@/src/lib/agents/router');
    const mockAgent = {
      buildSystemMessage: jest.fn().mockReturnValue('System prompt'),
      processMessage: jest.fn().mockResolvedValue({ response: handoffMessage })
    };
    (router.getAgent as jest.Mock).mockReturnValue(mockAgent);

    // Mock OpenAI streaming response
    const { default: OpenAI } = await import('openai');
    const mockOpenAI = new OpenAI();
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield { choices: [{ delta: { content: handoffMessage } }] };
      },
      controller: {
        abort: jest.fn()
      }
    };
    (mockOpenAI.chat.completions.create as jest.Mock).mockResolvedValue(mockStream);

    // Execute the request
    const response = await POST(request);
    
    // Wait for the stream to complete
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }

    // Verify user update was called with correct data
    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user_123' },
      data: {
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        currentAgent: 'AssessmentAgent',
        lastActivity: expect.any(Date),
        onboardingData: {
          extractedFields: {
            team_size: 5,
            user_name: 'Test User',
            user_role: 'Manager',
            organization: 'Test Corp',
            primary_challenge: 'Team alignment'
          },
          completedAt: expect.any(String)
        }
      }
    });

    // Verify conversation update was called
    expect(mockPrismaClient.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv_123' },
      data: { currentAgent: 'AssessmentAgent' }
    });
  });

  it('does not update journey status if onboarding is not complete', async () => {
    // Mock auth
    mockAuth.mockResolvedValue({
      userId: 'clerk_user_123',
      redirectToSignIn: jest.fn()
    } as any);

    // Mock user
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      journeyPhase: 'ONBOARDING',
      journeyStatus: 'ONBOARDING',
      managedTeams: []
    };
    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.user.upsert.mockResolvedValue(mockUser);

    // Mock conversation with incomplete onboarding
    const mockConversation = {
      context: {
        teamId: 'team_123',
        managerId: 'user_123',
        transformationPhase: 'onboarding',
        currentAgent: 'OnboardingAgent',
        conversationId: 'conv_123',
        messageHistory: [],
        metadata: {
          onboarding: {
            isComplete: false,
            capturedFields: {
              team_size: 5
            }
          }
        }
      }
    };

    // Create request
    const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
      method: 'POST',
      body: JSON.stringify({
        message: 'I have 5 people on my team',
        conversationId: 'conv_123'
      })
    });

    // Mock conversation store
    const { ConversationStore } = await import('@/src/lib/agents/persistence');
    const mockStore = new ConversationStore();
    (mockStore.loadConversation as jest.Mock).mockResolvedValue(mockConversation);

    // Mock agent
    const { router } = await import('@/src/lib/agents/router');
    const mockAgent = {
      buildSystemMessage: jest.fn().mockReturnValue('System prompt'),
      processMessage: jest.fn().mockResolvedValue({ 
        response: 'Thank you. What is your primary challenge?' 
      })
    };
    (router.getAgent as jest.Mock).mockReturnValue(mockAgent);

    // Execute request
    await POST(request);

    // Verify user update was NOT called
    expect(mockPrismaClient.user.update).not.toHaveBeenCalled();
    expect(mockPrismaClient.conversation.update).not.toHaveBeenCalled();
  });

  it('saves onboarding data correctly with all fields', async () => {
    // Mock auth
    mockAuth.mockResolvedValue({
      userId: 'clerk_user_123',
      redirectToSignIn: jest.fn()
    } as any);

    // Mock user
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      journeyPhase: 'ONBOARDING',
      managedTeams: []
    };
    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaClient.user.upsert.mockResolvedValue(mockUser);

    // Create complete onboarding data
    const completeOnboardingData = {
      team_size: 10,
      user_name: 'Jane Doe',
      user_role: 'Director',
      organization: 'Acme Corp',
      primary_challenge: 'Remote team collaboration'
    };

    // Mock conversation
    const mockConversation = {
      context: {
        teamId: 'team_123',
        managerId: 'user_123',
        transformationPhase: 'onboarding',
        currentAgent: 'OnboardingAgent',
        conversationId: 'conv_123',
        messageHistory: [],
        metadata: {
          onboarding: {
            isComplete: true,
            capturedFields: completeOnboardingData
          }
        }
      }
    };

    // Create request
    const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
      method: 'POST',
      body: JSON.stringify({
        message: 'ok',
        conversationId: 'conv_123'
      })
    });

    // Mock services
    const { ConversationStore } = await import('@/src/lib/agents/persistence');
    const mockStore = new ConversationStore();
    (mockStore.loadConversation as jest.Mock).mockResolvedValue(mockConversation);

    const { router } = await import('@/src/lib/agents/router');
    const handoffMessage = "Let's begin building something amazing together.";
    const mockAgent = {
      buildSystemMessage: jest.fn().mockReturnValue('System prompt'),
      processMessage: jest.fn().mockResolvedValue({ response: handoffMessage })
    };
    (router.getAgent as jest.Mock).mockReturnValue(mockAgent);

    // Execute
    await POST(request);

    // Verify onboarding data was saved correctly
    expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
      where: { id: 'user_123' },
      data: expect.objectContaining({
        onboardingData: {
          extractedFields: completeOnboardingData,
          completedAt: expect.any(String)
        }
      })
    });
  });
});