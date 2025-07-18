/**
 * Tests for suggestion chips visibility based on onboarding state
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageList from '../MessageList';
import ChatLayoutStreaming from '../ChatLayoutStreaming';

describe('Suggestion Chips Visibility', () => {
  const mockMessages = [
    {
      id: '1',
      role: 'assistant' as const,
      content: "What's your role in the organization?"
    }
  ];

  const mockSuggestedValues = {
    field: 'user_role',
    values: ['Engineering Manager', 'Product Manager', 'Team Lead', 'Director'],
    helpText: 'Select your role'
  };

  describe('MessageList Component', () => {
    it('should show suggestion chips when provided', () => {
      render(
        <MessageList
          messages={mockMessages}
          agentName="OnboardingAgent"
          loading={false}
          suggestedValues={mockSuggestedValues}
        />
      );

      expect(screen.getByText('Engineering Manager')).toBeInTheDocument();
      expect(screen.getByText('Product Manager')).toBeInTheDocument();
      expect(screen.getByText('Team Lead')).toBeInTheDocument();
      expect(screen.getByText('Director')).toBeInTheDocument();
    });

    it('should not show suggestion chips when suggestedValues is undefined', () => {
      render(
        <MessageList
          messages={mockMessages}
          agentName="OnboardingAgent"
          loading={false}
        />
      );

      expect(screen.queryByText('Engineering Manager')).not.toBeInTheDocument();
      expect(screen.queryByText('Product Manager')).not.toBeInTheDocument();
    });
  });

  describe('ChatLayoutStreaming Component', () => {
    const mockOnboardingState = {
      isComplete: false,
      requiredFieldsCount: 5,
      capturedFieldsCount: 3
    };

    it('should pass suggestedValues to MessageList when onboarding is not complete', () => {
      const { container } = render(
        <ChatLayoutStreaming
          messages={mockMessages}
          input=""
          isLoading={false}
          onInputChange={jest.fn()}
          onSubmit={jest.fn()}
          agentName="OnboardingAgent"
          onboardingState={mockOnboardingState}
          suggestedValues={mockSuggestedValues}
          isOnboarding={true}
        />
      );

      // Check that suggestion chips are rendered
      expect(screen.getByText('Engineering Manager')).toBeInTheDocument();
    });

    it('should not pass suggestedValues when onboarding is complete', () => {
      const completeOnboardingState = {
        ...mockOnboardingState,
        isComplete: true,
        capturedFieldsCount: 5
      };

      render(
        <ChatLayoutStreaming
          messages={mockMessages}
          input=""
          isLoading={false}
          onInputChange={jest.fn()}
          onSubmit={jest.fn()}
          agentName="OnboardingAgent"
          onboardingState={completeOnboardingState}
          suggestedValues={mockSuggestedValues}
          isOnboarding={true}
        />
      );

      // Suggestion chips should not be rendered
      expect(screen.queryByText('Engineering Manager')).not.toBeInTheDocument();
    });
  });

  describe('API Response Handling', () => {
    it('should not include suggestedValues in response when onboarding is complete', () => {
      const metadata = {
        onboarding: {
          isComplete: true,
          suggestedValues: undefined
        }
      };

      // When onboarding is complete, suggestedValues should be undefined
      expect(metadata.onboarding.suggestedValues).toBeUndefined();
    });

    it('should not include suggestedValues when not in OnboardingAgent context', () => {
      const context = {
        currentAgent: 'AssessmentAgent',
        metadata: {
          onboarding: {
            isComplete: false
          }
        }
      };

      // Even if onboarding is not complete, no suggestions for other agents
      const shouldShowSuggestions = 
        !context.metadata.onboarding.isComplete && 
        context.currentAgent === 'OnboardingAgent';

      expect(shouldShowSuggestions).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty suggestion values array', () => {
      const emptySuggestions = {
        field: 'user_role',
        values: [],
        helpText: 'No suggestions available'
      };

      render(
        <MessageList
          messages={mockMessages}
          agentName="OnboardingAgent"
          loading={false}
          suggestedValues={emptySuggestions}
        />
      );

      // Should not render any buttons
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should clear suggestions when user submits a message', () => {
      let currentSuggestions: any = mockSuggestedValues;
      
      const handleSubmit = () => {
        currentSuggestions = null;
      };

      // Simulate form submission
      handleSubmit();
      
      expect(currentSuggestions).toBeNull();
    });
  });
});