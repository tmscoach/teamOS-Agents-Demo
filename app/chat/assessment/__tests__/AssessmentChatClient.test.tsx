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
    isCompleting
  }: any) {
    return (
      <div data-testid="assessment-layout">
        <div data-testid="messages">{messages.length} messages</div>
        <div data-testid="available-assessments">{availableAssessments.length} assessments</div>
        {selectedAssessment && (
          <div data-testid="selected-assessment">{selectedAssessment.AssessmentType}</div>
        )}
        {workflowState && (
          <div data-testid="workflow-state">
            Page: {workflowState.currentPageId}, Questions: {workflowState.questions.length}
          </div>
        )}
        <div data-testid="visible-section">{visibleSection}</div>
        <div data-testid="is-completing">{isCompleting ? 'completing' : 'not-completing'}</div>
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

// Store original location
const originalLocation = window.location;

describe('AssessmentChatClient', () => {
  const mockSearchParams = new Map();
  const mockAppend = jest.fn();
  const mockHandleInputChange = jest.fn();
  const mockHandleSubmit = jest.fn();

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

  beforeAll(() => {
    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    mockSearchParams.clear();
    window.location.href = '';
  });

  it('renders loading state initially', () => {
    const { container } = render(<AssessmentChatClient />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('loads available assessments on mount', async () => {
    const mockSubscriptions = [
      {
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
      },
      {
        SubscriptionID: 2,
        WorkflowID: 102,
        WorkflowType: 'QO2',
        Status: 'In Progress',
        Progress: 50,
        AssignmentDate: '2024-01-02',
        CompletionDate: null,
        OrganisationID: 1,
        OrganisationName: 'Test Org',
        AssessmentType: 'QO2',
        AssessmentStatus: 'In Progress'
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriptions: mockSubscriptions })
    });

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-layout')).toBeInTheDocument();
    });

    expect(screen.getByText('2 assessments')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/mock-tms/dashboard-subscriptions');
  });

  it('auto-selects assessment when assessmentType is provided', async () => {
    mockSearchParams.set('assessmentType', 'TMP');

    const mockSubscriptions = [
      {
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
      }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriptions: mockSubscriptions })
    });

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-assessment')).toHaveTextContent('TMP');
    });
  });

  it('starts workflow when assessment is selected', async () => {
    const mockSubscriptions = [
      {
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
          Questions: [
            { questionID: 1, type: 'text', text: 'Question 1' }
          ],
          completionPercentage: 10
        })
      });

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-layout')).toBeInTheDocument();
    });

    // Select assessment
    fireEvent.click(screen.getByText('Select First Assessment'));

    await waitFor(() => {
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('Page: 1, Questions: 1');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/mock-tms/start-workflow', expect.any(Object));
  });

  it('handles workflow page submission', async () => {
    const mockSubscriptions = [
      {
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
      }
    ];

    // Set up initial state with workflow
    (useChat as jest.Mock).mockReturnValue({
      messages: [],
      input: '',
      handleInputChange: mockHandleInputChange,
      handleSubmit: mockHandleSubmit,
      isLoading: false,
      append: mockAppend
    });

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
          Questions: [
            { questionID: 1, type: 'text', text: 'Question 1' }
          ],
          completionPercentage: 10
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workflow_updated: true,
          workflow_advanced: true,
          PageID: 2,
          CurrentSectionID: 1,
          BaseContentID: 1,
          Questions: [
            { questionID: 2, type: 'text', text: 'Question 2' }
          ],
          completionPercentage: 20
        })
      });

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-layout')).toBeInTheDocument();
    });

    // Select assessment
    fireEvent.click(screen.getByText('Select First Assessment'));

    await waitFor(() => {
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('Page: 1, Questions: 1');
    });

    // Submit page
    fireEvent.click(screen.getByText('Submit Page'));

    await waitFor(() => {
      expect(screen.getByTestId('workflow-state')).toHaveTextContent('Page: 2, Questions: 1');
    });

    expect(mockAppend).toHaveBeenCalledWith({
      role: 'assistant',
      content: expect.stringContaining('Progress saved!')
    });
  });

  it('handles workflow completion and report generation', async () => {
    const mockSubscriptions = [
      {
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
          Questions: [
            { questionID: 1, type: 'text', text: 'Question 1' }
          ],
          completionPercentage: 90
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workflow_updated: true,
          workflow_complete: true
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          reportUrl: '/reports/1'
        })
      });

    jest.useFakeTimers();

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-layout')).toBeInTheDocument();
    });

    // Select assessment
    fireEvent.click(screen.getByText('Select First Assessment'));

    await waitFor(() => {
      expect(screen.getByTestId('workflow-state')).toBeInTheDocument();
    });

    // Submit page (which will complete the workflow)
    fireEvent.click(screen.getByText('Submit Page'));

    await waitFor(() => {
      expect(screen.getByTestId('is-completing')).toHaveTextContent('completing');
    });

    expect(mockAppend).toHaveBeenCalledWith({
      role: 'assistant',
      content: expect.stringContaining('Congratulations!')
    });

    // Fast-forward timers
    jest.runAllTimers();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/mock-tms/generate-report', expect.any(Object));
    });

    expect(mockAppend).toHaveBeenCalledWith({
      role: 'assistant',
      content: expect.stringContaining('Report generated successfully!')
    });

    jest.useRealTimers();
  });

  it('displays error state when loading fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('sends initial greeting message when ready', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ subscriptions: [] })
    });

    jest.useFakeTimers();

    render(<AssessmentChatClient />);

    await waitFor(() => {
      expect(screen.getByTestId('assessment-layout')).toBeInTheDocument();
    });

    // Fast-forward timers
    jest.runOnlyPendingTimers();

    expect(mockAppend).toHaveBeenCalledWith({
      role: 'user',
      content: ''
    });

    jest.useRealTimers();
  });
});