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
  console.log('All subscriptions in store:', Array.from(mockDataStore.subscriptions.values()).map(s => ({
    id: s.subscriptionId,
    userId: s.userId,
    type: s.assessmentType
  })));
  console.log('Store subscriptions size:', mockDataStore.subscriptions.size);

  // Get subscriptions for the current user
  // In TMS Global, this checks which assessments the logged-in user has access to
  let userId: string;
  
  // Check if the sub claim is a Clerk user ID and map it to mock user ID
  let mockUser = mockDataStore.getUserByClerkId(claims.sub);
  
  // If not found by Clerk ID, try to find by regular user ID
  if (!mockUser) {
    mockUser = mockDataStore.getUser(claims.sub);
  }
  
  // If still not found, check if there's a user with matching email
  if (!mockUser && claims.nameid) {
    mockUser = mockDataStore.getUserByEmail(claims.nameid);
  }
  
  if (mockUser) {
    userId = mockUser.id;
    console.log('[getDashboardSubscriptions] Found mock user:', mockUser.email, 'ID:', userId);
  } else {
    // If no mock user exists, we need to ensure they have access to assessments
    // In a real TMS Global integration, the user would have been created during onboarding
    console.log('[getDashboardSubscriptions] No mock user found for claims:', claims);
    
    // For development, use the test user's subscriptions
    // This simulates how TMS Global would have standard subscriptions available
    if (process.env.NODE_ENV === 'development') {
      // Always use test user subscriptions in development
      const testUser = mockDataStore.getUserByEmail('facilitator@example.com');
      if (testUser) {
        userId = testUser.id;
        console.log('[getDashboardSubscriptions] Using test user subscriptions for development');
      } else {
        console.log('[getDashboardSubscriptions] No test user found');
        return [];
      }
    } else {
      return [];
    }
  }
  
  console.log('[getDashboardSubscriptions] Getting subscriptions for user:', userId);
  let userSubscriptions = mockDataStore.getUserSubscriptions(userId);
  
  // In development, if the user has no subscriptions, return the standard TMS subscriptions
  if (userSubscriptions.length === 0 && claims.UserType === 'Facilitator') {
    console.log('[getDashboardSubscriptions] No subscriptions found for facilitator, using standard TMS subscriptions');
    
    // Get the test user's subscriptions as they have the standard TMS subscriptions
    const testUser = mockDataStore.getUserByEmail('facilitator@example.com');
    if (testUser) {
      userSubscriptions = mockDataStore.getUserSubscriptions(testUser.id);
      console.log('[getDashboardSubscriptions] Found test user subscriptions:', userSubscriptions.length);
    } else {
      console.log('[getDashboardSubscriptions] No test user found, returning empty array');
    }
  }

  // Transform to dashboard format matching the recorded API
  const subscriptions: TMSDashboardSubscription[] = userSubscriptions.map((sub, index) => {
    // Extract the numeric subscription ID
    // For test data like "21989", use as-is
    // For user-specific like "user-xxx-21989", extract the TMS ID
    let numericId: number;
    if (/^\d+$/.test(sub.subscriptionId)) {
      numericId = parseInt(sub.subscriptionId);
    } else if (sub.subscriptionId.includes('-')) {
      // Extract the last numeric part (e.g., "user-xxx-21989" -> 21989)
      const parts = sub.subscriptionId.split('-');
      const lastPart = parts[parts.length - 1];
      numericId = parseInt(lastPart) || (index + 1);
    } else {
      numericId = index + 1;
    }
    
    return {
      SubscriptionID: numericId,
      WorkflowID: parseInt(sub.workflowId.replace(/\D/g, '')) || 0,
      WorkflowType: sub.assessmentType,
      Status: sub.status === 'completed' ? 'Completed' : sub.status === 'in_progress' ? 'In Progress' : 'Not Started',
      Progress: sub.completionPercentage,
      AssignmentDate: sub.assignedDate.toISOString().split('T')[0],
      CompletionDate: sub.completedDate ? sub.completedDate.toISOString().split('T')[0] : null,
      OrganisationID: 0,
      OrganisationName: "Test Organization",
      AssessmentType: sub.assessmentType,
      AssessmentStatus: sub.status === 'completed' ? 'Completed' : sub.status === 'in_progress' ? 'In Progress' : 'Not Started',
      // Store the original subscription ID for internal lookups
      _subscriptionId: sub.subscriptionId
    };
  });

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

/**
 * POST /api/v1/subscriptions/assign
 * Assign a workflow subscription to a user
 */
export async function assignSubscription(options: {
  data: {
    userId: string;
    workflowId: string;
    organizationId: string;
  };
  jwt?: string;
}): Promise<{
  subscriptionId: string;
  userId: string;
  workflowId: string;
  workflowName: string;
  assessmentType: string;
  status: string;
  assignedDate: string;
  dashboardUrl: string;
}> {
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

  // Only facilitators can assign subscriptions
  if (claims.UserType !== 'Facilitator') {
    throw {
      error: 'ACCESS_DENIED',
      message: 'Only facilitators can assign subscriptions'
    } as TMSErrorResponse;
  }

  const { userId, workflowId, organizationId } = options.data;

  // Validate required fields
  if (!userId || !workflowId || !organizationId) {
    throw {
      error: 'VALIDATION_ERROR',
      message: 'userId, workflowId, and organizationId are required'
    } as TMSErrorResponse;
  }

  // Verify the facilitator belongs to the same organization
  console.log('Assign subscription - Facilitator org:', claims.organisationId);
  console.log('Assign subscription - Requested org:', organizationId);
  
  if (claims.organisationId !== organizationId) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You can only assign subscriptions within your organization'
    } as TMSErrorResponse;
  }

  // Check if user exists and belongs to the organization
  const targetUser = mockDataStore.getUser(userId);
  if (!targetUser) {
    throw {
      error: 'USER_NOT_FOUND',
      message: 'User not found'
    } as TMSErrorResponse;
  }

  if (targetUser.organizationId !== organizationId) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'User does not belong to your organization'
    } as TMSErrorResponse;
  }

  // Check for existing active subscription
  const existingSubscriptions = mockDataStore.getUserSubscriptions(userId);
  const hasActiveSubscription = existingSubscriptions.some(sub => 
    sub.workflowId === workflowId && 
    sub.status !== 'completed'
  );

  if (hasActiveSubscription) {
    throw {
      error: 'DUPLICATE_SUBSCRIPTION',
      message: 'User already has an active subscription for this workflow'
    } as TMSErrorResponse;
  }

  // Create the subscription
  try {
    const subscription = mockDataStore.createSubscription(userId, workflowId, organizationId);
    
    // Generate dashboard URL
    const dashboardUrl = `/dashboard/assessments/${subscription.subscriptionId}`;

    return {
      subscriptionId: subscription.subscriptionId,
      userId: subscription.userId,
      workflowId: subscription.workflowId,
      workflowName: subscription.workflowName,
      assessmentType: subscription.assessmentType,
      status: subscription.status,
      assignedDate: subscription.assignedDate.toISOString(),
      dashboardUrl
    };
  } catch (error) {
    throw {
      error: 'WORKFLOW_NOT_FOUND',
      message: 'Invalid workflow ID'
    } as TMSErrorResponse;
  }
}