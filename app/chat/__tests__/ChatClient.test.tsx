/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatClient from '../ChatClient';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock ChatLayout component
jest.mock('../components/ChatLayout', () => {
  return function MockChatLayout({ messages, input, setInput, onSendMessage, loading, userName, agentName, onNewConversation }) {
    return (
      <div data-testid="chat-layout">
        <div data-testid="messages">
          {messages.map((msg) => (
            <div key={msg.id} data-testid={`message-${msg.id}`}>
              {msg.role}: {msg.content}
            </div>
          ))}
        </div>
        <input
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          data-testid="send-button"
          onClick={onSendMessage}
          disabled={loading}
        >
          Send
        </button>
        {onNewConversation && (
          <button data-testid="new-conversation-button" onClick={onNewConversation}>
            New Conversation
          </button>
        )}
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ChatClient - Conversation Persistence', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    (useUser as jest.Mock).mockReturnValue({
      user: { id: 'user-123', firstName: 'John' },
      isLoaded: true,
    });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  describe('localStorage persistence', () => {
    it('should store conversation ID in localStorage when conversation starts', async () => {
      mockSearchParams.set('new', 'true');
      mockSearchParams.set('agent', 'OnboardingAgent');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversationId: 'conv-123',
          message: 'Welcome! Let\'s get started.',
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'teamOS_activeConversationId',
          'conv-123'
        );
      });
    });

    it('should restore conversation from localStorage on mount', async () => {
      localStorageMock.getItem.mockReturnValue('existing-conv-123');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'existing-conv-123',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello',
              timestamp: new Date().toISOString(),
            },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'Hi there!',
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/agents/chat/conversation/existing-conv-123');
        expect(screen.getByTestId('message-msg-1')).toHaveTextContent('user: Hello');
        expect(screen.getByTestId('message-msg-2')).toHaveTextContent('assistant: Hi there!');
      });
    });

    it('should clear localStorage when conversation not found', async () => {
      localStorageMock.getItem.mockReturnValue('non-existent-conv');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('teamOS_activeConversationId');
      });
    });

    it('should clear localStorage when access denied', async () => {
      localStorageMock.getItem.mockReturnValue('forbidden-conv');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('teamOS_activeConversationId');
      });
    });

    it('should show restoration success message briefly', async () => {
      localStorageMock.getItem.mockReturnValue('existing-conv-123');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'existing-conv-123',
          messages: [{
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(screen.getByText('Conversation restored successfully')).toBeInTheDocument();
      });

      // Wait for the message to disappear
      await waitFor(() => {
        expect(screen.queryByText('Conversation restored successfully')).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('recent conversation loading', () => {
    it('should load most recent conversation if no localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversationId: 'recent-conv-123',
          messages: [{
            id: 'msg-recent',
            role: 'assistant',
            content: 'Welcome back!',
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/agents/chat/recent?agent=OrchestratorAgent');
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'teamOS_activeConversationId',
          'recent-conv-123'
        );
      });
    });
  });

  describe('new conversation handling', () => {
    it('should clear localStorage when starting new conversation', async () => {
      mockSearchParams.set('new', 'true');
      
      render(<ChatClient />);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('teamOS_activeConversationId');
    });

    it('should start new conversation with empty message', async () => {
      mockSearchParams.set('new', 'true');
      mockSearchParams.set('agent', 'OnboardingAgent');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversationId: 'new-conv-123',
          message: 'Hello! Welcome to teamOS.',
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/agents/chat-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "Hello, let's start",
            conversationId: null,
            agentName: 'OnboardingAgent',
          }),
        });
      });
    });
  });

  describe('message sending', () => {
    it('should update localStorage with new conversation ID on first message', async () => {
      render(<ChatClient />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('chat-layout')).toBeInTheDocument();
      });

      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');

      // Mock response for sending message
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversationId: 'new-conv-from-message',
          message: 'Thanks for your message!',
        }),
      });

      fireEvent.change(input, { target: { value: 'Hello team!' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'teamOS_activeConversationId',
          'new-conv-from-message'
        );
      });
    });

    it('should preserve conversation ID when sending subsequent messages', async () => {
      // Set up existing conversation
      localStorageMock.getItem.mockReturnValue('existing-conv-123');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'existing-conv-123',
          messages: [],
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(screen.getByTestId('chat-layout')).toBeInTheDocument();
      });

      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');

      // Mock response for sending message
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Response to your message',
        }),
      });

      fireEvent.change(input, { target: { value: 'Another message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/agents/chat-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Another message',
            conversationId: 'existing-conv-123',
            agentName: 'OrchestratorAgent',
          }),
        });
      });

      // Should not update localStorage since conversation ID hasn't changed
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'teamOS_activeConversationId',
        'existing-conv-123'
      );
    });
  });

  describe('new conversation button', () => {
    it('should show new conversation button when conversation exists', async () => {
      localStorageMock.getItem.mockReturnValue('existing-conv-123');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'existing-conv-123',
          messages: [],
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(screen.getByTestId('new-conversation-button')).toBeInTheDocument();
      });
    });

    it('should clear conversation and redirect when new conversation clicked', async () => {
      localStorageMock.getItem.mockReturnValue('existing-conv-123');
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'existing-conv-123',
          messages: [],
        }),
      });

      render(<ChatClient />);

      await waitFor(() => {
        expect(screen.getByTestId('new-conversation-button')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('new-conversation-button'));

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('teamOS_activeConversationId');
      expect(mockRouter.push).toHaveBeenCalledWith('/chat?agent=OrchestratorAgent&new=true');
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('existing-conv-123');
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<ChatClient />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load existing conversation:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should show error message when message sending fails', async () => {
      render(<ChatClient />);

      await waitFor(() => {
        expect(screen.getByTestId('chat-layout')).toBeInTheDocument();
      });

      const input = screen.getByTestId('chat-input');
      const sendButton = screen.getByTestId('send-button');

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Send failed'));

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('assistant: Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
      });
    });
  });
});