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

      // Check database
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

      // If we're using mock API, we can auto-login
      if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
        return this.createMockToken(userId, authToken);
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

      // Update cache
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

      // Remove from database
      await prisma.tMSAuthToken.delete({
        where: { userId }
      }).catch(() => {
        // Ignore if doesn't exist
      });
    } catch (error) {
      console.error('[TMSAuthService] Error clearing token:', error);
    }
  }

  /**
   * Create a mock token for development
   */
  private async createMockToken(userId: string, authToken: any): Promise<string> {
    try {
      // Get user details
      const user = authToken?.User || await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // For mock, we'll simulate a login
      // In real implementation, this would use actual TMS credentials
      const mockAuthResponse: TMSAuthResponse = {
        token: mockTMSClient.generateJWT({
          sub: userId,
          UserType: user.role === 'MANAGER' ? 'Facilitator' : 'Respondent',
          nameid: user.email,
          organisationId: user.organizationId || 'mock-org-123'
        }),
        userId: userId,
        userType: user.role === 'MANAGER' ? 'Facilitator' : 'Respondent',
        organizationId: user.organizationId || 'mock-org-123',
        firstName: user.name?.split(' ')[0] || 'Mock',
        lastName: user.name?.split(' ')[1] || 'User',
        email: user.email
      };

      // Store the mock token
      await this.storeToken(userId, mockAuthResponse);

      return mockAuthResponse.token;
    } catch (error) {
      console.error('[TMSAuthService] Error creating mock token:', error);
      throw new Error(`Failed to create mock token: ${error}`);
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