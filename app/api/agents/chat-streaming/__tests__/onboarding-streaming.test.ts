import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { streamText } from 'ai';

// Mock dependencies
jest.mock('@/src/lib/auth/clerk-dev-wrapper');
jest.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
    agentConfiguration: {
      findFirst: jest.fn(),
    },
    guardrailCheck: {
      create: jest.fn(),
    },
  },
}));

// Mock AI SDK
jest.mock('ai', () => ({
  streamText: jest.fn(),
  tool: jest.fn((config) => config),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => 'mock-openai-model'),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

describe('OnboardingAgent Streaming', () => {
  const mockUser = {
    id: 'user-123',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    fullName: 'Test User',
  };

  const mockDbUser = {
    id: 'db-user-123',
    clerkId: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'MANAGER',
    journeyPhase: 'ONBOARDING',
    journeyStatus: 'ACTIVE',
    Team_Team_managerIdToUser: [{ id: 'team-1' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  it('should successfully stream OnboardingAgent greeting with tools enabled', async () => {
    // Setup mocks
    const mockPrisma = (await import('@/lib/db')).default;
    mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
    mockPrisma.user.create.mockResolvedValue(mockDbUser);
    mockPrisma.guardrailCheck.create.mockResolvedValue({ id: 'guard-123' });

    // Mock conversation store
    const { ConversationStore } = await import('@/src/lib/agents');
    ConversationStore.prototype.createConversation = jest.fn().mockResolvedValue('conv-123');
    ConversationStore.prototype.loadConversation = jest.fn().mockResolvedValue({
      context: {
        conversationId: 'conv-123',
        teamId: 'team-1',
        managerId: 'db-user-123',
        currentAgent: 'OnboardingAgent',
        transformationPhase: 'ONBOARDING',
        messageHistory: [],
        metadata: {
          onboarding: {
            capturedFields: {},
            requiredFieldsStatus: {
              team_size: false,
              user_name: false,
              user_role: false,
              organization: false,
              primary_challenge: false,
            },
            isComplete: false,
          },
        },
      },
    });
    ConversationStore.prototype.addMessage = jest.fn();
    ConversationStore.prototype.updateContext = jest.fn();
    ConversationStore.prototype.addEvent = jest.fn();

    // Mock streamText to return a proper stream response
    const mockStream = {
      toDataStreamResponse: jest.fn().mockReturnValue(
        new Response('data: {"type":"text","content":"Hello! I\'m OSmos"}\n\n', {
          headers: { 
            'Content-Type': 'text/event-stream',
            'X-Conversation-ID': 'conv-123',
          },
        })
      ),
    };

    (streamText as jest.Mock).mockImplementation(async (config) => {
      // Verify that tools are properly configured
      expect(config.tools).toBeDefined();
      expect(Object.keys(config.tools || {}).length).toBeGreaterThan(0);
      
      // Verify tools include OnboardingAgent specific tools
      const toolNames = Object.keys(config.tools || {});
      expect(toolNames).toContain('extractTeamInfo');
      expect(toolNames).toContain('validateRequiredFields');
      
      // Simulate text generation
      if (config.onFinish) {
        await config.onFinish({
          text: "Hello! I'm OSmos, your onboarding assistant. What's your name?",
          toolCalls: [],
          toolResults: [],
          finishReason: 'stop',
        });
      }

      return mockStream;
    });

    // Create request for initial greeting
    const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: '' }],
        agentName: 'OnboardingAgent',
      }),
    });

    // Execute
    const response = await POST(request);

    // Verify
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('X-Conversation-ID')).toBe('conv-123');
    
    // Verify streamText was called with tools
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.objectContaining({
          extractTeamInfo: expect.any(Object),
          validateRequiredFields: expect.any(Object),
        }),
      })
    );
  });

  it('should properly convert JSON Schema to Zod schema for tools', async () => {
    // This test verifies the schema conversion works correctly
    const mockPrisma = (await import('@/lib/db')).default;
    mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
    mockPrisma.guardrailCheck.create.mockResolvedValue({ id: 'guard-123' });

    const { ConversationStore } = await import('@/src/lib/agents');
    ConversationStore.prototype.createConversation = jest.fn().mockResolvedValue('conv-123');
    ConversationStore.prototype.loadConversation = jest.fn().mockResolvedValue({
      context: {
        conversationId: 'conv-123',
        teamId: 'team-1',
        managerId: 'db-user-123',
        currentAgent: 'OnboardingAgent',
        transformationPhase: 'ONBOARDING',
        messageHistory: [],
        metadata: {},
      },
    });
    ConversationStore.prototype.addMessage = jest.fn();
    ConversationStore.prototype.updateContext = jest.fn();
    ConversationStore.prototype.addEvent = jest.fn();

    let capturedTools: any = null;
    
    (streamText as jest.Mock).mockImplementation(async (config) => {
      capturedTools = config.tools;
      
      return {
        toDataStreamResponse: () => new Response('data: {"type":"text","content":"test"}\n\n', {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      };
    });

    const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        agentName: 'OnboardingAgent',
      }),
    });

    await POST(request);

    // Verify tools were created with proper Zod schemas
    expect(capturedTools).toBeDefined();
    expect(Object.keys(capturedTools).length).toBeGreaterThan(0);
    
    // Check that the tool conversion didn't throw errors
    for (const toolName of Object.keys(capturedTools)) {
      const tool = capturedTools[toolName];
      expect(tool).toBeDefined();
      expect(tool.parameters).toBeDefined();
      // The parameters should be a Zod schema object
      expect(tool.parameters._def).toBeDefined(); // Zod schemas have _def property
    }
  });
});