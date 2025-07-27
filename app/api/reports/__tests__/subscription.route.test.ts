/**
 * Tests for Report Subscription Retrieval API with RBAC
 */

import { NextRequest } from 'next/server';
import { GET } from '../subscription/[subscriptionId]/route';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn()
    },
    userReport: {
      findFirst: jest.fn()
    },
    reportAccessLog: {
      create: jest.fn()
    }
  }
}));

describe('GET /api/reports/subscription/[subscriptionId]', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should require authentication', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost:3000/api/reports/subscription/21989');
    const params = { params: Promise.resolve({ subscriptionId: '21989' }) };

    const response = await GET(request, params);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should allow team member to access their own report', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    
    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-user-123',
      role: 'TEAM_MEMBER',
      organizationId: 'org-123'
    };
    
    const mockReport = {
      id: 'report-123',
      userId: 'user-123',
      subscriptionId: '21989',
      reportType: 'TMP',
      processingStatus: 'COMPLETED',
      processedHtml: '<html>Processed Report</html>',
      metadata: { title: 'TMP Report' },
      ReportImage: [],
      ReportChunk: []
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userReport.findFirst as jest.Mock).mockResolvedValue(mockReport);

    const request = new NextRequest('http://localhost:3000/api/reports/subscription/21989');
    const params = { params: Promise.resolve({ subscriptionId: '21989' }) };

    const response = await GET(request, params);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.report.id).toBe('report-123');
    
    // Verify RBAC: Only checking for user's own reports
    expect(prisma.userReport.findFirst).toHaveBeenCalledWith({
      where: {
        subscriptionId: '21989',
        processingStatus: 'COMPLETED',
        OR: [
          { userId: 'user-123' },
          { organizationId: 'org-123' }
        ]
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' }
    });
    
    // Verify access logging
    expect(prisma.reportAccessLog.create).toHaveBeenCalledWith({
      data: {
        reportId: 'report-123',
        accessedBy: 'user-123',
        accessType: 'VIEW'
      }
    });
  });

  it('should prevent team member from accessing other user reports', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    
    const mockUser = {
      id: 'user-123',
      clerkId: 'clerk-user-123',
      role: 'TEAM_MEMBER',
      organizationId: 'org-123'
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.userReport.findFirst as jest.Mock).mockResolvedValue(null); // No matching report

    const request = new NextRequest('http://localhost:3000/api/reports/subscription/99999');
    const params = { params: Promise.resolve({ subscriptionId: '99999' }) };

    const response = await GET(request, params);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Report not found or not yet processed');
    
    // No access log should be created
    expect(prisma.reportAccessLog.create).not.toHaveBeenCalled();
  });

  it('should allow manager to access team member reports', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-manager-123' } as any);
    
    const mockManager = {
      id: 'manager-123',
      clerkId: 'clerk-manager-123',
      role: 'MANAGER',
      organizationId: 'org-123'
    };
    
    const mockTeamReport = {
      id: 'report-456',
      userId: 'user-456', // Different user
      organizationId: 'org-123', // Same organization
      subscriptionId: '21990',
      reportType: 'TMP',
      processingStatus: 'COMPLETED',
      processedHtml: '<html>Team Member Report</html>',
      ReportImage: [],
      ReportChunk: []
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockManager);
    (prisma.userReport.findFirst as jest.Mock).mockResolvedValue(mockTeamReport);

    const request = new NextRequest('http://localhost:3000/api/reports/subscription/21990');
    const params = { params: Promise.resolve({ subscriptionId: '21990' }) };

    const response = await GET(request, params);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.report.id).toBe('report-456');
    
    // Verify manager can access org reports
    expect(prisma.userReport.findFirst).toHaveBeenCalledWith({
      where: {
        subscriptionId: '21990',
        processingStatus: 'COMPLETED',
        OR: [
          { userId: 'manager-123' },
          { organizationId: 'org-123' }
        ]
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' }
    });
  });

  it('should handle missing subscription ID', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);

    const request = new NextRequest('http://localhost:3000/api/reports/subscription/');
    const params = { params: Promise.resolve({ subscriptionId: '' }) };

    const response = await GET(request, params);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Subscription ID required');
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost:3000/api/reports/subscription/21989');
    const params = { params: Promise.resolve({ subscriptionId: '21989' }) };

    const response = await GET(request, params);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to retrieve report');
  });
});