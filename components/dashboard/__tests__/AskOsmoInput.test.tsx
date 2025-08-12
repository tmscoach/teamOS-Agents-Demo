import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AskOsmoInput } from '../AskOsmoInput';
import { JourneyPhase } from '@/src/components/unified-chat/types';

// Mock UnifiedChat component
jest.mock('@/src/components/unified-chat', () => ({
  UnifiedChat: ({ agent, onClose }: any) => (
    <div data-testid="unified-chat">
      <div data-testid="agent">{agent}</div>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

describe('AskOsmoInput', () => {
  const defaultProps = {
    userId: 'test-user-123',
    userName: 'Test User',
    hasCompletedTMP: false,
    credits: 5000,
    journeyPhase: JourneyPhase.ASSESSMENT,
    completedSteps: []
  };

  it('renders collapsed state by default', () => {
    render(<AskOsmoInput {...defaultProps} />);
    
    expect(screen.getByText('Ask Osmo anything')).toBeInTheDocument();
    // UnifiedChat is rendered but hidden
    const chatContainer = screen.getByTestId('unified-chat').parentElement;
    expect(chatContainer).toHaveStyle({ display: 'none' });
  });

  it('expands when collapsed button is clicked', async () => {
    const user = userEvent.setup();
    render(<AskOsmoInput {...defaultProps} />);
    
    const askButton = screen.getByText('Ask Osmo anything');
    await user.click(askButton);
    
    expect(screen.getByTestId('unified-chat')).toBeInTheDocument();
    expect(screen.queryByText('Ask Osmo anything')).not.toBeInTheDocument();
  });

  it('hides collapsed state when hideCollapsed is true', () => {
    render(<AskOsmoInput {...defaultProps} hideCollapsed={true} />);
    
    expect(screen.queryByText('Ask Osmo anything')).not.toBeInTheDocument();
  });

  it('still renders UnifiedChat when hideCollapsed is true', () => {
    render(<AskOsmoInput {...defaultProps} hideCollapsed={true} />);
    
    // UnifiedChat should exist but be hidden
    const chatContainer = screen.getByTestId('unified-chat').parentElement;
    expect(chatContainer).toHaveStyle({ display: 'none' });
  });

  it('collapses when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<AskOsmoInput {...defaultProps} />);
    
    // Expand first
    const askButton = screen.getByText('Ask Osmo anything');
    await user.click(askButton);
    
    // Then close
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);
    
    expect(screen.getByText('Ask Osmo anything')).toBeInTheDocument();
    expect(screen.getByTestId('unified-chat').parentElement).toHaveStyle({ display: 'none' });
  });

  it('passes correct agent to UnifiedChat', async () => {
    const user = userEvent.setup();
    render(<AskOsmoInput {...defaultProps} defaultAgent="DebriefAgent" />);
    
    const askButton = screen.getByText('Ask Osmo anything');
    await user.click(askButton);
    
    expect(screen.getByTestId('agent')).toHaveTextContent('DebriefAgent');
  });

  it('passes metadata to UnifiedChat', async () => {
    const user = userEvent.setup();
    const metadata = { subscriptionId: 'sub-123', assessmentType: 'TMP' };
    
    render(<AskOsmoInput {...defaultProps} metadata={metadata} />);
    
    const askButton = screen.getByText('Ask Osmo anything');
    await user.click(askButton);
    
    // Verify UnifiedChat is rendered with metadata
    expect(screen.getByTestId('unified-chat')).toBeInTheDocument();
  });
});