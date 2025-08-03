import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AskOsmoWidget } from '../AskOsmoWidget';
import { AskOsmoProvider } from '@/contexts/AskOsmoContext';

// Mock the ChatOverlay component
jest.mock('../ChatOverlay', () => ({
  ChatOverlay: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="chat-overlay">
        <button onClick={onClose}>Close</button>
        Chat Overlay Content
      </div>
    ) : null
  )
}));

describe('AskOsmoWidget', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <AskOsmoProvider>
        {component}
      </AskOsmoProvider>
    );
  };

  it('renders the floating chat button', () => {
    renderWithProvider(<AskOsmoWidget />);
    
    const button = screen.getByRole('button', { name: /open ask osmo/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6');
  });

  it('shows the message icon by default', () => {
    renderWithProvider(<AskOsmoWidget />);
    
    // Check for the SVG element with message circle path
    const svgPath = screen.getByRole('img', { hidden: true });
    expect(svgPath).toBeInTheDocument();
  });

  it('opens chat overlay when clicked', async () => {
    renderWithProvider(<AskOsmoWidget />);
    
    const button = screen.getByRole('button', { name: /open ask osmo/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-overlay')).toBeInTheDocument();
    });
  });

  it('changes button label when chat is open', async () => {
    renderWithProvider(<AskOsmoWidget />);
    
    const button = screen.getByRole('button', { name: /open ask osmo/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close ask osmo/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('closes chat overlay when clicking the button again', async () => {
    renderWithProvider(<AskOsmoWidget />);
    
    const button = screen.getByRole('button', { name: /open ask osmo/i });
    
    // Open
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('chat-overlay')).toBeInTheDocument();
    });
    
    // Close - button label changes
    const closeButton = screen.getByRole('button', { name: /close ask osmo/i });
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByTestId('chat-overlay')).not.toBeInTheDocument();
    });
  });

  it('closes chat overlay when clicking close button in overlay', async () => {
    renderWithProvider(<AskOsmoWidget />);
    
    const button = screen.getByRole('button', { name: /open ask osmo/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-overlay')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('chat-overlay')).not.toBeInTheDocument();
    });
  });

  it('has smooth transitions', () => {
    renderWithProvider(<AskOsmoWidget />);
    
    const button = screen.getByRole('button', { name: /open ask osmo/i });
    expect(button).toHaveClass('transition-all', 'duration-200');
  });

  it('shows tooltip element', async () => {
    renderWithProvider(<AskOsmoWidget />);
    
    // Check for the tooltip div that appears on hover
    const tooltip = screen.getByText('Ask Osmo anything');
    expect(tooltip).toBeInTheDocument();
  });
});