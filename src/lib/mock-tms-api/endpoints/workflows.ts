/**
 * Mock TMS Workflow Endpoints
 * Simulates TMS Global workflow/assessment endpoints
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { 
  TMSWorkflowProcess,
  TMSWorkflowUpdateRequest,
  TMSWorkflowUpdateResponse,
  TMSErrorResponse
} from '../types';

/**
 * GET /Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}
 * Get current workflow state with questions
 */
export async function getWorkflowProcess(options: { 
  endpoint: string;
  jwt?: string;
}): Promise<TMSWorkflowProcess> {
  // Parse endpoint to extract parameters
  const parts = options.endpoint.split('/');
  const subscriptionId = parts[3];
  const baseContentId = parts[4];
  const sectionId = parts[5];
  const pageId = parts[6];

  if (!subscriptionId || !pageId) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'subscriptionId and pageId are required'
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

  // Get workflow and page
  const workflow = mockDataStore.getWorkflow(subscription.workflowId);
  if (!workflow) {
    throw {
      error: 'WORKFLOW_NOT_FOUND',
      message: 'Workflow not found'
    } as TMSErrorResponse;
  }

  const page = mockDataStore.getWorkflowPage(subscription.workflowId, pageId);
  if (!page) {
    throw {
      error: 'PAGE_NOT_FOUND',
      message: 'Workflow page not found'
    } as TMSErrorResponse;
  }

  // Get current answers for questions on this page
  const questionsWithAnswers = page.questions.map(q => ({
    ...q,
    currentAnswer: subscription.answers[q.questionId]
  }));

  // Calculate navigation options
  const currentPageIndex = workflow.pages.findIndex(p => p.pageId === pageId);
  const canGoBack = currentPageIndex > 0;
  const canGoForward = currentPageIndex < workflow.pages.length - 1;
  const previousPageId = canGoBack ? workflow.pages[currentPageIndex - 1].pageId : undefined;
  const nextPageId = canGoForward ? workflow.pages[currentPageIndex + 1].pageId : undefined;

  return {
    subscriptionId,
    baseContentId: page.baseContentId,
    sectionId: page.sectionId,
    pageId: page.pageId,
    questionData: questionsWithAnswers,
    progress: {
      currentPage: currentPageIndex + 1,
      totalPages: workflow.pages.length,
      completionPercentage: subscription.completionPercentage
    },
    navigationOptions: {
      canGoBack,
      canGoForward,
      previousPageId,
      nextPageId
    }
  };
}

/**
 * POST /Workflow/Update
 * Submit answers and progress
 */
export async function updateWorkflow(options: {
  data: TMSWorkflowUpdateRequest;
  jwt?: string;
}): Promise<TMSWorkflowUpdateResponse> {
  const { subscriptionId, pageId, answers } = options.data;

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

  // Convert answers array to object
  const answerMap: Record<string, any> = {};
  answers.forEach(a => {
    answerMap[a.questionId] = a.answer;
  });

  // Update subscription progress
  mockDataStore.updateSubscriptionProgress(subscriptionId, pageId, answerMap);

  // Get updated subscription
  const updatedSubscription = mockDataStore.getSubscription(subscriptionId);
  if (!updatedSubscription) {
    throw {
      error: 'UPDATE_FAILED',
      message: 'Failed to update subscription'
    } as TMSErrorResponse;
  }

  // Get workflow to determine next page
  const workflow = mockDataStore.getWorkflow(updatedSubscription.workflowId);
  if (!workflow) {
    throw {
      error: 'WORKFLOW_NOT_FOUND',
      message: 'Workflow not found'
    } as TMSErrorResponse;
  }

  const currentPageIndex = workflow.pages.findIndex(p => p.pageId === pageId);
  const nextPageId = currentPageIndex < workflow.pages.length - 1
    ? workflow.pages[currentPageIndex + 1].pageId
    : undefined;

  return {
    success: true,
    nextPageId,
    completionPercentage: updatedSubscription.completionPercentage
  };
}

/**
 * GET /Workflow/Start/{workflowId}/{subscriptionId}
 * Start/initialize workflow
 */
export async function startWorkflow(options: {
  endpoint: string;
  jwt?: string;
}): Promise<{ success: boolean; firstPageId: string }> {
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

  // Get workflow
  const workflow = mockDataStore.getWorkflow(workflowId);
  if (!workflow) {
    throw {
      error: 'WORKFLOW_NOT_FOUND',
      message: 'Workflow not found'
    } as TMSErrorResponse;
  }

  // Update subscription status if not started
  if (subscription.status === 'not_started') {
    subscription.status = 'in_progress';
  }

  return {
    success: true,
    firstPageId: workflow.pages[0].pageId
  };
}