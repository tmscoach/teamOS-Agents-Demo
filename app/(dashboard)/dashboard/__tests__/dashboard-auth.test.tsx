import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import DashboardPage from '../page'
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper'
import { prisma } from '@/lib/db/prisma'

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/src/lib/auth/clerk-dev-wrapper', () => ({
  currentUser: jest.fn(),
}))

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
    },
  },
}))

describe('Dashboard Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should redirect to sign-in when no user is authenticated', async () => {
      ;(currentUser as jest.Mock).mockResolvedValue(null)

      await DashboardPage()

      expect(redirect).toHaveBeenCalledWith('/sign-in')
    })

    it('should load dashboard for authenticated Clerk user', async () => {
      const mockClerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
      }

      const mockDbUser = {
        id: 'db_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MANAGER',
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        onboardingData: {},
        team: null,
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockClerkUser)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

      const result = await DashboardPage()
      
      expect(redirect).not.toHaveBeenCalled()
      expect(result).toBeTruthy()
    })

    it('should load dashboard for dev auth user', async () => {
      const mockDevUser = {
        id: 'dev_user_test_example_com',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        fullName: 'test',
        firstName: 'test',
      }

      const mockDbUser = {
        id: 'db_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'MANAGER',
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        onboardingData: {},
        team: null,
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockDevUser)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

      const result = await DashboardPage()
      
      expect(redirect).not.toHaveBeenCalled()
      expect(result).toBeTruthy()
    })
  })

  describe('User Journey Routing', () => {
    it('should redirect admin users to admin dashboard', async () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'admin@example.com' }],
      }

      const mockAdminUser = {
        id: 'db_123',
        email: 'admin@example.com',
        role: 'ADMIN',
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser)

      await DashboardPage()

      expect(redirect).toHaveBeenCalledWith('/admin')
    })

    it('should redirect users in onboarding phase to chat', async () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'new@example.com' }],
      }

      const mockOnboardingUser = {
        id: 'db_123',
        email: 'new@example.com',
        role: 'MANAGER',
        journeyPhase: 'ONBOARDING',
        journeyStatus: 'ONBOARDING',
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOnboardingUser)
      ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null)

      await DashboardPage()

      expect(redirect).toHaveBeenCalledWith('/chat?agent=OnboardingAgent&new=true')
    })

    it('should show assessment phase for users who completed onboarding', async () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'manager@example.com' }],
      }

      const mockAssessmentUser = {
        id: 'db_123',
        email: 'manager@example.com',
        role: 'MANAGER',
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        onboardingData: { managerName: 'John', teamSize: 5 },
        team: { name: 'Engineering', members: [] },
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAssessmentUser)

      const result = await DashboardPage()
      
      expect(redirect).not.toHaveBeenCalled()
      expect(result).toBeTruthy()
    })
  })

  describe('Database Error Handling', () => {
    it('should redirect to sign-in when database user is not found', async () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'notfound@example.com' }],
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await DashboardPage()

      expect(redirect).toHaveBeenCalledWith('/sign-in')
    })

    it('should handle database connection errors gracefully', async () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'error@example.com' }],
      }

      ;(currentUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      await DashboardPage()

      expect(redirect).toHaveBeenCalledWith('/sign-in')
    })
  })
})