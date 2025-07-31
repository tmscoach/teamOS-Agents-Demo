import React from 'react';
import { render, screen } from '@testing-library/react';
import { VoiceIndicator } from '../VoiceIndicator';
import type { VoiceState } from '../../../../../../src/lib/services/voice/types';
import '@testing-library/jest-dom';

describe('VoiceIndicator', () => {
  it('should render listening state', () => {
    render(<VoiceIndicator state="listening" />);
    
    const indicator = screen.getByText(/listening.../i);
    expect(indicator).toBeInTheDocument();
    expect(indicator.parentElement).toHaveClass('bg-red-100');
  });

  it('should render thinking state', () => {
    render(<VoiceIndicator state="thinking" />);
    
    const indicator = screen.getByText(/thinking.../i);
    expect(indicator).toBeInTheDocument();
    expect(indicator.parentElement).toHaveClass('bg-yellow-100');
  });

  it('should render speaking state', () => {
    render(<VoiceIndicator state="speaking" />);
    
    const indicator = screen.getByText(/speaking.../i);
    expect(indicator).toBeInTheDocument();
    expect(indicator.parentElement).toHaveClass('bg-green-100');
  });

  it('should render ready state', () => {
    render(<VoiceIndicator state="ready" />);
    
    const indicator = screen.getByText(/ready/i);
    expect(indicator).toBeInTheDocument();
    expect(indicator.parentElement).toHaveClass('bg-blue-100');
  });

  it('should render connecting state', () => {
    render(<VoiceIndicator state="connecting" />);
    
    const indicator = screen.getByText(/connecting.../i);
    expect(indicator).toBeInTheDocument();
    expect(indicator.parentElement).toHaveClass('bg-gray-100');
  });

  it('should render error state', () => {
    render(<VoiceIndicator state="error" />);
    
    const indicator = screen.getByText(/error/i);
    expect(indicator).toBeInTheDocument();
    expect(indicator.parentElement).toHaveClass('bg-red-100');
  });

  it('should not render when state is disconnected', () => {
    const { container } = render(<VoiceIndicator state="disconnected" />);
    expect(container.firstChild).toBeNull();
  });

  it('should have proper layout classes', () => {
    render(<VoiceIndicator state="ready" />);
    
    const container = screen.getByText(/ready/i).parentElement;
    expect(container).toHaveClass('fixed');
    expect(container).toHaveClass('bottom-4');
    expect(container).toHaveClass('left-4');
    expect(container).toHaveClass('z-50');
  });

  it('should display appropriate icons for each state', () => {
    const { rerender } = render(<VoiceIndicator state="listening" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

    rerender(<VoiceIndicator state="thinking" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

    rerender(<VoiceIndicator state="speaking" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should apply animation classes based on state', () => {
    const { rerender } = render(<VoiceIndicator state="listening" />);
    let icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('animate-pulse');

    rerender(<VoiceIndicator state="thinking" />);
    icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('animate-spin');

    rerender(<VoiceIndicator state="speaking" />);
    icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('animate-pulse');
  });
});