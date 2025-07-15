import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuggestedValues from '../SuggestedValues';

describe('SuggestedValues Component', () => {
  const defaultProps = {
    field: 'primary_challenge',
    values: [
      'Communication issues',
      'Low team morale',
      'Unclear goals',
      'Performance concerns'
    ],
    onSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all suggested values', () => {
    render(<SuggestedValues {...defaultProps} />);

    defaultProps.values.forEach(value => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  });

  it('should display help text when provided', () => {
    const helpText = 'Choose the challenge that best describes your situation';
    render(<SuggestedValues {...defaultProps} helpText={helpText} />);

    expect(screen.getByText(helpText)).toBeInTheDocument();
    // Check for the lightbulb emoji
    expect(screen.getByText('💡')).toBeInTheDocument();
  });

  it('should not display help text section when not provided', () => {
    render(<SuggestedValues {...defaultProps} />);

    expect(screen.queryByText('💡')).not.toBeInTheDocument();
  });

  it('should call onSelect when a value is clicked', () => {
    render(<SuggestedValues {...defaultProps} />);

    const firstOption = screen.getByText('Communication issues');
    fireEvent.click(firstOption);

    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).toHaveBeenCalledWith('Communication issues');
  });

  it('should apply hover styles on mouse over', () => {
    render(<SuggestedValues {...defaultProps} />);

    const button = screen.getByText('Low team morale').closest('button');
    expect(button).toHaveClass('hover:bg-gray-50');
  });

  it('should display the hint about typing custom responses', () => {
    render(<SuggestedValues {...defaultProps} />);

    expect(screen.getByText('💭 You can also type your own response if none of these fit')).toBeInTheDocument();
  });

  it('should render with proper styling classes', () => {
    const { container } = render(<SuggestedValues {...defaultProps} />);

    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('mt-4', 'border-t', 'border-gray-200', 'pt-4');
  });

  it('should handle empty values array gracefully', () => {
    render(<SuggestedValues {...defaultProps} values={[]} />);

    expect(screen.getByText('💭 You can also type your own response if none of these fit')).toBeInTheDocument();
  });

  it('should use unique keys for each option', () => {
    const { container } = render(<SuggestedValues {...defaultProps} />);
    
    const buttons = container.querySelectorAll('button');
    const keys = new Set();
    
    buttons.forEach((button, index) => {
      const key = `${defaultProps.field}-${index}-${defaultProps.values[index]}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    });
  });

  it('should display Plus icon for each option', () => {
    render(<SuggestedValues {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(defaultProps.values.length);
    
    // Check that Plus icons are rendered (via Lucide Plus component)
    const plusIcons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')
    );
    expect(plusIcons).toHaveLength(defaultProps.values.length);
  });

  it('should handle very long suggested values', () => {
    const longValues = [
      'This is a very long suggested value that might wrap to multiple lines and should still display correctly in the UI'
    ];
    
    render(<SuggestedValues {...defaultProps} values={longValues} />);
    
    expect(screen.getByText(longValues[0])).toBeInTheDocument();
  });

  it('should handle special characters in values', () => {
    const specialValues = [
      'Communication & collaboration',
      'Goals/priorities unclear',
      '50% productivity loss',
      '"Team morale" issues'
    ];
    
    render(<SuggestedValues {...defaultProps} values={specialValues} />);
    
    specialValues.forEach(value => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  });
});