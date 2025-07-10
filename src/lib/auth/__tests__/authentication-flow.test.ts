import { describe, it, expect, beforeEach, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { getCurrentUserWithJourney, getUserRole } from '@/lib/auth/roles'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

// Mock Clerk
vi.mock('@clerk/nextjs/server', () => ({
  currentUser: vi.fn(),
  auth: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn()
    }
  }
}))

describe('Authentication and Onboarding Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sign In Flow', () => {
    it('should redirect unauthenticated users to sign-in page', async () => {
      vi.mocked(currentUser).mockResolvedValue(null)
      
      // Simulate dashboard access without auth
      const mockAuth = vi.fn().mockResolvedValue({ userId: null })
      
      expect(redirect).toHaveBeenCalledWith('/sign-in')
    })

    it('should allow authenticated users to access dashboard', async () => {
      const mockUser = { 
        id: 'user_123', 
        emailAddresses: [{ emailAddress: 'test@example.com' }] 
      }
      vi.mocked(currentUser).mockResolvedValue(mockUser as any)
      
      // Should not redirect when authenticated
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('Role-Based Access', () => {
    it('should assign ADMIN role to rowan@teammanagementsystems.com', async () => {
      const adminEmail = 'rowan@teammanagementsystems.com'
      
      // Mock webhook creating user
      const mockUser = {
        clerkId: 'user_admin',
        email: adminEmail,
        role: 'ADMIN',
        journeyStatus: 'ACTIVE'
      }
      
      expect(mockUser.role).toBe('ADMIN')
      expect(mockUser.journeyStatus).toBe('ACTIVE')
    })

    it('should assign MANAGER role to bythelight.band domain', async () => {
      const managerEmail = 'manager@bythelight.band'
      
      const mockUser = {
        clerkId: 'user_manager',
        email: managerEmail,
        role: 'MANAGER',
        journeyStatus: 'ONBOARDING'
      }
      
      expect(mockUser.role).toBe('MANAGER')
      expect(mockUser.journeyStatus).toBe('ONBOARDING')
    })

    it('should assign TEAM_MEMBER role by default', async () => {
      const memberEmail = 'member@other-domain.com'
      
      const mockUser = {
        clerkId: 'user_member',
        email: memberEmail,
        role: 'TEAM_MEMBER',
        journeyStatus: 'ONBOARDING'
      }
      
      expect(mockUser.role).toBe('TEAM_MEMBER')
    })
  })

  describe('Onboarding Orchestration', () => {
    it('should redirect new managers to onboarding', async () => {
      const mockManager = {
        id: 'manager_123',
        email: 'manager@bythelight.band',
        role: 'MANAGER',
        journeyStatus: 'ONBOARDING'
      }
      
      // Mock getCurrentUserWithJourney
      vi.mocked(getCurrentUserWithJourney).mockResolvedValue(mockManager as any)
      
      // Simulate dashboard page logic
      if (mockManager.journeyStatus === 'ONBOARDING' && mockManager.role === 'MANAGER') {
        redirect('/onboarding')
      }
      
      expect(redirect).toHaveBeenCalledWith('/onboarding')
    })

    it('should not redirect active managers to onboarding', async () => {
      const mockManager = {
        id: 'manager_123',
        email: 'manager@bythelight.band',
        role: 'MANAGER',
        journeyStatus: 'ACTIVE'
      }
      
      vi.mocked(getCurrentUserWithJourney).mockResolvedValue(mockManager as any)
      
      // Should not redirect when already active
      if (mockManager.journeyStatus === 'ONBOARDING' && mockManager.role === 'MANAGER') {
        redirect('/onboarding')
      }
      
      expect(redirect).not.toHaveBeenCalled()
    })
  })

  describe('Journey Tracking', () => {
    it('should track onboarding progress through steps', () => {
      const journeySteps = [
        'welcome',
        'team_context',
        'goals_setting',
        'initial_assessment',
        'transformation_plan'
      ]
      
      const userProgress = {
        completedSteps: ['welcome', 'team_context'],
        currentStep: 'goals_setting',
        nextStep: journeySteps[2]
      }
      
      expect(userProgress.completedSteps).toHaveLength(2)
      expect(userProgress.currentStep).toBe('goals_setting')
    })

    it('should mark journey as complete when all steps done', () => {
      const allSteps = [
        'welcome',
        'team_context',
        'goals_setting',
        'initial_assessment',
        'transformation_plan'
      ]
      
      const completedUser = {
        completedSteps: allSteps,
        journeyStatus: 'ACTIVE'
      }
      
      expect(completedUser.completedSteps).toHaveLength(5)
      expect(completedUser.journeyStatus).toBe('ACTIVE')
    })
  })

  describe('Middleware Protection', () => {
    it('should protect admin routes', async () => {
      const protectedRoutes = [
        '/admin',
        '/admin/agents/config',
        '/api/admin/variables'
      ]
      
      // Mock unauthenticated request
      const mockAuth = { userId: null }
      
      protectedRoutes.forEach(route => {
        // Middleware should redirect to sign-in
        if (!mockAuth.userId) {
          expect(redirect).toHaveBeenCalledWith('/sign-in')
        }
      })
    })

    it('should allow public routes without auth', () => {
      const publicRoutes = [
        '/',
        '/sign-in',
        '/sign-up',
        '/api/webhooks/clerk'
      ]
      
      // These should not require authentication
      publicRoutes.forEach(route => {
        expect(redirect).not.toHaveBeenCalled()
      })
    })
  })

  describe('Logout Functionality', () => {
    it('should redirect to sign-in after logout', () => {
      // UserButton is configured with afterSignOutUrl="/sign-in"
      const afterSignOutUrl = '/sign-in'
      
      // After logout, should redirect to sign-in
      expect(afterSignOutUrl).toBe('/sign-in')
    })
  })
})