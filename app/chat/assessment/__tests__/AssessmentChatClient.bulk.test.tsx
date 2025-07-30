import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';
import AssessmentChatClient from '../AssessmentChatClient';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn()
}));

jest.mock('ai/react', () => ({
  useChat: jest.fn()
}));

jest.mock('../components/AssessmentLayout', () => {
  return function MockAssessmentLayout({ 
    messages, 
    availableAssessments, 
    selectedAssessment,
    onSelectAssessment,
    workflowState,
    currentAnswers,
    onAnswerChange,
    onSubmitPage,
    visibleSection,
    isCompleting,
    updatingQuestions
  }: any) {
    return (
      <div data-testid="assessment-layout">
        <div data-testid="messages">{messages.length} messages</div>
        {workflowState && (
          <>
            <div data-testid="workflow-state">
              Page: {workflowState.currentPageId}, Questions: {workflowState.questions.length}
            </div>
            {workflowState.questions.map((q: any) => (
              <div key={q.QuestionID} data-testid={`question-${q.QuestionID}`}>
                <span>Question {q.Number}: {q.PrimaryWord} vs {q.SecondaryWord}</span>
                <span data-testid={`answer-${q.QuestionID}`}>
                  {currentAnswers[q.QuestionID] || 'none'}
                </span>
                <span data-testid={`updating-${q.QuestionID}`}>
                  {updatingQuestions.has(q.QuestionID) ? 'updating' : 'idle'}
                </span>
              </div>
            ))}
          </>
        )}
        <button onClick={() => onSelectAssessment(availableAssessments[0])}>
          Select First Assessment
        </button>
        <button onClick={onSubmitPage}>Submit Page</button>
      </div>
    );
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('AssessmentChatClient - Bulk Answer Functionality', () => {
  const mockSearchParams = new Map();
  const mockAppend = jest.fn();
  const mockHandleInputChange = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockOnToolCall = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => mockSearchParams.get(key)
    });
    
    (useChat as jest.Mock).mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      isLoading: false,
      append: mockAppend
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ subscriptions: [] })
    });
  });

  const setupWorkflowWithQuestions = async () => {
    const mockSubscriptions = [{
      SubscriptionID: 1,
      WorkflowID: 101,
      WorkflowType: 'TMP',
      Status: 'Not Started',
      Progress: 0,
      AssignmentDate: '2024-01-01',
      CompletionDate: null,
      OrganisationID: 1,
      OrganisationName: 'Test Org',
      AssessmentType: 'TMP',
      AssessmentStatus: 'Not Started'
    }];

    const mockQuestions = [
      {
        QuestionID: 20,
        Number: "1",
        Type: 2,
        PrimaryWord: "Create",
        SecondaryWord: "Maintain"
      },
      {
        QuestionID: 21,
        Number: "2", 
        Type: 2,
        PrimaryWord: "Lead",
        SecondaryWord: "Follow"
      },
      {
        QuestionID: 22,
        Number: "3",
        Type: 2,
        PrimaryWord: "Analyze",
        SecondaryWord: "Act"
      }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscriptions: mockSubscriptions })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          firstPageUrl: '/Workflow/Process/1/1/1/1'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          PageID: 1,
          CurrentSectionID: 1,
          BaseContentID: 1,
          Questions: mockQuestions,
          completionPercentage: 10
        })
      });

    // Update mock to include onToolCall
    (useChat as jest.Mock).mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      isLoading: false,
      append: mockAppend,
      onToolCall: mockOnToolCall
    });

    const { rerender } = render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-layout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select First Assessment'));

    await waitFor(() => {
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('Page: 1, Questions: 3');
    });

    return { rerender, mockQuestions };
  };

  describe('onToolCall handler', () => {
    it('handles answer_question tool call with visual feedback', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      // Get the actual onToolCall function that was passed to useChat
      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      // Simulate tool call
      await onToolCall({
        toolCall: {
          toolName: 'answer_question',
          args: {
            questionId: 20,
            value: '20'
          }
        }
      });

      // Check that the question is marked as updating
      await waitFor(() => {
        expect(screen.getByTestId('updating-20')).toHaveTextContent('updating');
      });

      // Wait for update to complete
      await waitFor(() => {
        expect(screen.getByTestId('answer-20')).toHaveTextContent('20');
      }, { timeout: 3000 });

      // Check that updating state is cleared
      await waitFor(() => {
        expect(screen.getByTestId('updating-20')).toHaveTextContent('idle');
      });
    });

    it('handles answer_multiple_questions tool call with staggered animations', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      // Simulate bulk answer tool call
      await onToolCall({
        toolCall: {
          toolName: 'answer_multiple_questions',
          args: {
            questionIds: [20, 21, 22],
            value: '20'
          }
        }
      });

      // Check that questions are marked as updating in sequence
      await waitFor(() => {
        expect(screen.getByTestId('updating-20')).toHaveTextContent('updating');
      });

      await waitFor(() => {
        expect(screen.getByTestId('updating-21')).toHaveTextContent('updating');
      }, { timeout: 500 });

      await waitFor(() => {
        expect(screen.getByTestId('updating-22')).toHaveTextContent('updating');
      }, { timeout: 500 });

      // Check all answers are updated
      await waitFor(() => {
        expect(screen.getByTestId('answer-20')).toHaveTextContent('20');
        expect(screen.getByTestId('answer-21')).toHaveTextContent('20');
        expect(screen.getByTestId('answer-22')).toHaveTextContent('20');
      }, { timeout: 3000 });

      // Check that all updating states are cleared
      await waitFor(() => {
        expect(screen.getByTestId('updating-20')).toHaveTextContent('idle');
        expect(screen.getByTestId('updating-21')).toHaveTextContent('idle');
        expect(screen.getByTestId('updating-22')).toHaveTextContent('idle');
      });
    });

    it('handles navigate_page tool call without duplicate messages', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      // Clear previous append calls
      mockAppend.mockClear();

      // Simulate navigation tool call
      const result = await onToolCall({
        toolCall: {
          toolName: 'navigate_page',
          args: {
            direction: 'next'
          }
        }
      });

      // Should return appropriate result
      expect(result).toEqual({
        success: true,
        message: 'Navigating to next page'
      });

      // Should NOT append a message when triggered by agent
      expect(mockAppend).not.toHaveBeenCalled();
    });

    it('returns appropriate responses for each tool', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      // Test answer_question response
      const answerResult = await onToolCall({
        toolCall: {
          toolName: 'answer_question',
          args: {
            questionId: 20,
            value: '21'
          }
        }
      });

      expect(answerResult).toEqual({
        success: true,
        message: 'Set answer for question 20 to 21'
      });

      // Test answer_multiple_questions response
      const bulkResult = await onToolCall({
        toolCall: {
          toolName: 'answer_multiple_questions',
          args: {
            questionIds: [21, 22],
            value: '12'
          }
        }
      });

      expect(bulkResult).toEqual({
        success: true,
        message: 'Updated 2 questions with answer 12'
      });

    });

    it('handles unknown tool gracefully', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      const result = await onToolCall({
        toolCall: {
          toolName: 'unknown_tool',
          args: {}
        }
      });

      expect(result).toEqual({
        success: false,
        message: 'Unknown tool: unknown_tool'
      });
    });
  });

  describe('value mapping', () => {
    it('correctly maps assessment values to stored values', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      // Test various value mappings
      const testCases = [
        { input: '20', expected: '20' },
        { input: '21', expected: '21' },
        { input: '12', expected: '12' },
        { input: '02', expected: '02' }
      ];

      for (const { input, expected } of testCases) {
        await onToolCall({
          toolCall: {
            toolName: 'answer_question',
            args: {
              questionId: 20,
              value: input
            }
          }
        });

        await waitFor(() => {
          expect(screen.getByTestId('answer-20')).toHaveTextContent(expected);
        });
      }
    });
  });

  describe('error handling', () => {
    it('handles missing questions gracefully', async () => {
      const { rerender } = await setupWorkflowWithQuestions();

      const useChatCall = (useChat as jest.Mock).mock.calls[0][0];
      const onToolCall = useChatCall.onToolCall;

      // Try to answer a non-existent question
      const result = await onToolCall({
        toolCall: {
          toolName: 'answer_question',
          args: {
            questionId: 999,
            value: '20'
          }
        }
      });

      // Should still return success but not update anything
      expect(result).toEqual({
        success: true,
        message: 'Set answer for question 999 to 20'
      });

      // No question should be marked as updating
      expect(screen.queryByTestId('updating-999')).not.toBeInTheDocument();
    });
  });
});