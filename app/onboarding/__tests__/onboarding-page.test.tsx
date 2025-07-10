import { describe, it, expect, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import OnboardingPage from '../page'

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  UserButton: jest.fn(() => <div data-testid="user-button">UserButton</div>)
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

describe('Onboarding Page', () => {
  const mockPush = jest.fn()
  const mockUser = {
    id: 'user_123',
    firstName: 'Test',
    emailAddresses: [{ emailAddress: 'test@bythelight.band' }]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useRouter).mockReturnValue({ push: mockPush } as any)
    jest.mocked(useUser).mockReturnValue({ 
      user: mockUser, 
      isLoaded: true 
    } as any)
  })

  describe('UI Elements', () => {
    it('should display welcome message with user name', () => {
      render(<OnboardingPage />)
      
      expect(screen.getByText(/Welcome to TeamOS, Test!/)).toBeInTheDocument()
    })

    it('should display UserButton for logout', () => {
      render(<OnboardingPage />)
      
      expect(screen.getByTestId('user-button')).toBeInTheDocument()
    })

    it('should show onboarding progress', () => {
      render(<OnboardingPage />)
      
      expect(screen.getByText('Your Onboarding Progress')).toBeInTheDocument()
      expect(screen.getByText('Complete these steps to unlock the full power of TeamOS')).toBeInTheDocument()
    })

    it('should display all 5 onboarding steps', () => {
      render(<OnboardingPage />)
      
      const steps = [
        'Welcome & Introduction',
        'Team Context',
        'Goals Setting',
        'Initial Assessment',
        'Transformation Plan'
      ]
      
      steps.forEach(step => {
        expect(screen.getByText(step)).toBeInTheDocument()
      })
    })
  })

  describe('Journey API Integration', () => {
    it('should fetch journey data on mount', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ONBOARDING',
          currentAgent: null,
          completedSteps: [],
          nextStep: {
            id: 'welcome',
            name: 'Welcome & Introduction',
            description: 'Introduction to TeamOS',
            agent: 'onboarding'
          }
        })
      })
      global.fetch = mockFetch

      render(<OnboardingPage />)

      expect(mockFetch).toHaveBeenCalledWith('/api/journey')
    })

    it('should show current step indicator', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'ONBOARDING',
          completedSteps: ['welcome'],
          nextStep: {
            id: 'team_context',
            name: 'Team Context'
          }
        })
      })
      global.fetch = mockFetch

      render(<OnboardingPage />)
      
      // Wait for data to load
      await screen.findByText('Current Step')
    })
  })

  describe('Continue Onboarding Flow', () => {
    it('should have continue onboarding button', () => {
      render(<OnboardingPage />)
      
      expect(screen.getByText('Continue Onboarding')).toBeInTheDocument()
    })

    it('should navigate to chat with agent context', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          nextStep: {
            id: 'welcome',
            agent: 'onboarding'
          }
        })
      })
      global.fetch = mockFetch

      render(<OnboardingPage />)
      
      const continueButton = screen.getByText('Continue Onboarding')
      fireEvent.click(continueButton)
      
      // Should navigate to chat with agent and step params
      expect(mockPush).toHaveBeenCalledWith('/chat?agent=onboarding&step=welcome')
    })

    it('should disable continue button if no next step', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          nextStep: null,
          completedSteps: ['welcome', 'team_context', 'goals_setting', 'initial_assessment', 'transformation_plan']
        })
      })
      global.fetch = mockFetch

      render(<OnboardingPage />)
      
      const continueButton = await screen.findByText('Continue Onboarding')
      expect(continueButton).toBeDisabled()
    })
  })

  describe('Progress Visualization', () => {
    it('should show progress bar', () => {
      render(<OnboardingPage />)
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should calculate progress percentage correctly', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          completedSteps: ['welcome', 'team_context'] // 2 of 5 steps = 40%
        })
      })
      global.fetch = mockFetch

      render(<OnboardingPage />)
      
      const progressBar = await screen.findByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '40')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'))
      global.fetch = mockFetch

      render(<OnboardingPage />)
      
      // Should still render the page
      expect(screen.getByText(/Welcome to TeamOS/)).toBeInTheDocument()
    })

    it('should redirect to sign-in if not authenticated', () => {
      jest.mocked(useUser).mockReturnValue({ 
        user: null, 
        isLoaded: true 
      } as any)

      render(<OnboardingPage />)
      
      expect(mockPush).toHaveBeenCalledWith('/sign-in')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive classes for mobile and desktop', () => {
      render(<OnboardingPage />)
      
      // Check for responsive padding classes
      const container = screen.getByText(/Welcome to TeamOS/).closest('div')
      expect(container?.className).toContain('px-4')
      expect(container?.className).toContain('max-w-4xl')
    })
  })
})