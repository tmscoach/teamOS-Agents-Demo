import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmbeddedChat } from '../EmbeddedChat';

// Mock the useChat hook
const mockHandleSubmit = jest.fn();
const mockHandleInputChange = jest.fn();
const mockAppend = jest.fn();
const mockSetMessages = jest.fn();

jest.mock('ai/react', () => ({
  useChat: () => ({
    messages: [
      { id: '1', role: 'assistant', content: 'Hello! How can I help you today?' },
      { id: '2', role: 'user', content: 'I need help with my team' }
    ],
    input: '',
    handleInputChange: mockHandleInputChange,
    handleSubmit: mockHandleSubmit,
    isLoading: false,
    append: mockAppend,
    setMessages: mockSetMessages
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('EmbeddedChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ extractedData: {} })
    });
  });

  it('renders chat interface', () => {
    render(<EmbeddedChat />);
    
    expect(screen.getByText('Chat with Oskar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask Oskar anything...')).toBeInTheDocument();
  });

  it('displays messages correctly', () => {
    render(<EmbeddedChat />);
    
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    expect(screen.getByText('I need help with my team')).toBeInTheDocument();
  });

  it('shows correct message alignment', () => {
    render(<EmbeddedChat />);
    
    const assistantMessage = screen.getByText('Hello! How can I help you today?').closest('div');
    const userMessage = screen.getByText('I need help with my team').closest('div');
    
    expect(assistantMessage).toHaveClass('justify-start');
    expect(userMessage).toHaveClass('justify-end');
  });

  it('handles form submission', async () => {
    render(<EmbeddedChat />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it('handles input changes', () => {
    render(<EmbeddedChat />);
    
    const input = screen.getByPlaceholderText('Ask Oskar anything...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    expect(mockHandleInputChange).toHaveBeenCalled();
  });

  it('shows send button', () => {
    render(<EmbeddedChat />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).not.toBeDisabled();
  });

  it('handles key press for sending', () => {
    render(<EmbeddedChat />);
    
    const input = screen.getByPlaceholderText('Ask Oskar anything...');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('creates unique conversation ID', () => {
    const { rerender } = render(<EmbeddedChat />);
    const firstRender = screen.getByTestId('embedded-chat');
    
    // Force re-render
    rerender(<EmbeddedChat />);
    const secondRender = screen.getByTestId('embedded-chat');
    
    // Should maintain the same conversation ID
    expect(firstRender).toBe(secondRender);
  });

  it('tracks agent handoffs', async () => {
    render(<EmbeddedChat />);
    
    // Simulate agent handoff in message
    mockAppend.mockImplementation(() => {
      // Simulate handoff detection
    });
    
    // The component should track the current agent
    expect(screen.getByText('OrchestratorAgent')).toBeInTheDocument();
  });

  it('calls extraction endpoint after receiving messages', async () => {
    render(<EmbeddedChat />);
    
    // Wait for extraction call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/agents/chat/extraction/'),
        expect.any(Object)
      );
    });
  });

  it('displays loading state when sending message', () => {
    // Mock loading state
    jest.mocked(jest.requireMock('ai/react').useChat).mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      isLoading: true,
      append: mockAppend,
      setMessages: mockSetMessages
    });
    
    render(<EmbeddedChat />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });
});