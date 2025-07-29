import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileSummary from '../ProfileSummary';

describe('ProfileSummary', () => {
  const defaultProps = {
    title: 'Your Profile',
    role: 'Upholder-Maintainer',
    bullets: [
      'You are usually quietly confident and persevering in the team\'s interests.',
      'You tend to be strong on ideas and innovation.',
      'You may prefer a co-ordinating, advisory role.'
    ]
  };

  it('renders the role correctly', () => {
    render(<ProfileSummary {...defaultProps} />);
    expect(screen.getByText('Upholder-Maintainer')).toBeInTheDocument();
  });

  it('renders all bullet points', () => {
    render(<ProfileSummary {...defaultProps} />);
    defaultProps.bullets.forEach(bullet => {
      expect(screen.getByText(bullet)).toBeInTheDocument();
    });
  });

  it('displays user initial when userName is provided', () => {
    render(<ProfileSummary {...defaultProps} userName="Test User" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('displays default initial when userName is not provided', () => {
    render(<ProfileSummary {...defaultProps} />);
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('limits bullets to 3 items', () => {
    const manyBullets = [
      'Bullet 1',
      'Bullet 2',
      'Bullet 3',
      'Bullet 4',
      'Bullet 5'
    ];
    render(<ProfileSummary {...defaultProps} bullets={manyBullets} />);
    
    const bulletElements = screen.getAllByText(/Bullet \d/);
    expect(bulletElements).toHaveLength(3);
    expect(screen.getByText('Bullet 1')).toBeInTheDocument();
    expect(screen.getByText('Bullet 2')).toBeInTheDocument();
    expect(screen.getByText('Bullet 3')).toBeInTheDocument();
    expect(screen.queryByText('Bullet 4')).not.toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<ProfileSummary {...defaultProps} />);
    
    // Check for main container classes
    expect(container.querySelector('.bg-white\\/80')).toBeInTheDocument();
    expect(container.querySelector('.backdrop-blur-sm')).toBeInTheDocument();
    
    // Check for avatar gradient
    expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
  });
});