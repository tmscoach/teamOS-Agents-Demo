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
 * Get dashboard subscriptions (Facilitators see all org subscriptions, Respondents see their own)
 */
export async function getDashboardSubscriptions(options: {
  jwt?: string;
}): Promise<TMSDashboardSubscription[]> {
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

  console.log('Dashboard subscriptions - JWT claims:', claims);
  console.log('Dashboard - mockDataStore instance:', mockDataStore);
  console.log('All subscriptions in store:', Array.from(mockDataStore.subscriptions.values()));
  console.log('Store subscriptions size:', mockDataStore.subscriptions.size);

  // Get subscriptions based on user type
  let userSubscriptions;
  
  if (claims.UserType === 'Facilitator') {
    // Facilitators can see all subscriptions in their organization
    const allSubscriptions = Array.from(mockDataStore.subscriptions.values());
    userSubscriptions = allSubscriptions.filter(sub => 
      sub.organizationId === claims.organisationId
    );
    console.log('Filtering for org:', claims.organisationId);
    console.log('Found subscriptions:', userSubscriptions);
  } else {
    // Respondents only see their own subscriptions
    userSubscriptions = mockDataStore.getUserSubscriptions(claims.sub);
  }

  // Transform to dashboard format matching the recorded API
  const subscriptions: TMSDashboardSubscription[] = userSubscriptions.map(sub => ({
    SubscriptionID: parseInt(sub.subscriptionId) || 0,
    WorkflowID: parseInt(sub.workflowId.replace(/\D/g, '')) || 0,
    WorkflowType: sub.assessmentType,
    Status: sub.status === 'completed' ? 'Completed' : sub.status === 'in_progress' ? 'In Progress' : 'Not Started',
    Progress: sub.completionPercentage,
    AssignmentDate: sub.assignedDate.toISOString().split('T')[0],
    CompletionDate: sub.completedDate ? sub.completedDate.toISOString().split('T')[0] : null,
    OrganisationID: 0,
    OrganisationName: "Test Organization",
    AssessmentType: sub.assessmentType,
    AssessmentStatus: sub.status === 'completed' ? 'Completed' : sub.status === 'in_progress' ? 'In Progress' : 'Not Started'
  }));

  return subscriptions;
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