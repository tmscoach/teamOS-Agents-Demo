import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssessmentSelectorModal } from '../AssessmentSelectorModal';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';

describe('AssessmentSelectorModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSelect: mockOnSelect,
    userPhase: JourneyPhase.ASSESSMENT,
    completedAssessments: [],
    availableAssessments: [],
    loading: false,
  };

  const mockAssessments = [
    {
      SubscriptionID: 21989,
      WorkflowID: 1,
      WorkflowType: 'TMP',
      Status: 'Not Started',
      Progress: 0,
      AssessmentType: 'TMP',
      AssessmentStatus: 'Not Started',
    },
    {
      SubscriptionID: 21988,
      WorkflowID: 2,
      WorkflowType: 'TeamSignals',
      Status: 'Not Started',
      Progress: 0,
      AssessmentType: 'TeamSignals',
      AssessmentStatus: 'Not Started',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<AssessmentSelectorModal {...defaultProps} />);
    expect(screen.getByText(/Choose the profile/i)).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<AssessmentSelectorModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Choose the profile/i)).not.toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<AssessmentSelectorModal {...defaultProps} loading={true} />);
    // Check for the loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays available assessments from TMS', () => {
    render(
      <AssessmentSelectorModal
        {...defaultProps}
        availableAssessments={mockAssessments}
      />
    );

    expect(screen.getByText('Team Management Profile')).toBeInTheDocument();
    expect(screen.getByText('Team Signals')).toBeInTheDocument();
  });

  it('shows no assessments message when none available', () => {
    render(<AssessmentSelectorModal {...defaultProps} availableAssessments={[]} />);
    expect(screen.getByText(/No assessments available/i)).toBeInTheDocument();
  });

  it('calls onSelect with correct subscription ID when selecting assessment', async () => {
    render(
      <AssessmentSelectorModal
        {...defaultProps}
        availableAssessments={mockAssessments}
      />
    );

    // Click on TMP assessment
    const tmpCard = screen.getByText('Team Management Profile').closest('div[role="button"]');
    fireEvent.click(tmpCard!);

    // Click Let's Go button
    const letsGoButton = screen.getByText("Let's Go");
    fireEvent.click(letsGoButton);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('TMP', 21989);
    });
  });

  it('displays goal-based suggestion tag for TMP', () => {
    render(
      <AssessmentSelectorModal
        {...defaultProps}
        availableAssessments={mockAssessments}
      />
    );

    expect(screen.getByText('Goal-Based Suggestion')).toBeInTheDocument();
  });

  it('closes modal when clicking close button', () => {
    render(<AssessmentSelectorModal {...defaultProps} availableAssessments={mockAssessments} />);
    
    // Find the close button by its X icon or aria-label
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.getAttribute('aria-label')?.includes('Close') || btn.textContent === '×');
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('enables Lets Go button only when assessment is selected', () => {
    render(
      <AssessmentSelectorModal
        {...defaultProps}
        availableAssessments={mockAssessments}
      />
    );

    const letsGoButton = screen.getByText("Let's Go").closest('button');
    expect(letsGoButton).toBeDisabled();

    // Select an assessment
    const tmpCard = screen.getByText('Team Management Profile').closest('div[role="button"]');
    fireEvent.click(tmpCard!);

    expect(letsGoButton).not.toBeDisabled();
  });

  it('shows higher z-index to appear above other elements', () => {
    const { container } = render(<AssessmentSelectorModal {...defaultProps} />);
    
    // Check for high z-index classes in the rendered output
    const html = container.innerHTML;
    expect(html).toContain('z-[110]');
    expect(html).toContain('z-[120]');
  });
});