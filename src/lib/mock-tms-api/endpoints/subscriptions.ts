/**
 * Mock TMS Subscription Endpoints
 * Simulates TMS Global subscription and report endpoints
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { 
  TMSDashboardSubscription,
  TMSReportSummary,
  TMSReportTemplate,
  TMSErrorResponse
} from '../types';

/**
 * GET /Respondent/GetDashboardSubscription
 * Get user's subscriptions (Respondent only)
 */
export async function getDashboardSubscriptions(options: {
  jwt?: string;
}): Promise<{ subscriptions: TMSDashboardSubscription[] }> {
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

  // This endpoint is typically for respondents
  if (claims.UserType !== 'Respondent') {
    throw {
      error: 'ACCESS_DENIED',
      message: 'This endpoint is for respondents only'
    } as TMSErrorResponse;
  }

  // Get user's subscriptions
  const userSubscriptions = mockDataStore.getUserSubscriptions(claims.sub);

  // Transform to dashboard format
  const subscriptions: TMSDashboardSubscription[] = userSubscriptions.map(sub => ({
    subscriptionId: sub.subscriptionId,
    workflowId: sub.workflowId,
    workflowName: sub.workflowName,
    status: sub.status,
    completionPercentage: sub.completionPercentage,
    assignedDate: sub.assignedDate.toISOString(),
    completedDate: sub.completedDate?.toISOString(),
    assessmentType: sub.assessmentType
  }));

  return { subscriptions };
}

/**
 * GET /PageContent/GetSubscriptionSummary/{subscriptionId}
 * Get HTML report summary
 */
export async function getSubscriptionSummary(options: {
  endpoint: string;
  jwt?: string;
}): Promise<TMSReportSummary> {
  // Parse endpoint to extract subscriptionId
  const parts = options.endpoint.split('/');
  const subscriptionId = parts[parts.length - 1];

  if (!subscriptionId) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'subscriptionId is required'
    } as TMSErrorResponse;
  }

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

  // Get subscription
  const subscription = mockDataStore.getSubscription(subscriptionId);
  if (!subscription) {
    throw {
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    } as TMSErrorResponse;
  }

  // Check if user has access (either the respondent or a facilitator from same org)
  const hasAccess = subscription.userId === claims.sub || 
    (claims.UserType === 'Facilitator' && claims.organisationId === subscription.organizationId);
  
  if (!hasAccess) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You do not have access to this subscription'
    } as TMSErrorResponse;
  }

  // Generate mock report
  const report = mockDataStore.generateMockReport(subscriptionId);
  if (!report) {
    throw {
      error: 'REPORT_NOT_AVAILABLE',
      message: 'Report is not available. Assessment may not be completed.'
    } as TMSErrorResponse;
  }

  return report;
}

/**
 * GET /Subscription/GetTemplates/{subscriptionId}
 * Get report templates
 */
export async function getReportTemplates(options: {
  endpoint: string;
  jwt?: string;
}): Promise<{ templates: TMSReportTemplate[] }> {
  // Parse endpoint to extract subscriptionId
  const parts = options.endpoint.split('/');
  const subscriptionId = parts[parts.length - 1];

  if (!subscriptionId) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'subscriptionId is required'
    } as TMSErrorResponse;
  }

  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    } as TMSErrorResponse;
  }

  // Mock report templates
  const templates: TMSReportTemplate[] = [
    {
      templateId: 'standard-pdf',
      templateName: 'Standard PDF Report',
      description: 'Comprehensive assessment report in PDF format',
      format: 'PDF'
    },
    {
      templateId: 'executive-pdf',
      templateName: 'Executive Summary PDF',
      description: 'High-level summary for executives',
      format: 'PDF'
    },
    {
      templateId: 'detailed-excel',
      templateName: 'Detailed Excel Report',
      description: 'Full data export with charts and analysis',
      format: 'Excel'
    },
    {
      templateId: 'presentation-ppt',
      templateName: 'Presentation Deck',
      description: 'Ready-to-present PowerPoint slides',
      format: 'PowerPoint'
    }
  ];

  return { templates };
}

/**
 * GET /Subscription/GenerateReport/{subscriptionId}/{templateId}
 * Generate PDF report
 */
export async function generateReport(options: {
  endpoint: string;
  jwt?: string;
}): Promise<{ reportUrl: string; reportData: string }> {
  // Parse endpoint to extract parameters
  const parts = options.endpoint.split('/');
  const subscriptionId = parts[parts.length - 2];
  const templateId = parts[parts.length - 1];

  if (!subscriptionId || !templateId) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'subscriptionId and templateId are required'
    } as TMSErrorResponse;
  }

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

  // Get subscription
  const subscription = mockDataStore.getSubscription(subscriptionId);
  if (!subscription) {
    throw {
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    } as TMSErrorResponse;
  }

  // Check if assessment is completed
  if (subscription.status !== 'completed') {
    throw {
      error: 'ASSESSMENT_NOT_COMPLETE',
      message: 'Cannot generate report for incomplete assessment'
    } as TMSErrorResponse;
  }

  // Generate mock report URL and data
  const reportUrl = `https://mock-tms.com/reports/${subscriptionId}/${templateId}.pdf`;
  const reportData = btoa(`Mock PDF Report for ${subscription.workflowName}`); // Base64 encoded mock PDF

  return {
    reportUrl,
    reportData
  };
}