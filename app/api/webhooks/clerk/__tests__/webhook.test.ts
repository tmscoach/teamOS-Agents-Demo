import { describe, it, expect, beforeEach } from '@jest/globals'
import { POST } from '../route'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

// Mock Svix
jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest.fn()
  }))
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: jest.fn()
    }
  }
}))

// Mock headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key: string) => {
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
    jest.clearAllMocks()
    process.env.CLERK_WEBHOOK_SECRET = 'test-secret'
  })

  describe('Webhook Validation', () => {
    it('should reject requests without svix headers', async () => {
      const mockHeaders = jest.fn(() => ({
        get: jest.fn(() => null)
      }))
      const { headers } = await import('next/headers');
      jest.mocked(headers).mockImplementation(mockHeaders)

      const request = new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      expect(await response.text()).toContain('no svix headers')
    })

    it('should verify webhook signature', async () => {
      const mockVerify = jest.fn().mockReturnValue({
        type: 'user.created',
        data: { id: 'user_123' }
      })
      
      jest.mocked(Webhook).mockImplementation(() => ({
        verify: mockVerify
      } as unknown as Webhook))

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

      jest.mocked(Webhook).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue(adminPayload)
      } as unknown as Webhook))

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

      jest.mocked(Webhook).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue(managerPayload)
      } as unknown as Webhook))

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

      jest.mocked(Webhook).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue(invalidPayload)
      } as unknown as Webhook))

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

      jest.mocked(Webhook).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue(updatePayload)
      } as unknown as Webhook))

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

      jest.mocked(Webhook).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue(deletePayload)
      } as unknown as Webhook))

      jest.mocked(prisma.user).update = jest.fn()

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
      jest.mocked(prisma.user.upsert).mockRejectedValue(new Error('Database error'))

      const payload = {
        type: 'user.created',
        data: {
          id: 'user_error',
          email_addresses: [{ email_address: 'error@example.com' }]
        }
      }

      jest.mocked(Webhook).mockImplementation(() => ({
        verify: jest.fn().mockReturnValue(payload)
      } as unknown as Webhook))

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