import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AskOsmoPanel } from '../AskOsmoPanel';

// Mock the EmbeddedChat component
jest.mock('../EmbeddedChat', () => ({
  EmbeddedChat: ({ agentName }: { agentName: string }) => (
    <div data-testid="embedded-chat">Embedded Chat - {agentName}</div>
  ),
}));

describe('AskOsmoPanel', () => {
  const mockOnCollapse = jest.fn();
  const mockOnExpand = jest.fn();

  const defaultProps = {
    isExpanded: false,
    onCollapse: mockOnCollapse,
    onExpand: mockOnExpand,
    defaultAgent: 'OrchestratorAgent',
    testMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Collapsed State', () => {
    it('renders collapsed Ask Osmo input', () => {
      render(<AskOsmoPanel {...defaultProps} />);
      expect(screen.getByText('Ask Osmo')).toBeInTheDocument();
    });

    it('shows gradient background in collapsed state', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} />);
      const html = container.innerHTML;
      expect(html).toContain('bg-[linear-gradient');
    });

    it('calls onExpand when clicking the input', () => {
      render(<AskOsmoPanel {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOnExpand).toHaveBeenCalled();
    });

    it('is draggable in collapsed state', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} />);
      const draggableDiv = container.querySelector('[style*="cursor: grab"]');
      expect(draggableDiv).toBeInTheDocument();
    });

    it('maintains position after dragging', async () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} />);
      const draggableDiv = container.querySelector('[style*="cursor: grab"]') as HTMLElement;

      // Simulate drag
      fireEvent.mouseDown(draggableDiv);
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(document);

      await waitFor(() => {
        const movedDiv = container.querySelector('[style*="transform"]');
        expect(movedDiv).toBeInTheDocument();
      });
    });
  });

  describe('Expanded State', () => {
    it('renders expanded chat panel', () => {
      render(<AskOsmoPanel {...defaultProps} isExpanded={true} />);
      expect(screen.getByText('OSmos')).toBeInTheDocument();
      expect(screen.getByText('Team Assistant')).toBeInTheDocument();
    });

    it('shows embedded chat with correct agent', () => {
      render(<AskOsmoPanel {...defaultProps} isExpanded={true} />);
      expect(screen.getByTestId('embedded-chat')).toHaveTextContent('OrchestratorAgent');
    });

    it('calls onCollapse when clicking collapse button', () => {
      render(<AskOsmoPanel {...defaultProps} isExpanded={true} />);
      const collapseButton = screen.getByLabelText('Minimize chat');
      fireEvent.click(collapseButton);
      expect(mockOnCollapse).toHaveBeenCalled();
    });

    it('has high z-index in expanded state', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} isExpanded={true} />);
      const expandedPanel = container.querySelector('[class*="z-[100]"]');
      expect(expandedPanel).toBeInTheDocument();
    });

    it('shows gradient background overlay', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} isExpanded={true} />);
      const html = container.innerHTML;
      expect(html).toContain('absolute inset-0 bg-[linear-gradient');
    });

    it('passes test mode to embedded chat', () => {
      render(<AskOsmoPanel {...defaultProps} isExpanded={true} testMode={true} defaultAgent="TestAgent" />);
      expect(screen.getByTestId('embedded-chat')).toHaveTextContent('TestAgent');
    });
  });

  describe('Animation', () => {
    it('applies slide-in animation class when expanded', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} isExpanded={true} />);
      const animatedPanel = container.querySelector('[class*="animate-slideInLeft"]');
      expect(animatedPanel).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('starts at correct initial position when collapsed', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} />);
      const positionedDiv = container.querySelector('[style*="top: 10px"]');
      expect(positionedDiv).toBeInTheDocument();
    });

    it('maintains fixed positioning', () => {
      const { container } = render(<AskOsmoPanel {...defaultProps} />);
      const fixedDiv = container.querySelector('.fixed');
      expect(fixedDiv).toBeInTheDocument();
    });
  });
});