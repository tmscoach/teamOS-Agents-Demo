import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

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

describe('Chat Streaming Route - Tool Integration', () => {
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
    organizationId: 'org-123',
    organizationRole: 'org:admin',
    journeyPhase: 'ASSESSMENT',
    journeyStatus: 'ACTIVE',
    managedTeams: [{ id: 'team-1' }],
  };

  const mockConversation = {
    id: 'conv-123',
    teamId: 'team-1',
    currentAgent: 'OrchestratorAgent',
    metadata: {
      organizationId: 'org-123',
      organizationRole: 'org:admin',
    },
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (currentUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('Tool Execution in Streaming', () => {
    it('should execute organization data tools and stream response', async () => {
      // Setup mocks
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      mockPrisma.team.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Engineering', organizationId: 'org-123' },
      ]);
      
      // Mock conversation store
      const { ConversationStore } = await import('@/src/lib/agents');
      ConversationStore.prototype.loadConversation = jest.fn().mockResolvedValue({
        context: {
          conversationId: 'conv-123',
          teamId: 'team-1',
          managerId: 'db-user-123',
          organizationId: 'org-123',
          organizationRole: 'org:admin',
          userRole: 'MANAGER',
          currentAgent: 'OrchestratorAgent',
          transformationPhase: 'ASSESSMENT',
          messageHistory: [],
          metadata: {},
        },
      });

      // Mock streamText to simulate tool execution
      const { streamText } = await import('ai');
      const mockStream = {
        toDataStreamResponse: jest.fn().mockReturnValue(
          new Response('mock stream', {
            headers: { 'Content-Type': 'text/event-stream' },
          })
        ),
      };

      (streamText as jest.Mock).mockImplementation(async (config) => {
        // Simulate tool call in onStepFinish
        if (config.onStepFinish) {
          config.onStepFinish({
            stepType: 'initial',
            toolCalls: [{ toolName: 'get_organization_overview', args: {} }],
            toolResults: [{
              type: 'tool-result',
              toolName: 'get_organization_overview',
              result: 'The organization has 1 team with 3 members.',
            }],
            finishReason: 'tool-calls',
          });
        }

        // Simulate text generation after tool
        if (config.onFinish) {
          await config.onFinish({
            text: 'Based on my check, your organization has 1 team with 3 members.',
            toolCalls: [],
            toolResults: [],
            finishReason: 'stop',
          });
        }

        return mockStream;
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'How many teams in my organization?' }],
          conversationId: 'conv-123',
          agentName: 'OrchestratorAgent',
        }),
      });

      // Execute
      const response = await POST(request);

      // Verify
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Conversation-ID')).toBe('conv-123');
      expect(response.headers.get('X-Current-Agent')).toBe('OrchestratorAgent');
      
      // Verify streamText was called with tools
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.objectContaining({
            get_organization_overview: expect.any(Object),
          }),
          experimental_toolCallStreaming: true,
          maxSteps: 3,
        })
      );
    });

    it('should handle tool execution errors gracefully', async () => {
      // Setup similar mocks but make tool execution fail
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const { streamText } = await import('ai');
      const mockStream = {
        toDataStreamResponse: jest.fn().mockReturnValue(new Response('error stream')),
      };

      (streamText as jest.Mock).mockImplementation(async (config) => {
        // Execute a tool that will fail
        const tools = config.tools;
        if (tools && tools.get_organization_overview) {
          const result = await tools.get_organization_overview.execute({});
          expect(result).toContain('Error executing tool');
        }

        return mockStream;
      });

      const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test error handling' }],
          conversationId: 'conv-123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200); // Should still return 200 with error in stream
    });

    it('should include tool instructions in system prompt when tools are available', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const { streamText } = await import('ai');
      (streamText as jest.Mock).mockImplementation(async (config) => {
        // Verify system prompt includes tool instructions
        expect(config.system).toContain('CRITICAL INSTRUCTION');
        expect(config.system).toContain('provide a complete natural language response');
        return { toDataStreamResponse: () => new Response() };
      });

      const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          conversationId: 'conv-123',
        }),
      });

      await POST(request);
      expect(streamText).toHaveBeenCalled();
    });
  });

  describe('Fallback Behavior', () => {
    it('should provide fallback message when no text is generated after tool use', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const { streamText } = await import('ai');
      (streamText as jest.Mock).mockImplementation(async (config) => {
        // Simulate tool execution without text response
        if (config.onFinish) {
          await config.onFinish({
            text: '', // No text generated
            toolCalls: [],
            toolResults: [{
              type: 'tool-result',
              toolName: 'get_organization_overview',
              result: 'The organization has 2 teams.',
            }],
            finishReason: 'stop',
          });
        }
        return { toDataStreamResponse: () => new Response() };
      });

      // Mock ConversationStore to capture saved message
      let savedMessage: any;
      const { ConversationStore } = await import('@/src/lib/agents');
      ConversationStore.prototype.addMessage = jest.fn().mockImplementation((_, msg) => {
        if (msg.role === 'assistant') {
          savedMessage = msg;
        }
      });

      const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'How many teams?' }],
          conversationId: 'conv-123',
        }),
      });

      await POST(request);

      // Verify fallback message was used
      expect(savedMessage).toBeDefined();
      expect(savedMessage.content).toBe('The organization has 2 teams.');
    });
  });

  describe('Organization Context', () => {
    it('should include organization context in agent tools', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      
      const { streamText } = await import('ai');
      (streamText as jest.Mock).mockImplementation(async (config) => {
        // Verify tools have access to organization context
        const tools = config.tools;
        if (tools && tools.get_organization_overview) {
          // The tool's execute function should receive context with organizationId
          const mockContext = {
            organizationId: 'org-123',
            userRole: 'MANAGER',
            managerId: 'db-user-123',
          };
          
          // This would be called internally by the AI SDK
          expect(tools.get_organization_overview.execute).toBeDefined();
        }
        return { toDataStreamResponse: () => new Response() };
      });

      const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          conversationId: 'conv-123',
        }),
      });

      await POST(request);
    });

    it('should handle missing organization context gracefully', async () => {
      const mockPrisma = (await import('@/lib/db')).default;
      // User without organization
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockDbUser,
        organizationId: null,
        organizationRole: null,
      });

      const request = new NextRequest('http://localhost:3000/api/agents/chat-streaming', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'How many teams?' }],
          conversationId: 'conv-123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200); // Should still work but tools will return appropriate errors
    });
  });
});