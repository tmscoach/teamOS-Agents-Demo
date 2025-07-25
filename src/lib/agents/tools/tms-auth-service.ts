/**
 * TMS Auth Service
 * Manages TMS JWT tokens for agents
 */

import { prisma } from '@/lib/db/prisma';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { TMSAuthResponse } from '@/src/lib/mock-tms-api/types';

export class TMSAuthService {
  private static instance: TMSAuthService;
  private tokenCache: Map<string, { token: string; expiresAt: Date }> = new Map();

  private constructor() {}

  static getInstance(): TMSAuthService {
    if (!TMSAuthService.instance) {
      TMSAuthService.instance = new TMSAuthService();
    }
    return TMSAuthService.instance;
  }

  /**
   * Get or create TMS JWT token for a user
   */
  async getOrCreateToken(userId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.tokenCache.get(userId);
      if (cached && cached.expiresAt > new Date()) {
        return cached.token;
      }

      // For mock API mode, check if this is a database user ID or mock user ID
      if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
        // First check if this userId exists in the database
        const dbUser = await prisma.user.findUnique({
          where: { id: userId }
        }).catch(() => null);

        if (dbUser) {
          // This is a database user ID, check for existing token
          const authToken = await prisma.tMSAuthToken.findUnique({
            where: { userId },
            include: { User: true }
          });

          if (authToken?.tmsJwtToken && authToken.expiresAt && authToken.expiresAt > new Date()) {
            // Token is still valid
            this.tokenCache.set(userId, {
              token: authToken.tmsJwtToken,
              expiresAt: authToken.expiresAt
            });
            return authToken.tmsJwtToken;
          }

          // Create mock token for database user
          return this.createMockToken(userId, authToken);
        } else {
          // This might be a mock user ID, create token without database
          return this.createMockTokenForMockUser(userId);
        }
      }

      // In production mode, only check database
      const authToken = await prisma.tMSAuthToken.findUnique({
        where: { userId },
        include: { User: true }
      });

      if (authToken?.tmsJwtToken && authToken.expiresAt && authToken.expiresAt > new Date()) {
        // Token is still valid
        this.tokenCache.set(userId, {
          token: authToken.tmsJwtToken,
          expiresAt: authToken.expiresAt
        });
        return authToken.tmsJwtToken;
      }

      // In production, return null if no valid token
      return null;
    } catch (error) {
      console.error('[TMSAuthService] Error getting token:', error);
      return null;
    }
  }

  /**
   * Store TMS JWT token for a user
   */
  async storeToken(userId: string, authResponse: TMSAuthResponse): Promise<void> {
    try {
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Only store in database if this is a database user
      const dbUser = await prisma.user.findUnique({
        where: { id: userId }
      }).catch(() => null);

      if (dbUser) {
        // Store in database
        await prisma.tMSAuthToken.upsert({
          where: { userId },
          update: {
            tmsJwtToken: authResponse.token,
            tmsUserId: authResponse.userId,
            tmsOrgId: authResponse.organizationId,
            expiresAt
          },
          create: {
            id: `tmsauth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            tmsJwtToken: authResponse.token,
            tmsUserId: authResponse.userId,
            tmsOrgId: authResponse.organizationId,
            expiresAt,
            updatedAt: new Date()
          }
        });
      }

      // Always update cache (for both database and mock users)
      this.tokenCache.set(userId, {
        token: authResponse.token,
        expiresAt
      });
    } catch (error) {
      console.error('[TMSAuthService] Error storing token:', error);
      throw error;
    }
  }

  /**
   * Clear token for a user
   */
  async clearToken(userId: string): Promise<void> {
    try {
      // Remove from cache
      this.tokenCache.delete(userId);

      // Only try to remove from database if this is a database user
      const dbUser = await prisma.user.findUnique({
        where: { id: userId }
      }).catch(() => null);

      if (dbUser) {
        // Remove from database
        await prisma.tMSAuthToken.delete({
          where: { userId }
        }).catch(() => {
          // Ignore if doesn't exist
        });
      }
    } catch (error) {
      console.error('[TMSAuthService] Error clearing token:', error);
    }
  }

  /**
   * Create a mock token for development
   */
  private async createMockToken(userId: string, authToken: any): Promise<string> {
    try {
      // For mock, we need to find the mock user data
      const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
      
      // First, get the database user to find clerk ID
      const user = authToken?.User || await prisma.user.findUnique({
        where: { id: userId }
      });

      let mockUser = null;
      let mockUserId = userId;
      
      // Try to find mock user by clerk ID if we have a database user
      if (user?.clerkId) {
        mockUser = mockDataStore.getUserByClerkId(user.clerkId);
        if (mockUser) {
          mockUserId = mockUser.id;
          console.log(`[TMSAuthService] Found mock user ${mockUserId} for clerk ID ${user.clerkId}`);
        }
      }
      
      // If no mock user found and we have a user, create one
      if (!mockUser && user) {
        console.log(`[TMSAuthService] Creating new mock user for ${user.email}`);
        mockUser = mockDataStore.createUser({
          email: user.email,
          firstName: user.name?.split(' ')[0] || 'User',
          lastName: user.name?.split(' ')[1] || '',
          userType: user.role === 'MANAGER' ? 'Facilitator' : 'Respondent',
          organizationId: user.organizationId || 'org-default',
          clerkUserId: user.clerkId
        });
        mockUserId = mockUser.id;
      }
      
      // If still no user data, use defaults
      const userEmail = mockUser?.email || user?.email || 'user@example.com';
      const userType = mockUser?.userType || (user?.role === 'MANAGER' ? 'Facilitator' : 'Respondent');
      const organizationId = mockUser?.organizationId || user?.organizationId || 'mock-org-123';
      
      // For mock, we'll simulate a login
      const mockAuthResponse: TMSAuthResponse = {
        token: mockTMSClient.generateJWT({
          sub: mockUserId,
          UserType: userType,
          nameid: userEmail,
          organisationId: organizationId
        }),
        userId: mockUserId,
        userType: userType,
        organizationId: organizationId,
        firstName: mockUser?.firstName || user?.name?.split(' ')[0] || 'Mock',
        lastName: mockUser?.lastName || user?.name?.split(' ')[1] || 'User',
        email: userEmail
      };

      // Store the mock token (use the original database userId for storage)
      await this.storeToken(userId, mockAuthResponse);

      return mockAuthResponse.token;
    } catch (error) {
      console.error('[TMSAuthService] Error creating mock token:', error);
      throw new Error(`Failed to create mock token: ${error}`);
    }
  }

  /**
   * Create a mock token for a pure mock user (not in database)
   */
  private async createMockTokenForMockUser(mockUserId: string): Promise<string> {
    try {
      const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
      
      // Get the mock user
      const mockUser = mockDataStore.getUser(mockUserId);
      if (!mockUser) {
        throw new Error(`Mock user ${mockUserId} not found`);
      }
      
      // Generate token for mock user
      const mockAuthResponse: TMSAuthResponse = {
        token: mockTMSClient.generateJWT({
          sub: mockUserId,
          UserType: mockUser.userType,
          nameid: mockUser.email,
          organisationId: mockUser.organizationId
        }),
        userId: mockUserId,
        userType: mockUser.userType,
        organizationId: mockUser.organizationId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email
      };

      // Store in cache only (not database since this is a pure mock user)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      this.tokenCache.set(mockUserId, {
        token: mockAuthResponse.token,
        expiresAt
      });

      return mockAuthResponse.token;
    } catch (error) {
      console.error('[TMSAuthService] Error creating mock token for mock user:', error);
      throw new Error(`Failed to create mock token for mock user: ${error}`);
    }
  }

  /**
   * Check if a token is expired
   */
  isTokenExpired(token: string): boolean {
    return mockTMSClient.isTokenExpired(token);
  }

  /**
   * Get TMS organization ID for a user
   */
  async getTMSOrganizationId(userId: string): Promise<string | null> {
    try {
      // For mock mode, check if this is a mock user first
      if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
        const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
        const mockUser = mockDataStore.getUser(userId);
        if (mockUser) {
          return mockUser.organizationId;
        }
      }

      // Check database for auth token
      const authToken = await prisma.tMSAuthToken.findUnique({
        where: { userId }
      });
      return authToken?.tmsOrgId || null;
    } catch (error) {
      console.error('[TMSAuthService] Error getting org ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tmsAuthService = TMSAuthService.getInstance();