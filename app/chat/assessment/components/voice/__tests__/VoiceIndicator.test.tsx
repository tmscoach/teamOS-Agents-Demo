import React from 'react';
import { render, screen } from '@testing-library/react';
import { VoiceIndicator } from '../VoiceIndicator';
import type { VoiceState } from '../../../../../../src/lib/services/voice/types';
import '@testing-library/jest-dom';

describe('VoiceIndicator', () => {
  it('should render listening state', () => {
    render(<VoiceIndicator voiceState="listening" />);
    
    const indicator = screen.getByText('Listening...');
    expect(indicator).toBeInTheDocument();
    const container = indicator.parentElement;
    expect(container).toHaveClass('text-red-600');
  });

  it('should render thinking state', () => {
    render(<VoiceIndicator voiceState="thinking" />);
    
    const indicator = screen.getByText('OSmos is thinking...');
    expect(indicator).toBeInTheDocument();
    const container = indicator.parentElement;
    expect(container).toHaveClass('text-indigo-600');
  });

  it('should render speaking state', () => {
    render(<VoiceIndicator voiceState="speaking" />);
    
    const indicator = screen.getByText('OSmos is speaking...');
    expect(indicator).toBeInTheDocument();
    const container = indicator.parentElement;
    expect(container).toHaveClass('text-blue-600');
  });

  it('should render ready state', () => {
    render(<VoiceIndicator voiceState="ready" />);
    
    const indicator = screen.getByText('Voice ready');
    expect(indicator).toBeInTheDocument();
  });

  it('should render connecting state', () => {
    render(<VoiceIndicator voiceState="connecting" />);
    
    const indicator = screen.getByText('Connecting to voice service...');
    expect(indicator).toBeInTheDocument();
    const container = indicator.parentElement;
    expect(container).toHaveClass('text-gray-600');
  });

  it('should render error state', () => {
    render(<VoiceIndicator voiceState="error" />);
    
    const indicator = screen.getByText('Voice error - please try again');
    expect(indicator).toBeInTheDocument();
  });

  it('should render disconnected state', () => {
    render(<VoiceIndicator voiceState="disconnected" />);
    
    const indicator = screen.getByText('Voice disconnected');
    expect(indicator).toBeInTheDocument();
  });

  it('should not render when state is idle', () => {
    const { container } = render(<VoiceIndicator voiceState="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render reconnecting state', () => {
    render(<VoiceIndicator voiceState="reconnecting" />);
    
    const indicator = screen.getByText('Reconnecting...');
    expect(indicator).toBeInTheDocument();
    const container = indicator.parentElement;
    expect(container).toHaveClass('text-orange-600');
  });

  it('should have proper layout classes', () => {
    const { container } = render(<VoiceIndicator voiceState="ready" />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('bg-white');
    expect(wrapper).toHaveClass('rounded-lg');
    expect(wrapper).toHaveClass('shadow-sm');
    expect(wrapper).toHaveClass('border');
    expect(wrapper).toHaveClass('border-gray-200');
  });
  
  it('should show transcript when listening with transcript', () => {
    render(<VoiceIndicator voiceState="listening" transcript="Hello world" />);
    
    expect(screen.getByText('"Hello world"')).toBeInTheDocument();
  });
});