import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { currentUser } from '../clerk-dev-wrapper'
import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { getDevAuth } from '../dev-auth'

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
}))

jest.mock('../dev-auth', () => ({
  getDevAuth: jest.fn(),
  createMockUserFromDevAuth: jest.fn((devAuth) => ({
    id: devAuth.userId,
    emailAddresses: [{ emailAddress: devAuth.email }],
    fullName: devAuth.email.split('@')[0],
    firstName: devAuth.email.split('@')[0],
  })),
}))

describe('Clerk Dev Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset NODE_ENV
    process.env.NODE_ENV = 'test'
  })

  describe('currentUser function', () => {
    it('should return Clerk user when authenticated with Clerk', async () => {
      const mockClerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        fullName: 'Test User',
        firstName: 'Test',
      }

      ;(clerkCurrentUser as jest.Mock).mockResolvedValue(mockClerkUser)

      const result = await currentUser()

      expect(result).toEqual({
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        fullName: 'Test User',
        firstName: 'Test',
      })
      expect(getDevAuth).not.toHaveBeenCalled()
    })

    it('should return dev auth user in development when no Clerk user', async () => {
      process.env.NODE_ENV = 'development'
      
      const mockDevAuth = {
        sessionId: 'dev_session_123',
        userId: 'dev_user_test_example_com',
        email: 'test@example.com',
        timestamp: Date.now(),
      }

      ;(clerkCurrentUser as jest.Mock).mockResolvedValue(null)
      ;(getDevAuth as jest.Mock).mockResolvedValue(mockDevAuth)

      const result = await currentUser()

      expect(result).toEqual({
        id: 'dev_user_test_example_com',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        fullName: 'test',
        firstName: 'test',
      })
    })

    it('should return null when no authentication in production', async () => {
      process.env.NODE_ENV = 'production'

      ;(clerkCurrentUser as jest.Mock).mockResolvedValue(null)

      const result = await currentUser()

      expect(result).toBeNull()
      expect(getDevAuth).not.toHaveBeenCalled()
    })

    it('should return null when dev auth fails in development', async () => {
      process.env.NODE_ENV = 'development'

      ;(clerkCurrentUser as jest.Mock).mockResolvedValue(null)
      ;(getDevAuth as jest.Mock).mockResolvedValue(null)

      const result = await currentUser()

      expect(result).toBeNull()
    })

    it('should handle Clerk errors gracefully', async () => {
      ;(clerkCurrentUser as jest.Mock).mockRejectedValue(new Error('Clerk error'))
      ;(getDevAuth as jest.Mock).mockResolvedValue(null)

      const result = await currentUser()

      expect(result).toBeNull()
    })

    it('should map Clerk user fields correctly', async () => {
      const mockClerkUser = {
        id: 'clerk_456',
        emailAddresses: [
          { emailAddress: 'primary@example.com' },
          { emailAddress: 'secondary@example.com' },
        ],
        fullName: null,
        firstName: 'John',
      }

      ;(clerkCurrentUser as jest.Mock).mockResolvedValue(mockClerkUser)

      const result = await currentUser()

      expect(result).toEqual({
        id: 'clerk_456',
        emailAddresses: [
          { emailAddress: 'primary@example.com' },
          { emailAddress: 'secondary@example.com' },
        ],
        fullName: undefined,
        firstName: 'John',
      })
    })
  })
})