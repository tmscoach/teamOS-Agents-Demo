/**
 * Mock TMS Workflow Endpoints
 * Simulates TMS Global workflow/assessment endpoints based on recorded API flows
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { 
  TMSWorkflowUpdateRequest,
  TMSErrorResponse,
  TMSReportSummary,
  TMSReportTemplate
} from '../types';
import { workflowStateManager } from '../workflow-state-manager';
import { QuestionGenerator } from '../question-generator';
import { getAssessmentByBaseContentId, getAssessmentByWorkflow } from '../assessment-definitions';

/**
 * GET /Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}
 * Get current workflow state with questions - matches recorded API response format
 */
export async function getWorkflowProcess(options: { 
  endpoint: string;
  jwt?: string;
}): Promise<any> {
  // Parse endpoint to extract parameters
  const parts = options.endpoint.split('/');
  const subscriptionId = parts[3];
  const baseContentId = parts[4] ? parseInt(parts[4]) : undefined;
  const sectionId = parts[5] ? parseInt(parts[5]) : undefined;
  const pageId = parts[6] ? parseInt(parts[6]) : undefined;

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

  // Check if user has access
  if (subscription.userId !== claims.sub && claims.organisationId !== subscription.organizationId) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You do not have access to this subscription'
    } as TMSErrorResponse;
  }

  // Get or create workflow state
  const state = workflowStateManager.getOrCreateWorkflowState(
    subscriptionId,
    subscription.workflowId,
    baseContentId
  );

  // Navigate to requested page if provided
  if (pageId && sectionId) {
    workflowStateManager.navigateToPage(subscriptionId, pageId, sectionId, baseContentId);
  }

  // Get assessment definition
  const assessment = getAssessmentByWorkflow(state.workflowId) || 
                    (baseContentId ? getAssessmentByBaseContentId(baseContentId) : undefined);
  
  if (!assessment) {
    throw {
      error: 'WORKFLOW_NOT_FOUND',
      message: 'Workflow not found'
    } as TMSErrorResponse;
  }

  // Get navigation info
  const navigationInfo = workflowStateManager.getNavigationInfo(subscriptionId);

  // Calculate page number
  let pageNumber = 1;
  assessment.sections?.forEach(section => {
    const pageIndex = section.pages.indexOf(navigationInfo.currentPageId);
    if (pageIndex !== -1) {
      pageNumber = section.pages.slice(0, pageIndex + 1).length;
      // Add pages from previous sections
      const sectionIndex = assessment.sections?.indexOf(section) || 0;
      for (let i = 0; i < sectionIndex; i++) {
        pageNumber += assessment.sections![i].pages.length;
      }
    }
  });

  // Generate questions for current page
  const questions = QuestionGenerator.generateQuestionsForPage(
    assessment,
    pageNumber,
    navigationInfo.currentPageId
  );

  // Generate overview HTML
  const overview = QuestionGenerator.generatePageOverview(
    assessment,
    pageNumber,
    assessment.totalPages
  );

  // Format response to match recorded API structure
  const response: any = {
    PageID: navigationInfo.currentPageId,
    Overview: overview,
    Description: `${assessment.assessmentType === 'TMP' ? 'TMPQ' : assessment.assessmentType === 'QO2' ? 'QO2Q' : 'TSQ'} - Page ${pageNumber.toString().padStart(2, '0')}`,
    Questions: questions,
    BaseContentID: state.baseContentId,
    CurrentSectionID: state.currentSectionId,
    CurrentPageID: navigationInfo.currentPageId,
    SubscriptionID: parseInt(subscriptionId),
  };

  // Add navigation fields
  if (navigationInfo.nextPageId) {
    response.NextPageID = navigationInfo.nextPageId;
  }
  if (navigationInfo.previousPageId) {
    response.PreviousPageID = navigationInfo.previousPageId;
  }
  if (navigationInfo.nextBaseContentId) {
    response.NextBaseContentID = navigationInfo.nextBaseContentId;
  }
  if (navigationInfo.previousBaseContentId) {
    response.PreviousBaseContentID = navigationInfo.previousBaseContentId;
  }

  return response;
}

/**
 * POST /Workflow/Update
 * Submit answers and progress - returns simple true like recorded API
 */
export async function updateWorkflow(options: {
  data: any;
  jwt?: string;
}): Promise<boolean> {
  console.log('updateWorkflow called with options:', JSON.stringify(options, null, 2));
  
  if (!options.data) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'Request data is required'
    } as TMSErrorResponse;
  }
  
  const { subscriptionID, pageID, questions } = options.data;

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
  const subscription = mockDataStore.getSubscription(subscriptionID.toString());
  if (!subscription) {
    throw {
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    } as TMSErrorResponse;
  }

  // Check if user has access
  if (subscription.userId !== claims.sub && claims.organisationId !== subscription.organizationId) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You do not have access to this subscription'
    } as TMSErrorResponse;
  }

  // Update workflow state with answers
  const answers = questions.map((q: any) => ({
    questionID: q.questionID,
    value: q.value
  }));

  workflowStateManager.updateWorkflowState(
    subscriptionID.toString(),
    pageID,
    answers
  );

  // Update mock data store subscription progress
  const answerMap: Record<string, any> = {};
  questions.forEach((q: any) => {
    answerMap[q.questionID] = q.value;
  });
  mockDataStore.updateSubscriptionProgress(subscriptionID.toString(), pageID, answerMap);

  // Return simple true like the recorded API
  return true;
}

/**
 * GET /Workflow/Start/{workflowId}/{subscriptionId}
 * Start/initialize workflow
 */
export async function startWorkflow(options: {
  endpoint: string;
  jwt?: string;
}): Promise<{ success: boolean; firstPageUrl: string }> {
  // Parse endpoint to extract parameters
  const parts = options.endpoint.split('/');
  const workflowId = parts[3];
  const subscriptionId = parts[4];

  if (!workflowId || !subscriptionId) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'workflowId and subscriptionId are required'
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

  // Check if user has access
  if (subscription.userId !== claims.sub) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You do not have access to this subscription'
    } as TMSErrorResponse;
  }

  // Get assessment definition
  const assessment = getAssessmentByWorkflow(workflowId);
  if (!assessment) {
    throw {
      error: 'WORKFLOW_NOT_FOUND',
      message: 'Workflow not found'
    } as TMSErrorResponse;
  }

  // Initialize workflow state
  const state = workflowStateManager.getOrCreateWorkflowState(
    subscriptionId,
    workflowId
  );

  // Update subscription status if not started
  const updatedSubscription = mockDataStore.getSubscription(subscriptionId);
  if (updatedSubscription && updatedSubscription.status === 'not_started') {
    updatedSubscription.status = 'in_progress';
  }

  // Get first page info
  const firstSection = assessment.sections?.[0];
  const firstPageId = firstSection?.pages[0] || 1;

  return {
    success: true,
    firstPageUrl: `/Workflow/Process/${subscriptionId}/${assessment.baseContentId}/${firstSection?.sectionId}/${firstPageId}`
  };
}


/**
 * POST /api/v1/workflow/generate-report
 * Generate PDF report for a completed assessment
 */
export async function generateSubscriptionReport(options: {
  data: {
    subscriptionId: string;
    templateId: string;
  };
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

  // Get subscription
  const subscription = mockDataStore.getSubscription(options.data.subscriptionId);
  if (!subscription) {
    throw {
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    } as TMSErrorResponse;
  }

  // Mock report generation - in real implementation would validate template and generate PDF
  const reportId = `${subscription.assessmentType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const reportUrl = `https://mock-tms.com/reports/assessments/${reportId}.pdf`;

  return {
    reportId,
    reportUrl,
    status: 'completed'
  };
}