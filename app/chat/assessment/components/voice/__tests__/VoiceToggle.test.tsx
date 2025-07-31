import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceToggle } from '../VoiceToggle';
import '@testing-library/jest-dom';

describe('VoiceToggle', () => {
  const defaultProps = {
    voiceState: 'idle' as const,
    onToggle: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render microphone icon when idle', () => {
    render(<VoiceToggle {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-gray-200');
  });

  it('should render with active state when listening', () => {
    render(<VoiceToggle {...defaultProps} voiceState="listening" />);
    
    const button = screen.getByRole('button', { name: /stop voice input/i });
    expect(button).toHaveClass('bg-red-500');
  });

  it('should be disabled when connecting', () => {
    render(<VoiceToggle {...defaultProps} voiceState="connecting" />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).toHaveClass('cursor-not-allowed');
    expect(button).toHaveAttribute('disabled');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<VoiceToggle {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  it('should call onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<VoiceToggle {...defaultProps} onToggle={onToggle} />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);
    
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should not call onToggle when disabled', () => {
    const onToggle = jest.fn();
    render(<VoiceToggle {...defaultProps} onToggle={onToggle} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);
    
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should not call onToggle when connecting', () => {
    const onToggle = jest.fn();
    render(<VoiceToggle {...defaultProps} onToggle={onToggle} voiceState="connecting" />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    fireEvent.click(button);
    
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(<VoiceToggle {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /start voice input/i });
    expect(button).toHaveAttribute('aria-label', 'Start voice input');
  });

  it('should update aria-label when active', () => {
    render(<VoiceToggle {...defaultProps} voiceState="listening" />);
    
    const button = screen.getByRole('button', { name: /stop voice input/i });
    expect(button).toHaveAttribute('aria-label', 'Stop voice input');
  });
});