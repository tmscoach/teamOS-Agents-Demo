import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatClient from '../ChatClient';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  UserButton: () => <div>UserButton</div>
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('Suggested Values Integration', () => {
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    emailAddresses: [{ emailAddress: 'john@example.com' }]
  };

  const mockRouter = {
    push: jest.fn()
  };

  const mockSearchParams = {
    get: jest.fn((key) => key === 'agent' ? 'OnboardingAgent' : null)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser, isLoaded: true });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  it('should display suggested values when agent asks about a field with suggestions', async () => {
    // Mock initial greeting response
    const greetingResponse = {
      message: "Welcome! I'm OSmos. What's your name?",
      conversationId: 'conv-123',
      extractedData: {},
      onboardingState: {
        isComplete: false,
        requiredFieldsCount: 5,
        capturedFieldsCount: 0
      }
    };

    // Mock response with suggested values
    const challengeResponse = {
      message: "What primary challenge are you facing with your team?",
      conversationId: 'conv-123',
      extractedData: { manager_name: 'John' },
      onboardingState: {
        isComplete: false,
        requiredFieldsCount: 5,
        capturedFieldsCount: 1
      },
      metadata: {
        suggestedValues: {
          field: 'primary_challenge',
          values: [
            'Communication issues',
            'Low team morale',
            'Unclear goals',
            'Performance concerns'
          ],
          helpText: 'Choose the challenge that best fits your situation'
        }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => greetingResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => challengeResponse
      });

    render(<ChatClient />);

    // Wait for initial greeting
    await waitFor(() => {
      expect(screen.getByText(/Welcome! I'm OSmos/)).toBeInTheDocument();
    });

    // Type a message
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: "I'm John" } });
    
    // Send the message
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    // Wait for the response with suggested values
    await waitFor(() => {
      expect(screen.getByText(/What primary challenge are you facing/)).toBeInTheDocument();
    });

    // Check that suggested values are displayed
    await waitFor(() => {
      expect(screen.getByText('Communication issues')).toBeInTheDocument();
      expect(screen.getByText('Low team morale')).toBeInTheDocument();
      expect(screen.getByText('Unclear goals')).toBeInTheDocument();
      expect(screen.getByText('Performance concerns')).toBeInTheDocument();
    });

    // Check help text is displayed
    expect(screen.getByText('Choose the challenge that best fits your situation')).toBeInTheDocument();
    
    // Check the hint text
    expect(screen.getByText('💭 You can also type your own response if none of these fit')).toBeInTheDocument();
  });

  it('should populate input field when a suggested value is clicked', async () => {
    const responseWithSuggestions = {
      message: "What's your role at the company?",
      conversationId: 'conv-123',
      metadata: {
        suggestedValues: {
          field: 'manager_role',
          values: ['CTO', 'VP Engineering', 'Team Lead']
        }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Welcome!', conversationId: 'conv-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithSuggestions
      });

    render(<ChatClient />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/Welcome!/)).toBeInTheDocument();
    });

    // Send a message to trigger the response with suggestions
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Wait for suggested values to appear
    await waitFor(() => {
      expect(screen.getByText('CTO')).toBeInTheDocument();
    });

    // Click on a suggested value
    fireEvent.click(screen.getByText('VP Engineering'));

    // Check that the input is populated
    await waitFor(() => {
      expect(input).toHaveValue('VP Engineering');
    });
  });

  it('should not show suggested values when agent response has none', async () => {
    const responseWithoutSuggestions = {
      message: "Great! Let me explain how TMS can help your team.",
      conversationId: 'conv-123',
      extractedData: { primary_challenge: 'communication' }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Welcome!', conversationId: 'conv-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutSuggestions
      });

    render(<ChatClient />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome!/)).toBeInTheDocument();
    });

    // Send a message
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Communication issues' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(/Let me explain how TMS can help/)).toBeInTheDocument();
    });

    // Ensure no suggested values are shown
    expect(screen.queryByText('💭 You can also type your own response if none of these fit')).not.toBeInTheDocument();
  });

  it('should clear suggested values when new message is sent', async () => {
    const firstResponse = {
      message: "What challenge are you facing?",
      conversationId: 'conv-123',
      metadata: {
        suggestedValues: {
          field: 'primary_challenge',
          values: ['Communication issues', 'Low morale']
        }
      }
    };

    const secondResponse = {
      message: "Thank you! Now, what's your team size?",
      conversationId: 'conv-123',
      // No suggested values
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Welcome!', conversationId: 'conv-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => firstResponse
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondResponse
      });

    render(<ChatClient />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome!/)).toBeInTheDocument();
    });

    // First message
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hi' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Wait for suggested values
    await waitFor(() => {
      expect(screen.getByText('Communication issues')).toBeInTheDocument();
    });

    // Send another message
    fireEvent.change(input, { target: { value: 'Communication issues' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Wait for new response and ensure old suggestions are gone
    await waitFor(() => {
      expect(screen.getByText(/what's your team size/)).toBeInTheDocument();
      expect(screen.queryByText('Communication issues')).not.toBeInTheDocument();
      expect(screen.queryByText('Low morale')).not.toBeInTheDocument();
    });
  });
});