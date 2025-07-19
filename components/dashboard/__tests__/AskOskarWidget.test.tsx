import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AskOskarWidget } from '../AskOskarWidget';
import { AskOskarProvider } from '@/contexts/AskOskarContext';

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

describe('AskOskarWidget', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <AskOskarProvider>
        {component}
      </AskOskarProvider>
    );
  };

  it('renders the floating chat button', () => {
    renderWithProvider(<AskOskarWidget />);
    
    const button = screen.getByRole('button', { name: /open ask oskar/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6');
  });

  it('shows the message icon by default', () => {
    renderWithProvider(<AskOskarWidget />);
    
    // Check for the SVG element with message circle path
    const svgPath = screen.getByRole('img', { hidden: true });
    expect(svgPath).toBeInTheDocument();
  });

  it('opens chat overlay when clicked', async () => {
    renderWithProvider(<AskOskarWidget />);
    
    const button = screen.getByRole('button', { name: /open ask oskar/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-overlay')).toBeInTheDocument();
    });
  });

  it('changes button label when chat is open', async () => {
    renderWithProvider(<AskOskarWidget />);
    
    const button = screen.getByRole('button', { name: /open ask oskar/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close ask oskar/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('closes chat overlay when clicking the button again', async () => {
    renderWithProvider(<AskOskarWidget />);
    
    const button = screen.getByRole('button', { name: /open ask oskar/i });
    
    // Open
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('chat-overlay')).toBeInTheDocument();
    });
    
    // Close - button label changes
    const closeButton = screen.getByRole('button', { name: /close ask oskar/i });
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByTestId('chat-overlay')).not.toBeInTheDocument();
    });
  });

  it('closes chat overlay when clicking close button in overlay', async () => {
    renderWithProvider(<AskOskarWidget />);
    
    const button = screen.getByRole('button', { name: /open ask oskar/i });
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
    renderWithProvider(<AskOskarWidget />);
    
    const button = screen.getByRole('button', { name: /open ask oskar/i });
    expect(button).toHaveClass('transition-all', 'duration-200');
  });

  it('shows tooltip element', async () => {
    renderWithProvider(<AskOskarWidget />);
    
    // Check for the tooltip div that appears on hover
    const tooltip = screen.getByText('Ask Oskar anything');
    expect(tooltip).toBeInTheDocument();
  });
});