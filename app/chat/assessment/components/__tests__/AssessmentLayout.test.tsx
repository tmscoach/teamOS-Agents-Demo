import React from 'react';
import { render, screen } from '@testing-library/react';
import AssessmentLayout from '../AssessmentLayout';
import { Message } from 'ai';

// Mock child components
jest.mock('../ChatPanelWrapper', () => ({
  ChatPanelWrapper: ({ messages, input, isLoading }: any) => (
    <div data-testid="chat-panel-wrapper">
      <div data-testid="messages-count">{messages.length} messages</div>
      <div data-testid="input-value">{input}</div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'not-loading'}</div>
    </div>
  )
}));

jest.mock('../AssessmentViewer', () => {
  return function MockAssessmentViewer({ 
    assessment, 
    workflowState, 
    currentAnswers,
    isCompleting 
  }: any) {
    return (
      <div data-testid="assessment-viewer">
        <div data-testid="assessment-type">{assessment.AssessmentType}</div>
        <div data-testid="workflow-page">Page {workflowState.currentPageId}</div>
        <div data-testid="answers-count">{Object.keys(currentAnswers).length} answers</div>
        <div data-testid="completing-state">{isCompleting ? 'completing' : 'not-completing'}</div>
      </div>
    );
  };
});

jest.mock('../AssessmentSelector', () => {
  return function MockAssessmentSelector({ assessments, onSelect }: any) {
    return (
      <div data-testid="assessment-selector">
        <div data-testid="assessments-count">{assessments.length} available</div>
        {assessments.map((assessment: any) => (
          <button 
            key={assessment.SubscriptionID}
            data-testid={`select-${assessment.SubscriptionID}`}
            onClick={() => onSelect(assessment)}
          >
            Select {assessment.AssessmentType}
          </button>
        ))}
      </div>
    );
  };
});

describe('AssessmentLayout', () => {
  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there!' }
  ];

  const mockAssessments = [
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

  const mockWorkflowState = {
    subscriptionId: '1',
    workflowId: '101',
    currentPageId: 1,
    currentSectionId: 1,
    baseContentId: 1,
    questions: [
      { questionID: 1, type: 'text', text: 'Question 1' }
    ],
    navigationInfo: {},
    completionPercentage: 10
  };

  const defaultProps = {
    messages: mockMessages,
    input: 'test input',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    availableAssessments: mockAssessments,
    selectedAssessment: null,
    onSelectAssessment: jest.fn(),
    workflowState: null,
    currentAnswers: {},
    onAnswerChange: jest.fn(),
    onSubmitPage: jest.fn(),
    onSectionChange: jest.fn(),
    visibleSection: 'assessment',
    isCompleting: false
  };

  it('renders assessment selector when no assessment is selected', () => {
    render(<AssessmentLayout {...defaultProps} />);

    expect(screen.getByTestId('assessment-selector')).toBeInTheDocument();
    expect(screen.getByTestId('assessments-count')).toHaveTextContent('2 available');
    expect(screen.getByTestId('chat-panel-wrapper')).toBeInTheDocument();
  });

  it('renders assessment viewer when assessment and workflow are selected', () => {
    const props = {
      ...defaultProps,
      selectedAssessment: mockAssessments[0],
      workflowState: mockWorkflowState
    };

    render(<AssessmentLayout {...props} />);

    expect(screen.getByTestId('assessment-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('assessment-type')).toHaveTextContent('TMP');
    expect(screen.getByTestId('workflow-page')).toHaveTextContent('Page 1');
    expect(screen.queryByTestId('assessment-selector')).not.toBeInTheDocument();
  });

  it('passes correct props to ChatPanelWrapper', () => {
    render(<AssessmentLayout {...defaultProps} />);

    expect(screen.getByTestId('messages-count')).toHaveTextContent('2 messages');
    expect(screen.getByTestId('input-value')).toHaveTextContent('test input');
    expect(screen.getByTestId('loading-state')).toHaveTextContent('not-loading');
  });

  it('passes isLoading state correctly', () => {
    const props = {
      ...defaultProps,
      isLoading: true
    };

    render(<AssessmentLayout {...props} />);

    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
  });

  it('passes current answers to AssessmentViewer', () => {
    const props = {
      ...defaultProps,
      selectedAssessment: mockAssessments[0],
      workflowState: mockWorkflowState,
      currentAnswers: { 1: 'Answer 1', 2: 'Answer 2' }
    };

    render(<AssessmentLayout {...props} />);

    expect(screen.getByTestId('answers-count')).toHaveTextContent('2 answers');
  });

  it('passes isCompleting state to AssessmentViewer', () => {
    const props = {
      ...defaultProps,
      selectedAssessment: mockAssessments[0],
      workflowState: mockWorkflowState,
      isCompleting: true
    };

    render(<AssessmentLayout {...props} />);

    expect(screen.getByTestId('completing-state')).toHaveTextContent('completing');
  });

  it('renders nothing in viewer area when assessment is selected but no workflow state', () => {
    const props = {
      ...defaultProps,
      selectedAssessment: mockAssessments[0],
      workflowState: null
    };

    render(<AssessmentLayout {...props} />);

    expect(screen.queryByTestId('assessment-viewer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('assessment-selector')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-panel-wrapper')).toBeInTheDocument();
  });

  it('renders with empty assessments list', () => {
    const props = {
      ...defaultProps,
      availableAssessments: []
    };

    render(<AssessmentLayout {...props} />);

    // Should not render selector when no assessments available
    expect(screen.queryByTestId('assessment-selector')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-panel-wrapper')).toBeInTheDocument();
  });

  it('maintains consistent layout structure', () => {
    const { container } = render(<AssessmentLayout {...defaultProps} />);

    // Check for main layout structure
    const mainContainer = container.querySelector('.bg-gray-50.min-h-screen');
    expect(mainContainer).toBeInTheDocument();

    const contentArea = container.querySelector('.w-\\[1280px\\]');
    expect(contentArea).toBeInTheDocument();
  });
});