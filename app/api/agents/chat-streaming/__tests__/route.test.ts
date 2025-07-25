import { POST } from '../route';
import { streamText } from 'ai';

jest.mock('ai', () => ({
  streamText: jest.fn(),
  createOpenAI: jest.fn(() => ({
    apiKey: 'test-key',
  })),
}));

jest.mock('@/lib/services/agent-configuration', () => ({
  getAgentConfiguration: jest.fn().mockResolvedValue({
    instructions: 'Test instructions',
    tools: [],
  }),
}));

jest.mock('@/lib/agents/tools', () => ({
  createStreamingTools: jest.fn().mockReturnValue({}),
}));

describe('DebriefAgent Streaming Route', () => {
  let mockRequest: Request;
  let mockStreamText: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStreamText = streamText as jest.MockedFunction<typeof streamText>;
  });

  describe('DebriefAgent special handling', () => {
    it('should inject subscription check instruction for first message', async () => {
      mockRequest = new Request('http://localhost/api/agents/chat-streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          context: {
            currentAgent: 'DebriefAgent',
            messageCount: 0,
            conversationId: 'test-123',
            teamId: 'team-123',
            managerId: 'manager-123',
          },
        }),
      });

      mockStreamText.mockResolvedValue({
        toDataStreamResponse: () => new Response('test stream'),
      });

      await POST(mockRequest);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('The user has just joined the conversation'),
            }),
          ]),
        })
      );
    });

    it('should inject subscription check for [User joined the conversation] message', async () => {
      mockRequest = new Request('http://localhost/api/agents/chat-streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: '[User joined the conversation]' },
          ],
          context: {
            currentAgent: 'DebriefAgent',
            messageCount: 1,
            conversationId: 'test-123',
            teamId: 'team-123',
            managerId: 'manager-123',
          },
        }),
      });

      mockStreamText.mockResolvedValue({
        toDataStreamResponse: () => new Response('test stream'),
      });

      await POST(mockRequest);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Please check what completed assessments they have available'),
            }),
          ]),
        })
      );
    });

    it('should inject skip instruction when user confirms debrief', async () => {
      mockRequest = new Request('http://localhost/api/agents/chat-streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'assistant',
              content: 'I see you have completed TMP (subscription ID: 21989). Would you like to review your results?',
            },
            { role: 'user', content: 'Yes, please start the debrief' },
          ],
          context: {
            currentAgent: 'DebriefAgent',
            messageCount: 2,
            conversationId: 'test-123',
            teamId: 'team-123',
            managerId: 'manager-123',
          },
        }),
      });

      mockStreamText.mockResolvedValue({
        toDataStreamResponse: () => new Response('test stream'),
      });

      await POST(mockRequest);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('The user has confirmed they want to start the TMP debrief'),
            }),
          ]),
        })
      );
    });

    it('should extract subscription ID from various formats', async () => {
      const testCases = [
        {
          assistant: 'TMP (subscription ID: 21989)',
          expectedId: '21989',
        },
        {
          assistant: 'TMP with SubscriptionID 21989',
          expectedId: '21989',
        },
        {
          assistant: 'TMP (SubscriptionID: 21989)',
          expectedId: '21989',
        },
        {
          assistant: 'TMP report (subscription 21989)',
          expectedId: '21989',
        },
      ];

      for (const testCase of testCases) {
        mockRequest = new Request('http://localhost/api/agents/chat-streaming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'assistant',
                content: `I see you have completed ${testCase.assistant}. Would you like to review?`,
              },
              { role: 'user', content: 'Yes' },
            ],
            context: {
              currentAgent: 'DebriefAgent',
              messageCount: 2,
              conversationId: 'test-123',
              teamId: 'team-123',
              managerId: 'manager-123',
            },
          }),
        });

        mockStreamText.mockResolvedValue({
          toDataStreamResponse: () => new Response('test stream'),
        });

        await POST(mockRequest);

        expect(mockStreamText).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: 'user',
                content: expect.stringContaining(
                  `Remember to use subscriptionId: '${testCase.expectedId}'`
                ),
              }),
            ]),
          })
        );
      }
    });

    it('should not modify messages for non-DebriefAgent', async () => {
      mockRequest = new Request('http://localhost/api/agents/chat-streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
          context: {
            currentAgent: 'OnboardingAgent',
            messageCount: 0,
            conversationId: 'test-123',
            teamId: 'team-123',
            managerId: 'manager-123',
          },
        }),
      });

      mockStreamText.mockResolvedValue({
        toDataStreamResponse: () => new Response('test stream'),
      });

      await POST(mockRequest);

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Hello', // Original content unchanged
            }),
          ]),
        })
      );
    });
  });
});