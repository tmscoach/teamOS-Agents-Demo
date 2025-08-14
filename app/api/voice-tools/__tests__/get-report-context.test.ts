import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../get-report-context/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

// Mock dependencies
vi.mock('@/src/lib/auth/clerk-dev-wrapper', () => ({
  currentUser: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  default: {
    userReport: {
      findUnique: vi.fn(),
      findFirst: vi.fn()
    }
  }
}));

import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

describe('GET /api/voice-tools/get-report-context', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockReport = {
    id: 'report-123',
    subscriptionId: '21989',
    userId: 'test-user-id',
    createdAt: new Date('2024-01-15'),
    jsonData: {
      workflowType: 'TMP',
      sections: [
        {
          title: 'Team Management Profile',
          visualization: {
            data: {
              majorRole: {
                name: 'Upholder Maintainer',
                code: 'UM',
                position: 6,
                score: 8,
                color: '#00aee5',
                percentage: 19
              }
            }
          }
        }
      ]
    },
    ReportChunk: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (currentUser as any).mockResolvedValue(mockUser);
  });

  describe('authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      (currentUser as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: '21989' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('report retrieval by reportId', () => {
    it('should retrieve report by reportId when provided in context', async () => {
      (prisma.userReport.findUnique as any).mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({
          context: {
            reportId: 'report-123',
            subscriptionId: '21989'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.userReport.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        include: {
          ReportChunk: {
            orderBy: { chunkIndex: 'asc' },
            take: 10
          }
        }
      });
      expect(data.success).toBe(true);
      expect(data.output.reportSummary).toContain('Upholder Maintainer');
    });
  });

  describe('report retrieval by subscriptionId', () => {
    it('should retrieve report by subscriptionId when no reportId provided', async () => {
      (prisma.userReport.findFirst as any).mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: '21989'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.userReport.findFirst).toHaveBeenCalledWith({
        where: { subscriptionId: '21989' },
        orderBy: { createdAt: 'desc' },
        include: {
          ReportChunk: {
            orderBy: { chunkIndex: 'asc' },
            take: 10
          }
        }
      });
      expect(data.success).toBe(true);
    });

    it('should use context subscriptionId when direct param is placeholder', async () => {
      (prisma.userReport.findFirst as any).mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({
          subscriptionId: 'user_subscription_id', // placeholder
          userId: 'user', // placeholder
          context: {
            subscriptionId: '21989',
            userId: 'actual-user-id'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prisma.userReport.findFirst).toHaveBeenCalledWith({
        where: { subscriptionId: '21989' },
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object)
      });
    });
  });

  describe('report data processing', () => {
    it('should unwrap success/data structure if present', async () => {
      const wrappedReport = {
        ...mockReport,
        jsonData: {
          success: true,
          data: mockReport.jsonData
        }
      };
      (prisma.userReport.findFirst as any).mockResolvedValue(wrappedReport);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: '21989' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.output.reportSummary).toContain('Upholder Maintainer');
    });

    it('should extract major role from various locations', async () => {
      const reports = [
        // Major role in profile
        {
          ...mockReport,
          jsonData: {
            profile: { majorRole: 'Creator Innovator' }
          }
        },
        // Major role at root
        {
          ...mockReport,
          jsonData: {
            majorRole: 'Assessor Developer'
          }
        },
        // Major role in sections
        {
          ...mockReport,
          jsonData: mockReport.jsonData
        }
      ];

      for (const report of reports) {
        (prisma.userReport.findFirst as any).mockResolvedValue(report);

        const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
          method: 'POST',
          body: JSON.stringify({ subscriptionId: '21989' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.output.reportSummary).toMatch(/Major Role:/);
      }
    });
  });

  describe('error handling', () => {
    it('should return 400 if no subscriptionId provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Subscription ID is required');
    });

    it('should return error if report not found', async () => {
      (prisma.userReport.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: 'non-existent' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Returns 200 with success: false
      expect(data.success).toBe(false);
      expect(data.error).toBe('Report not found');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.userReport.findFirst as any).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/voice-tools/get-report-context', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId: '21989' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database connection failed');
    });
  });
});