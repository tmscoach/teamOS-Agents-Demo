import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranscriptDisplay } from '../TranscriptDisplay';
import '@testing-library/jest-dom';

describe('TranscriptDisplay', () => {
  it('should render nothing when no transcript or command', () => {
    const { container } = render(<TranscriptDisplay transcript="" lastCommand={null} isListening={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render transcript when provided', () => {
    render(<TranscriptDisplay transcript="Hello, this is a test" lastCommand={null} isListening={true} />);
    
    expect(screen.getByText('You said:')).toBeInTheDocument();
    expect(screen.getByText('"Hello, this is a test"')).toBeInTheDocument();
  });

  it('should show "Last heard" when not listening', () => {
    render(<TranscriptDisplay transcript="Previous message" lastCommand={null} isListening={false} />);
    
    expect(screen.getByText('Last heard:')).toBeInTheDocument();
    expect(screen.getByText('"Previous message"')).toBeInTheDocument();
  });

  it('should render navigation command', () => {
    const command = { type: 'navigation' as const, parameters: { target: 'next page' } };
    render(<TranscriptDisplay transcript="" lastCommand={command} isListening={false} />);
    
    expect(screen.getByText('Understood as:')).toBeInTheDocument();
    expect(screen.getByText('Navigate: next page')).toBeInTheDocument();
  });

  it('should render answer command with formatted value', () => {
    const command = { type: 'answer' as const, parameters: { value: '20' } };
    render(<TranscriptDisplay transcript="" lastCommand={command} isListening={false} />);
    
    expect(screen.getByText('Understood as:')).toBeInTheDocument();
    expect(screen.getByText('Answer: 2-0 (Strongly left)')).toBeInTheDocument();
  });

  it('should render unknown command message', () => {
    const command = { type: 'unknown' as const };
    render(<TranscriptDisplay transcript="" lastCommand={command} isListening={false} />);
    
    expect(screen.getByText('Understood as:')).toBeInTheDocument();
    expect(screen.getByText('Not understood - try saying "help" for commands')).toBeInTheDocument();
  });

  it('should render both transcript and command when both present', () => {
    const command = { type: 'action' as const, parameters: { target: 'help' } };
    render(<TranscriptDisplay transcript="show help" lastCommand={command} isListening={false} />);
    
    expect(screen.getByText('Last heard:')).toBeInTheDocument();
    expect(screen.getByText('"show help"')).toBeInTheDocument();
    expect(screen.getByText('Understood as:')).toBeInTheDocument();
    expect(screen.getByText('Action: help')).toBeInTheDocument();
  });

  it('should have proper layout classes', () => {
    const { container } = render(<TranscriptDisplay transcript="Test" lastCommand={null} isListening={false} />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-gray-50');
    expect(wrapper).toHaveClass('rounded-lg');
    expect(wrapper).toHaveClass('p-4');
    expect(wrapper).toHaveClass('space-y-2');
  });
});