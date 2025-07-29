import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SuggestedActions from '../SuggestedActions';

describe('SuggestedActions', () => {
  const mockOnActionClick = jest.fn();
  
  const defaultActions = [
    {
      id: 'osmos-help',
      label: 'What can Osmos do for me?',
      question: 'What can Osmos do for me?'
    },
    {
      id: 'highlights',
      label: '3 highlights about me',
      question: 'What are my top 3 strengths and highlights from my profile?'
    },
    {
      id: 'support',
      label: 'Areas I need support with',
      question: 'What areas should I focus on for development based on my profile?'
    }
  ];

  beforeEach(() => {
    mockOnActionClick.mockClear();
  });

  it('renders all action buttons', () => {
    render(
      <SuggestedActions 
        actions={defaultActions} 
        onActionClick={mockOnActionClick} 
      />
    );
    
    defaultActions.forEach(action => {
      expect(screen.getByText(action.label)).toBeInTheDocument();
    });
  });

  it('calls onActionClick with the correct question when clicked', () => {
    render(
      <SuggestedActions 
        actions={defaultActions} 
        onActionClick={mockOnActionClick} 
      />
    );
    
    const firstButton = screen.getByText(defaultActions[0].label);
    fireEvent.click(firstButton);
    
    expect(mockOnActionClick).toHaveBeenCalledTimes(1);
    expect(mockOnActionClick).toHaveBeenCalledWith(defaultActions[0].question);
  });

  it('renders ChevronRight icon for each action', () => {
    const { container } = render(
      <SuggestedActions 
        actions={defaultActions} 
        onActionClick={mockOnActionClick} 
      />
    );
    
    const chevrons = container.querySelectorAll('svg');
    expect(chevrons).toHaveLength(defaultActions.length);
  });

  it('shows "Show more suggestions" when showMore is true', () => {
    render(
      <SuggestedActions 
        actions={defaultActions} 
        onActionClick={mockOnActionClick} 
        showMore={true}
      />
    );
    
    expect(screen.getByText('Show more suggestions')).toBeInTheDocument();
  });

  it('hides "Show more suggestions" when showMore is false', () => {
    render(
      <SuggestedActions 
        actions={defaultActions} 
        onActionClick={mockOnActionClick} 
        showMore={false}
      />
    );
    
    expect(screen.queryByText('Show more suggestions')).not.toBeInTheDocument();
  });

  it('applies hover styles correctly', () => {
    const { container } = render(
      <SuggestedActions 
        actions={[defaultActions[0]]} 
        onActionClick={mockOnActionClick} 
      />
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('hover:bg-white/80');
    expect(button).toHaveClass('hover:shadow-sm');
  });

  it('renders empty when no actions provided', () => {
    const { container } = render(
      <SuggestedActions 
        actions={[]} 
        onActionClick={mockOnActionClick} 
      />
    );
    
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(0);
  });
});