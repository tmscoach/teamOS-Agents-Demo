import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

// Mock Svix
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn()
  }))
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: vi.fn()
    }
  }
}))

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((key: string) => {
      const mockHeaders: Record<string, string> = {
        'svix-id': 'test-id',
        'svix-timestamp': 'test-timestamp',
        'svix-signature': 'test-signature'
      }
      return mockHeaders[key]
    })
  }))
}))

describe('Clerk Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLERK_WEBHOOK_SECRET = 'test-secret'
  })

  describe('Webhook Validation', () => {
    it('should reject requests without svix headers', async () => {
      const mockHeaders = vi.fn(() => ({
        get: vi.fn(() => null)
      }))
      vi.mocked(require('next/headers').headers).mockImplementation(mockHeaders)

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      expect(await response.text()).toContain('no svix headers')
    })

    it('should verify webhook signature', async () => {
      const mockVerify = vi.fn().mockReturnValue({
        type: 'user.created',
        data: { id: 'user_123' }
      })
      
      vi.mocked(Webhook).mockImplementation(() => ({
        verify: mockVerify
      } as any))

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({ type: 'user.created' })
      })

      await POST(request)
      
      expect(mockVerify).toHaveBeenCalled()
    })
  })

  describe('User Creation', () => {
    it('should create admin user for rowan@teammanagementsystems.com', async () => {
      const adminPayload = {
        type: 'user.created',
        data: {
          id: 'user_admin',
          email_addresses: [{ email_address: 'rowan@teammanagementsystems.com' }],
          first_name: 'Rowan',
          last_name: 'McCann'
        }
      }

      vi.mocked(Webhook).mockImplementation(() => ({
        verify: vi.fn().mockReturnValue(adminPayload)
      } as any))

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(adminPayload)
      })

      await POST(request)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: 'user_admin' },
        update: expect.any(Object),
        create: expect.objectContaining({
          clerkId: 'user_admin',
          email: 'rowan@teammanagementsystems.com',
          role: 'ADMIN',
          journeyStatus: 'ACTIVE'
        })
      })
    })

    it('should create manager user for bythelight.band domain', async () => {
      const managerPayload = {
        type: 'user.created',
        data: {
          id: 'user_manager',
          email_addresses: [{ email_address: 'manager@bythelight.band' }],
          first_name: 'Test',
          last_name: 'Manager'
        }
      }

      vi.mocked(Webhook).mockImplementation(() => ({
        verify: vi.fn().mockReturnValue(managerPayload)
      } as any))

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(managerPayload)
      })

      await POST(request)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: 'user_manager' },
        update: expect.any(Object),
        create: expect.objectContaining({
          role: 'MANAGER',
          journeyStatus: 'ONBOARDING'
        })
      })
    })

    it('should handle missing email gracefully', async () => {
      const invalidPayload = {
        type: 'user.created',
        data: {
          id: 'user_no_email',
          email_addresses: []
        }
      }

      vi.mocked(Webhook).mockImplementation(() => ({
        verify: vi.fn().mockReturnValue(invalidPayload)
      } as any))

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(invalidPayload)
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      expect(await response.text()).toContain('No email found')
    })
  })

  describe('User Updates', () => {
    it('should update existing user on user.updated event', async () => {
      const updatePayload = {
        type: 'user.updated',
        data: {
          id: 'user_existing',
          email_addresses: [{ email_address: 'updated@example.com' }],
          first_name: 'Updated',
          last_name: 'User',
          image_url: 'https://example.com/avatar.jpg'
        }
      }

      vi.mocked(Webhook).mockImplementation(() => ({
        verify: vi.fn().mockReturnValue(updatePayload)
      } as any))

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(updatePayload)
      })

      await POST(request)

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { clerkId: 'user_existing' },
        update: expect.objectContaining({
          email: 'updated@example.com',
          name: 'Updated User',
          imageUrl: 'https://example.com/avatar.jpg'
        }),
        create: expect.any(Object)
      })
    })
  })

  describe('User Deletion', () => {
    it('should soft delete user on user.deleted event', async () => {
      const deletePayload = {
        type: 'user.deleted',
        data: {
          id: 'user_to_delete'
        }
      }

      vi.mocked(Webhook).mockImplementation(() => ({
        verify: vi.fn().mockReturnValue(deletePayload)
      } as any))

      vi.mocked(prisma.user).update = vi.fn()

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(deletePayload)
      })

      await POST(request)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { clerkId: 'user_to_delete' },
        data: {
          deletedAt: expect.any(Date)
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      vi.mocked(prisma.user.upsert).mockRejectedValue(new Error('Database error'))

      const payload = {
        type: 'user.created',
        data: {
          id: 'user_error',
          email_addresses: [{ email_address: 'error@example.com' }]
        }
      }

      vi.mocked(Webhook).mockImplementation(() => ({
        verify: vi.fn().mockReturnValue(payload)
      } as any))

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      expect(await response.text()).toContain('Database error')
    })
  })
})