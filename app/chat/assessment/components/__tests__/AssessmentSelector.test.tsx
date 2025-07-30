import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AssessmentSelector from '../AssessmentSelector';

describe('AssessmentSelector', () => {
  const mockAssessments = [
    {
      SubscriptionID: 1,
      WorkflowID: 101,
      WorkflowType: 'Team Management Profile',
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
      WorkflowType: 'Quality Outcome 2',
      Status: 'In Progress',
      Progress: 50,
      AssignmentDate: '2024-01-02',
      CompletionDate: null,
      OrganisationID: 1,
      OrganisationName: 'Test Org',
      AssessmentType: 'QO2',
      AssessmentStatus: 'In Progress'
    },
    {
      SubscriptionID: 3,
      WorkflowID: 103,
      WorkflowType: 'Team Signals Assessment',
      Status: 'Completed',
      Progress: 100,
      AssignmentDate: '2024-01-03',
      CompletionDate: '2024-01-10',
      OrganisationID: 1,
      OrganisationName: 'Test Org',
      AssessmentType: 'Team Signals',
      AssessmentStatus: 'Completed'
    }
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders heading and subtitle', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    expect(screen.getByText('Select an Assessment')).toBeInTheDocument();
    expect(screen.getByText('Choose an assessment to begin or continue')).toBeInTheDocument();
  });

  it('renders all assessments', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    expect(screen.getByText('TMP')).toBeInTheDocument();
    expect(screen.getByText('QO2')).toBeInTheDocument();
    expect(screen.getByText('Team Signals')).toBeInTheDocument();

    expect(screen.getByText('Team Management Profile')).toBeInTheDocument();
    expect(screen.getByText('Quality Outcome 2')).toBeInTheDocument();
    expect(screen.getByText('Team Signals Assessment')).toBeInTheDocument();
  });

  it('displays correct status badges', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays subscription IDs', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    expect(screen.getByText('ID: 1')).toBeInTheDocument();
    expect(screen.getByText('ID: 2')).toBeInTheDocument();
    expect(screen.getByText('ID: 3')).toBeInTheDocument();
  });

  it('calls onSelect when assessment is clicked', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    const tmpButton = screen.getByRole('button', { name: /TMP/i });
    fireEvent.click(tmpButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockAssessments[0]);
  });

  it('disables completed assessments', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    const completedButton = screen.getByRole('button', { name: /Team Signals/i });
    expect(completedButton).toBeDisabled();
  });

  it('does not call onSelect for completed assessments', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    const completedButton = screen.getByRole('button', { name: /Team Signals/i });
    fireEvent.click(completedButton);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('applies correct color classes based on assessment type', () => {
    const { container } = render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    const buttons = container.querySelectorAll('button');
    
    // TMP should have blue color scheme
    expect(buttons[0]).toHaveClass('bg-blue-50', 'hover:bg-blue-100', 'border-blue-200');
    
    // QO2 should have green color scheme
    expect(buttons[1]).toHaveClass('bg-green-50', 'hover:bg-green-100', 'border-green-200');
    
    // Team Signals should have purple color scheme
    expect(buttons[2]).toHaveClass('bg-purple-50', 'hover:bg-purple-100', 'border-purple-200');
  });

  it('renders empty state when no assessments available', () => {
    render(<AssessmentSelector assessments={[]} onSelect={mockOnSelect} />);

    expect(screen.getByText('No assessments available')).toBeInTheDocument();
  });

  it('applies correct status badge colors', () => {
    render(<AssessmentSelector assessments={mockAssessments} onSelect={mockOnSelect} />);

    const notStartedBadge = screen.getByText('Not Started');
    expect(notStartedBadge).toHaveClass('bg-gray-100', 'text-gray-700');

    const inProgressBadge = screen.getByText('In Progress');
    expect(inProgressBadge).toHaveClass('bg-yellow-100', 'text-yellow-700');

    const completedBadge = screen.getByText('Completed');
    expect(completedBadge).toHaveClass('bg-green-100', 'text-green-700');
  });

  it('renders with unknown assessment type', () => {
    const unknownAssessment = {
      ...mockAssessments[0],
      AssessmentType: 'Unknown Type'
    };

    const { container } = render(
      <AssessmentSelector assessments={[unknownAssessment]} onSelect={mockOnSelect} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gray-50', 'hover:bg-gray-100', 'border-gray-200');
  });

  it('renders multiple assessments of same type', () => {
    const duplicateAssessments = [
      mockAssessments[0],
      { ...mockAssessments[0], SubscriptionID: 4 }
    ];

    render(<AssessmentSelector assessments={duplicateAssessments} onSelect={mockOnSelect} />);

    const tmpElements = screen.getAllByText('TMP');
    expect(tmpElements).toHaveLength(2);
  });
});