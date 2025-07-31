import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranscriptDisplay } from '../TranscriptDisplay';
import '@testing-library/jest-dom';

describe('TranscriptDisplay', () => {
  it('should render empty state when no transcripts', () => {
    const { container } = render(<TranscriptDisplay transcripts={[]} />);
    const transcriptsContainer = container.querySelector('.space-y-2');
    expect(transcriptsContainer).toBeInTheDocument();
    expect(transcriptsContainer?.children).toHaveLength(0);
  });

  it('should render user transcript', () => {
    const transcripts = [
      { id: '1', type: 'user' as const, text: 'Hello, this is a test', timestamp: Date.now() }
    ];
    
    render(<TranscriptDisplay transcripts={transcripts} />);
    
    const transcript = screen.getByText('Hello, this is a test');
    expect(transcript).toBeInTheDocument();
    expect(transcript.parentElement).toHaveClass('bg-blue-50');
    expect(transcript.parentElement).toHaveClass('text-blue-900');
  });

  it('should render assistant transcript', () => {
    const transcripts = [
      { id: '1', type: 'assistant' as const, text: 'Hello! How can I help?', timestamp: Date.now() }
    ];
    
    render(<TranscriptDisplay transcripts={transcripts} />);
    
    const transcript = screen.getByText('Hello! How can I help?');
    expect(transcript).toBeInTheDocument();
    expect(transcript.parentElement).toHaveClass('bg-gray-50');
    expect(transcript.parentElement).toHaveClass('text-gray-900');
  });

  it('should render multiple transcripts in order', () => {
    const transcripts = [
      { id: '1', type: 'user' as const, text: 'First message', timestamp: Date.now() - 2000 },
      { id: '2', type: 'assistant' as const, text: 'Second message', timestamp: Date.now() - 1000 },
      { id: '3', type: 'user' as const, text: 'Third message', timestamp: Date.now() }
    ];
    
    render(<TranscriptDisplay transcripts={transcripts} />);
    
    const messages = screen.getAllByText(/message/i);
    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveTextContent('First message');
    expect(messages[1]).toHaveTextContent('Second message');
    expect(messages[2]).toHaveTextContent('Third message');
  });

  it('should show only last 10 transcripts', () => {
    const transcripts = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      type: 'user' as const,
      text: `Message ${i}`,
      timestamp: Date.now() - (15 - i) * 1000
    }));
    
    render(<TranscriptDisplay transcripts={transcripts} />);
    
    const messages = screen.getAllByText(/Message/i);
    expect(messages).toHaveLength(10);
    expect(messages[0]).toHaveTextContent('Message 5');
    expect(messages[9]).toHaveTextContent('Message 14');
  });

  it('should have proper layout classes', () => {
    const transcripts = [
      { id: '1', type: 'user' as const, text: 'Test', timestamp: Date.now() }
    ];
    
    const { container } = render(<TranscriptDisplay transcripts={transcripts} />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('fixed');
    expect(wrapper).toHaveClass('bottom-20');
    expect(wrapper).toHaveClass('right-4');
    expect(wrapper).toHaveClass('z-40');
  });

  it('should style transcripts with appropriate spacing and padding', () => {
    const transcripts = [
      { id: '1', type: 'user' as const, text: 'Test', timestamp: Date.now() }
    ];
    
    render(<TranscriptDisplay transcripts={transcripts} />);
    
    const transcript = screen.getByText('Test').parentElement;
    expect(transcript).toHaveClass('px-3');
    expect(transcript).toHaveClass('py-2');
    expect(transcript).toHaveClass('rounded-lg');
    expect(transcript).toHaveClass('text-sm');
  });

  it('should handle empty text gracefully', () => {
    const transcripts = [
      { id: '1', type: 'user' as const, text: '', timestamp: Date.now() }
    ];
    
    const { container } = render(<TranscriptDisplay transcripts={transcripts} />);
    const transcriptElement = container.querySelector('.px-3.py-2');
    expect(transcriptElement).toBeInTheDocument();
    expect(transcriptElement).toHaveTextContent('');
  });
});