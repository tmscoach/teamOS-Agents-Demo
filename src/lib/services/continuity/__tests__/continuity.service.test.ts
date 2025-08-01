import { ContinuityService } from '../continuity.service'
import { PrismaClient } from '@/lib/generated/prisma'
import { JourneyPhase } from '@/lib/orchestrator/journey-phases'

// Mock Prisma
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }))
}))

describe('ContinuityService', () => {
  let service: ContinuityService
  let mockPrisma: any
  
  const mockUser = {
    id: 'user-123',
    lastActivity: new Date(),
    journeyPhase: JourneyPhase.ASSESSMENT,
    currentAgent: 'OrchestratorAgent',
    onboardingData: {},
    completedAssessments: {},
    conversations: [
      {
        id: 'conv-123',
        metadata: { test: true },
        context: { phase: JourneyPhase.ASSESSMENT }
      }
    ]
  }
  
  beforeEach(() => {
    service = new ContinuityService()
    mockPrisma = (service as any).prisma
    
    // Clear cache before each test
    service.clearCache()
    
    // Reset all mocks
    jest.clearAllMocks()
  })
  
  describe('caching functionality', () => {
    it('should cache user data on first fetch', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // First call - should hit database
      const result1 = await service.checkContinuity('user-123')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
      expect(result1).toBeTruthy()
      
      // Check cache stats
      const stats = service.getCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('user-123')
    })
    
    it('should return cached data on subsequent calls within TTL', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // First call - should hit database
      await service.checkContinuity('user-123')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
      
      // Second call - should use cache
      const result2 = await service.checkContinuity('user-123')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1) // Still 1
      expect(result2).toBeTruthy()
      expect(result2?.userId).toBe('user-123')
    })
    
    it('should invalidate cache after TTL expires', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      
      // First call
      await service.checkContinuity('user-123')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
      
      // Mock time passing beyond TTL
      const originalDateNow = Date.now
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000) // 6 minutes later
      
      // Second call - should hit database again
      await service.checkContinuity('user-123')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2)
      
      // Restore Date.now
      Date.now = originalDateNow
    })
    
    it('should clear cache when user is not found', async () => {
      // First add to cache
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      await service.checkContinuity('user-123')
      expect(service.getCacheStats().size).toBe(1)
      
      // Then return null user
      mockPrisma.user.findUnique.mockResolvedValue(null)
      
      // Force cache expiry
      const originalDateNow = Date.now
      Date.now = jest.fn(() => originalDateNow() + 6 * 60 * 1000)
      
      const result = await service.checkContinuity('user-123')
      expect(result).toBeNull()
      expect(service.getCacheStats().size).toBe(0)
      
      Date.now = originalDateNow
    })
    
    it('should invalidate cache when updating activity', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, lastActivity: new Date() })
      
      // First call - cache the data
      await service.checkContinuity('user-123')
      expect(service.getCacheStats().size).toBe(1)
      
      // Update activity - should clear cache
      await service.updateActivity('user-123', 'AssessmentAgent')
      expect(service.getCacheStats().size).toBe(0)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          lastActivity: expect.any(Date),
          currentAgent: 'AssessmentAgent'
        }
      })
    })
    
    it('should clear cache when clearContinuity is called', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.user.update.mockResolvedValue({ ...mockUser })
      
      // First cache some data
      await service.checkContinuity('user-123')
      expect(service.getCacheStats().size).toBe(1)
      
      // Clear continuity
      await service.clearContinuity('user-123')
      expect(service.getCacheStats().size).toBe(0)
    })
    
    it('should handle multiple users in cache independently', async () => {
      const user1 = { ...mockUser, id: 'user-1' }
      const user2 = { ...mockUser, id: 'user-2' }
      
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2)
      
      // Cache both users
      await service.checkContinuity('user-1')
      await service.checkContinuity('user-2')
      
      const stats = service.getCacheStats()
      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('user-1')
      expect(stats.keys).toContain('user-2')
      
      // Clear one user's cache
      await service.clearContinuity('user-1')
      
      const updatedStats = service.getCacheStats()
      expect(updatedStats.size).toBe(1)
      expect(updatedStats.keys).not.toContain('user-1')
      expect(updatedStats.keys).toContain('user-2')
    })
    
    it('should clear stale cache entries when continuity window expires', async () => {
      const oldUser = {
        ...mockUser,
        lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      }
      
      mockPrisma.user.findUnique.mockResolvedValue(oldUser)
      
      // First call - should cache but return null due to old activity
      const result = await service.checkContinuity('user-123')
      expect(result).toBeNull()
      
      // Cache should be empty for stale users
      expect(service.getCacheStats().size).toBe(0)
    })
  })
  
  describe('buildContinuityState', () => {
    it('should return null for users with old activity', () => {
      const oldUser = {
        ...mockUser,
        lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
      }
      
      const result = (service as any).buildContinuityState('user-123', oldUser)
      expect(result).toBeNull()
    })
    
    it('should build correct state for recent activity', () => {
      const result = (service as any).buildContinuityState('user-123', mockUser)
      
      expect(result).toEqual({
        userId: 'user-123',
        lastActivity: mockUser.lastActivity,
        lastPhase: JourneyPhase.ASSESSMENT,
        lastAgent: 'OrchestratorAgent',
        lastConversationId: 'conv-123',
        pendingAction: {
          type: 'assessment_selection',
          data: {
            availableAssessments: ['TMP', 'TeamSignals']
          }
        },
        metadata: {
          conversationContext: { phase: JourneyPhase.ASSESSMENT },
          conversationMetadata: { test: true }
        }
      })
    })
  })
})