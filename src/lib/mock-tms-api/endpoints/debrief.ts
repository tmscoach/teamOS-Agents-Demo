/**
 * Mock TMS Debrief Endpoints
 * Provides intelligent report interrogation capabilities
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import { TMSErrorResponse } from '../types';
import { reportContextService } from '../services/report-context-service';
import { generateHTMLReport } from '../report-generators';

interface DebriefReportRequest {
  subscriptionId: string;
  query: string;
  context?: {
    previousMessages?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    sessionId?: string;
  };
}

interface DebriefReportResponse {
  response: string;
  relevantSections: Array<{
    type: 'text' | 'image' | 'score';
    content: any;
    explanation?: string;
  }>;
  suggestedQuestions: string[];
  sessionId?: string;
}

/**
 * POST /api/v1/tms/debrief-report
 * Interactive debrief of assessment report with Q&A capability
 */
export async function debriefReport(options: {
  data: DebriefReportRequest;
  jwt?: string;
}): Promise<DebriefReportResponse> {
  const { subscriptionId, query, context } = options.data;

  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'AUTH_REQUIRED',
      message: 'Authentication token required'
    } as TMSErrorResponse;
  }

  const claims = mockTMSClient.decodeJWT(options.jwt);
  if (!claims) {
    throw {
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    } as TMSErrorResponse;
  }

  // Validate subscription exists
  const subscription = mockDataStore.getSubscription(subscriptionId);
  if (!subscription) {
    throw {
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    } as TMSErrorResponse;
  }

  // Check access permissions
  let user = mockDataStore.getUser(claims.sub);
  
  // If user not found by sub, try other methods
  if (!user) {
    // Try to find by token
    user = mockDataStore.getUserByToken(options.jwt!);
    
    // If still not found, check if the sub is a database user ID
    if (!user && claims.sub.startsWith('cm')) {
      // This looks like a database user ID, find the corresponding mock user
      const allUsers = Array.from(mockDataStore.users.values());
      user = allUsers.find(u => u.clerkUserId && mockDataStore.clerkIdToUser.get(u.clerkUserId) === u.id);
    }
  }
  
  // In mock mode, if user not found but we have a valid JWT, allow access for testing
  if (!user && process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
    console.warn(`[Debrief] User ${claims.sub} not found in mock store, allowing access for testing`);
    // For testing purposes, we'll allow access if the subscription exists
    // This handles cases where the JWT was created dynamically
  } else if (!user) {
    throw {
      error: 'USER_NOT_FOUND',
      message: 'User not found'
    } as TMSErrorResponse;
  } else {
    // Normal access check for existing users
    const hasAccess = subscription.userId === user.id || 
      (user.userType === 'Facilitator' && user.organizationId === subscription.organizationId);

    if (!hasAccess) {
      throw {
        error: 'ACCESS_DENIED',
        message: 'You do not have access to this subscription'
      } as TMSErrorResponse;
    }
  }

  // Check if report context exists
  let reportContext = reportContextService.getReportContext(subscriptionId);
  
  // If no context exists, generate and store the report
  if (!reportContext) {
    // Generate the report HTML
    const htmlReport = await generateHTMLReport(subscription, '1'); // Default template
    
    // Store the report context
    await reportContextService.storeReportContext(subscriptionId, htmlReport);
    
    // Retrieve the stored context
    reportContext = reportContextService.getReportContext(subscriptionId);
  }

  // Query the report with the user's question
  try {
    // Provide default query if empty
    const effectiveQuery = query || 'Please provide an overview of my assessment report';
    const response = await reportContextService.queryReport({
      subscriptionId,
      query: effectiveQuery,
      userId: user?.id || claims.sub,
      conversationContext: context
    });

    // Check if the query was successful
    if (!response.success) {
      throw {
        error: 'QUERY_FAILED',
        message: response.message || 'Failed to process your question',
        details: response
      } as TMSErrorResponse;
    }

    // Add session ID for conversation tracking
    const sessionId = context?.sessionId || `debrief_${subscriptionId}_${Date.now()}`;

    // Remove the success flag from the response since it's internal
    const { success, message, ...debriefResponse } = response;

    return {
      ...debriefResponse,
      sessionId
    };
  } catch (error) {
    console.error('Debrief error:', error);
    
    // If it's already a TMSErrorResponse, re-throw it
    if ((error as any).error && (error as any).message) {
      throw error;
    }
    
    throw {
      error: 'DEBRIEF_FAILED',
      message: 'Failed to process your question. Please try rephrasing.',
      details: error
    } as TMSErrorResponse;
  }
}

/**
 * GET /api/v1/tms/debrief-report/samples
 * Get sample questions for testing
 */
export async function getDebriefSampleQuestions(options: {
  endpoint: string;
  jwt?: string;
}): Promise<{
  assessmentType: string;
  sampleQuestions: string[];
}[]> {
  // Return sample questions for each assessment type
  return [
    {
      assessmentType: 'TMP',
      sampleQuestions: [
        'What does the green section in my TMP wheel represent?',
        'Can you explain what my major role means?',
        'How do I work better with people who have different profiles?',
        'What are the strengths of being an Upholder-Maintainer?',
        'Why is my wheel showing three different sized sections?'
      ]
    },
    {
      assessmentType: 'TeamSignals',
      sampleQuestions: [
        'What do the traffic lights in my report mean?',
        'Why are some areas showing red lights?',
        'How can we improve our team effectiveness scores?',
        'What does "Where are we going?" measure?',
        'Which area should our team focus on first?'
      ]
    },
    {
      assessmentType: 'QO2',
      sampleQuestions: [
        'What does my QO2 score tell me about my mindset?',
        'Why do I see more obstacles than opportunities?',
        'How can I develop a more balanced perspective?',
        'What\'s the ideal opportunities to obstacles ratio?',
        'How does QO2 affect my leadership style?'
      ]
    }
  ];
}