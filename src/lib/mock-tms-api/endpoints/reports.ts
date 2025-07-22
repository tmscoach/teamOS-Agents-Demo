/**
 * Mock TMS Report Endpoints
 * Simulates TMS Global custom report generation endpoints
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { 
  TMSGenerateReportRequest,
  TMSProductUsage,
  TMSErrorResponse
} from '../types';

/**
 * POST /api/v1/reports/generate
 * Generate custom reports
 */
export async function generateCustomReport(options: {
  data: TMSGenerateReportRequest;
  jwt?: string;
}): Promise<{ reportId: string; reportUrl: string; status: string }> {
  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    } as TMSErrorResponse;
  }

  const claims = mockTMSClient.decodeJWT(options.jwt);
  if (!claims) {
    throw {
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    } as TMSErrorResponse;
  }

  // Only facilitators can generate custom reports
  if (claims.UserType !== 'Facilitator') {
    throw {
      error: 'ACCESS_DENIED',
      message: 'Only facilitators can generate custom reports'
    } as TMSErrorResponse;
  }

  const { organizationId, reportType, dateRange, includeTeams, format = 'PDF' } = options.data;

  // Validate organization access
  if (claims.organisationId !== organizationId) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You can only generate reports for your organization'
    } as TMSErrorResponse;
  }

  // Generate mock report
  const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const reportUrl = `https://mock-tms.com/reports/custom/${reportId}.${format.toLowerCase()}`;

  // In a real implementation, this would trigger background report generation
  // For mock, we'll return immediately with a "completed" status
  return {
    reportId,
    reportUrl,
    status: 'completed'
  };
}

/**
 * GET /api/v1/reports/product-usage
 * Get product usage analytics
 */
export async function getProductUsage(options: {
  jwt?: string;
}): Promise<TMSProductUsage> {
  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    } as TMSErrorResponse;
  }

  const claims = mockTMSClient.decodeJWT(options.jwt);
  if (!claims) {
    throw {
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    } as TMSErrorResponse;
  }

  // Only facilitators can view product usage
  if (claims.UserType !== 'Facilitator') {
    throw {
      error: 'ACCESS_DENIED',
      message: 'Only facilitators can view product usage'
    } as TMSErrorResponse;
  }

  // Get organization
  const org = mockDataStore.getOrganization(claims.organisationId);
  if (!org) {
    throw {
      error: 'ORGANIZATION_NOT_FOUND',
      message: 'Organization not found'
    } as TMSErrorResponse;
  }

  // Generate mock usage data
  // In real implementation, this would aggregate actual usage data
  const mockUsage: TMSProductUsage = {
    organizationId: claims.organisationId,
    activeUsers: Math.floor(Math.random() * 50) + 10, // 10-60 users
    totalAssessments: Math.floor(Math.random() * 200) + 50, // 50-250 assessments
    completionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
    averageTimeToComplete: Math.floor(Math.random() * 10) + 20, // 20-30 days
    mostUsedAssessments: [
      {
        assessmentType: 'TMP',
        count: Math.floor(Math.random() * 50) + 20
      },
      {
        assessmentType: 'TeamSignals',
        count: Math.floor(Math.random() * 40) + 15
      },
      {
        assessmentType: 'QO2',
        count: Math.floor(Math.random() * 30) + 10
      },
      {
        assessmentType: 'WOW',
        count: Math.floor(Math.random() * 25) + 5
      },
      {
        assessmentType: 'LLP',
        count: Math.floor(Math.random() * 20) + 5
      }
    ].sort((a, b) => b.count - a.count) // Sort by count descending
  };

  return mockUsage;
}