/**
 * Mock TMS Question Endpoints
 * Simulates TMS Global question-related endpoints
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { TMSErrorResponse } from '../types';

interface QuestionAction {
  questionId: string;
  action: 'show' | 'hide' | 'require' | 'optional';
  condition: {
    questionId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
}

/**
 * POST /Question/GetActions
 * Check conditional logic for questions
 */
export async function getQuestionActions(options: {
  data: {
    subscriptionId: string;
    pageId: string;
    answers: Record<string, any>;
  };
  jwt?: string;
}): Promise<{ actions: QuestionAction[] }> {
  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    } as TMSErrorResponse;
  }

  const { subscriptionId, pageId, answers } = options.data;

  // Get subscription
  const subscription = mockDataStore.getSubscription(subscriptionId);
  if (!subscription) {
    throw {
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    } as TMSErrorResponse;
  }

  // Mock conditional logic - in real implementation, this would be configured per assessment
  const actions: QuestionAction[] = [];

  // Example: If team size is greater than 10, show additional questions
  if (answers['tmp-q1'] && parseInt(answers['tmp-q1']) > 3) {
    actions.push({
      questionId: 'tmp-q3',
      action: 'require',
      condition: {
        questionId: 'tmp-q1',
        operator: 'greaterThan',
        value: 3
      }
    });
  }

  // Example: If communication is ineffective, show follow-up questions
  if (answers['tmp-q3'] === 'Ineffectively' || answers['tmp-q3'] === 'Very Ineffectively') {
    actions.push({
      questionId: 'tmp-q4',
      action: 'show',
      condition: {
        questionId: 'tmp-q3',
        operator: 'equals',
        value: 'Ineffectively'
      }
    });
  }

  return { actions };
}

/**
 * GET /Question/GetQuestionIdsThatHaveActions/{pageId}
 * Get questions with conditional logic on a page
 */
export async function getQuestionIdsWithActions(options: {
  endpoint: string;
  jwt?: string;
}): Promise<{ questionIds: string[] }> {
  // Parse endpoint to extract pageId
  const parts = options.endpoint.split('/');
  const pageId = parts[parts.length - 1];

  if (!pageId) {
    throw {
      error: 'INVALID_PARAMETERS',
      message: 'pageId is required'
    } as TMSErrorResponse;
  }

  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    } as TMSErrorResponse;
  }

  // Mock data - return questions that have conditional logic
  // In real implementation, this would be based on assessment configuration
  const questionsWithActions: Record<string, string[]> = {
    'tmp-page-1': ['tmp-q1'],
    'tmp-page-2': ['tmp-q3'],
    'qo2-page-1': [],
    // Add more pages as needed
  };

  const questionIds = questionsWithActions[pageId] || [];

  return { questionIds };
}