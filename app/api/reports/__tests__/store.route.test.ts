/**
 * Tests for Report Store API endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '../store/route';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { ReportStorageService } from '@/src/lib/services/report-storage/report-storage.service';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));
jest.mock('@/src/lib/services/report-storage/report-storage.service');

describe('POST /api/reports/store', () => {
  const mockAuth = auth as jest.MockedFunction<typeof auth>;
  const mockStoreReport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ReportStorageService as jest.Mock).mockImplementation(() => ({
      storeReport: mockStoreReport
    }));
  });

  it('should require authentication', async () => {
    mockAuth.mockResolvedValue({ userId: null } as any);

    const request = new NextRequest('http://localhost:3000/api/reports/store', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate required fields', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      clerkId: 'clerk-user-123'
    });

    const request = new NextRequest('http://localhost:3000/api/reports/store', {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'TMP',
        // Missing required fields
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required fields');
  });

  it('should create user if not exists and store report', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-123',
      clerkId: 'clerk-user-123'
    });
    mockStoreReport.mockResolvedValue('report-123');

    const request = new NextRequest('http://localhost:3000/api/reports/store', {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'TMP',
        subscriptionId: '21989',
        templateId: '6',
        rawHtml: '<html>Test Report</html>',
        processImmediately: true,
        jwt: 'mock-jwt'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.reportId).toBe('report-123');
    
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        clerkId: 'clerk-user-123',
        email: `user-clerk-user-123@temp.com`,
        role: 'TEAM_MEMBER'
      }
    });
    
    expect(mockStoreReport).toHaveBeenCalledWith({
      userId: 'new-user-123',
      teamId: undefined,
      organizationId: 'default',
      reportType: 'TMP',
      subscriptionId: '21989',
      templateId: '6',
      rawHtml: '<html>Test Report</html>',
      processImmediately: true,
      jwt: 'mock-jwt'
    });
  });

  it('should validate report type', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      clerkId: 'clerk-user-123'
    });

    const request = new NextRequest('http://localhost:3000/api/reports/store', {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'INVALID_TYPE',
        subscriptionId: '21989',
        templateId: '6',
        rawHtml: '<html>Test</html>'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid report type');
  });

  it('should handle storage service errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'clerk-user-123' } as any);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      clerkId: 'clerk-user-123'
    });
    mockStoreReport.mockRejectedValue(new Error('Storage failed'));

    const request = new NextRequest('http://localhost:3000/api/reports/store', {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'TMP',
        subscriptionId: '21989',
        templateId: '6',
        rawHtml: '<html>Test Report</html>'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to store report');
  });
});