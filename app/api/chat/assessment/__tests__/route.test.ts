import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

// Mock dependencies
jest.mock('@/src/lib/auth/clerk-dev-wrapper', () => ({
  currentUser: jest.fn()
}));

jest.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('ai', () => ({
  streamText: jest.fn(),
  tool: jest.fn((config) => config)
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => 'mock-model')
}));

jest.mock('@/src/lib/agents/implementations/assessment-agent', () => ({
  createAssessmentAgent: jest.fn(() => ({
    name: 'AssessmentAgent',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    tools: [
      {
        name: 'search_tms_knowledge',
        description: 'Search the TMS knowledge base',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' }
          },
          required: ['query']
        },
        execute: jest.fn().mockResolvedValue({
          success: true,
          output: 'Mocked TMS knowledge'
        })
      }
    ]
  }))
}));

describe('Assessment Chat Route', () => {
  const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated user
    mockCurrentUser.mockResolvedValue({
      id: 'user_123',
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    } as any);
  });

  describe('Knowledge Base Integration', () => {
    it('should include knowledge base tools in the stream configuration', async () => {
      const { streamText } = require('ai');
      
      // Mock the database user
      const prisma = require('@/lib/db').default;
      prisma.user.findUnique.mockResolvedValue({
        id: 'db-user-123',
        email: 'test@example.com',
        Team_Team_managerIdToUser: []
      });
      
      // Mock streamText to capture the configuration
      let capturedConfig: any;
      streamText.mockImplementation((config: any) => {
        capturedConfig = config;
        return {
          toDataStreamResponse: () => new Response('stream')
        };
      });

      // Create request
      const request = new NextRequest('http://localhost:3000/api/chat/assessment', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Tell me about the TMP handbook' }],
          conversationId: null,
          agentName: 'AssessmentAgent',
          selectedAssessment: null,
          workflowState: null,
          visibleSection: 'assessment',
          currentAnswers: {}
        })
      });

      await POST(request);

      // Verify tools were included
      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.tools).toBeDefined();
      expect(Object.keys(capturedConfig.tools)).toContain('search_tms_knowledge');
    });

    it('should use mandatory knowledge base instructions in system prompt', async () => {
      const { streamText } = require('ai');
      
      // Mock the database user
      const prisma = require('@/lib/db').default;
      prisma.user.findUnique.mockResolvedValue({
        id: 'db-user-123',
        email: 'test@example.com',
        Team_Team_managerIdToUser: []
      });
      
      // Mock streamText to capture the configuration
      let capturedConfig: any;
      streamText.mockImplementation((config: any) => {
        capturedConfig = config;
        return {
          toDataStreamResponse: () => new Response('stream')
        };
      });

      // Create request asking about TMP
      const request = new NextRequest('http://localhost:3000/api/chat/assessment', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'What is the TMP assessment?' }],
          conversationId: null,
          agentName: 'AssessmentAgent'
        })
      });

      await POST(request);

      // Verify system prompt includes mandatory instructions
      expect(capturedConfig.system).toContain('MANDATORY BEHAVIOR');
      expect(capturedConfig.system).toContain('YOU MUST');
      expect(capturedConfig.system).toContain('IMMEDIATELY use the knowledge base tools');
      expect(capturedConfig.system).toContain('search_tms_knowledge');
    });

    it('should use lower temperature for consistent tool usage', async () => {
      const { streamText } = require('ai');
      
      const prisma = require('@/lib/db').default;
      prisma.user.findUnique.mockResolvedValue({
        id: 'db-user-123',
        email: 'test@example.com',
        Team_Team_managerIdToUser: []
      });
      
      let capturedConfig: any;
      streamText.mockImplementation((config: any) => {
        capturedConfig = config;
        return {
          toDataStreamResponse: () => new Response('stream')
        };
      });

      const request = new NextRequest('http://localhost:3000/api/chat/assessment', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      await POST(request);

      // Should use low temperature for consistent behavior
      expect(capturedConfig.temperature).toBe(0.3);
    });

    it('should include both knowledge base and assessment tools', async () => {
      const { streamText } = require('ai');
      
      const prisma = require('@/lib/db').default;
      prisma.user.findUnique.mockResolvedValue({
        id: 'db-user-123',
        email: 'test@example.com',
        Team_Team_managerIdToUser: []
      });
      
      let capturedConfig: any;
      streamText.mockImplementation((config: any) => {
        capturedConfig = config;
        return {
          toDataStreamResponse: () => new Response('stream')
        };
      });

      const request = new NextRequest('http://localhost:3000/api/chat/assessment', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          workflowState: { questions: [] }
        })
      });

      await POST(request);

      const toolNames = Object.keys(capturedConfig.tools);
      
      // Knowledge base tools
      expect(toolNames).toContain('search_tms_knowledge');
      
      // Assessment-specific tools
      expect(toolNames).toContain('answer_question');
      expect(toolNames).toContain('navigate_page');
      expect(toolNames).toContain('explain_question');
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthenticated requests', async () => {
      mockCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/chat/assessment', {
        method: 'POST',
        body: JSON.stringify({ messages: [] })
      });

      const response = await POST(request);
      
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('should handle user not found in database', async () => {
      const prisma = require('@/lib/db').default;
      prisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/chat/assessment', {
        method: 'POST',
        body: JSON.stringify({ messages: [] })
      });

      const response = await POST(request);
      
      expect(response.status).toBe(404);
      expect(await response.text()).toBe('User not found');
    });
  });
});