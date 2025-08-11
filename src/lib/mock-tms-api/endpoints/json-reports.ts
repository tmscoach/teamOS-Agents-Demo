/**
 * Mock TMS JSON Report Endpoints
 * Implements v2 API for structured JSON report retrieval
 */

import { TMSErrorResponse } from '../types';
import { mockDataStore } from '../mock-data-store';
import { mockTMSClient } from '../mock-api-client';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GET /api/v2/reports/{subscriptionId}
 * Retrieve structured JSON report for completed assessment
 */
export async function getJSONReport(options: {
  endpoint: string;
  jwt?: string;
}): Promise<any> {
  // Extract subscriptionId from endpoint
  const pathMatch = options.endpoint.match(/\/api\/v2\/reports\/(\d+)/);
  if (!pathMatch) {
    throw {
      error: 'INVALID_REQUEST',
      message: 'Invalid endpoint format'
    } as TMSErrorResponse;
  }

  const subscriptionId = pathMatch[1];

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

  // Check access - either the user owns the subscription or is a facilitator in the same org
  const user = mockDataStore.getUserByToken(options.jwt);
  if (!user) {
    throw {
      error: 'USER_NOT_FOUND',
      message: 'User not found'
    } as TMSErrorResponse;
  }

  const hasAccess = subscription.userId === user.id || 
    (user.userType === 'Facilitator' && user.organizationId === subscription.organizationId);

  if (!hasAccess) {
    throw {
      error: 'ACCESS_DENIED',
      message: 'You do not have access to this subscription'
    } as TMSErrorResponse;
  }

  // Check if subscription is completed
  if (subscription.status !== 'completed') {
    throw {
      error: 'ASSESSMENT_NOT_COMPLETE',
      message: 'Assessment must be completed to retrieve report'
    } as TMSErrorResponse;
  }

  // Load the JSON template
  try {
    const templatePath = path.join(
      process.cwd(),
      'docs/tms-api-spec/examples/tmp-report-response-complete.json'
    );
    
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = JSON.parse(templateContent);

    // Customize the template with actual subscription data
    const reportData = template.data;
    
    // Update with actual subscription data
    reportData.subscriptionId = subscriptionId;
    reportData.workflowType = mapAssessmentTypeToWorkflow(subscription.assessmentType);
    reportData.userId = subscription.userId;
    reportData.completedAt = subscription.completedAt || new Date().toISOString();
    
    // Update metadata with user info
    if (reportData.metadata) {
      reportData.metadata.userName = `${user.firstName} ${user.lastName}`;
      reportData.metadata.organizationName = mockDataStore.getOrganization(subscription.organizationId)?.name || 'Unknown Organization';
      reportData.metadata.reportType = subscription.assessmentType;
    }

    // Generate unique reportId
    reportData.reportId = `rpt_${reportData.workflowType.toLowerCase()}_${subscriptionId}`;

    // For different assessment types, adjust the sections
    if (subscription.assessmentType === 'QO2') {
      reportData.sections = generateQO2Sections(subscriptionId);
    } else if (subscription.assessmentType === 'TeamSignals') {
      reportData.sections = generateTeamSignalsSections(subscriptionId);
    }
    // Otherwise use the TMP template sections as-is

    return {
      success: true,
      data: reportData
    };
  } catch (error) {
    console.error('Failed to load JSON report template:', error);
    throw {
      error: 'INTERNAL_ERROR',
      message: 'Failed to generate JSON report',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as TMSErrorResponse;
  }
}

/**
 * Map assessment type to workflow type
 */
function mapAssessmentTypeToWorkflow(assessmentType: string): string {
  const mapping: Record<string, string> = {
    'TMP': 'TMP',
    'QO2': 'QO2',
    'TeamSignals': 'TeamSignals',
    'WOW': 'WoW',
    'LLP': 'LLP'
  };
  return mapping[assessmentType] || assessmentType;
}

/**
 * Generate QO2-specific sections
 */
function generateQO2Sections(subscriptionId: string): any[] {
  return [
    {
      id: 'qo2-overview',
      type: 'visual',
      title: 'QO2 Model Overview',
      order: 1,
      visualization: {
        type: 'CreateQO2Model',
        params: {
          gva: '38',
          pav: '33',
          ov: '48',
          tv: '70'
        }
      },
      content: null,
      vectorChunk: 'QO2 Model showing Getting Value Added 38%, People Added Value 33%, Operational Value 48%, Team Value 70%'
    },
    {
      id: 'qo2-analysis',
      type: 'content',
      title: 'QO2 Analysis',
      order: 2,
      content: {
        text: 'Your QO2 assessment reveals a balanced approach to organizational performance with strong team value orientation.',
        subsections: [
          {
            title: 'Getting Value Added',
            content: 'Score of 38% indicates moderate focus on strategic value creation and innovation.'
          },
          {
            title: 'People Added Value',
            content: 'Score of 33% suggests opportunities to enhance people development and engagement.'
          }
        ]
      },
      vectorChunk: 'QO2 Analysis showing balanced organizational performance with team value strength'
    }
  ];
}

/**
 * Generate Team Signals-specific sections
 */
function generateTeamSignalsSections(subscriptionId: string): any[] {
  return [
    {
      id: 'team-signals-overview',
      type: 'visual',
      title: 'Team Signals Overview',
      order: 1,
      visualization: {
        type: 'CreateTeamSignals',
        params: {
          colors: 'amber|red|green|amber|red|red|amber|green'
        }
      },
      content: null,
      vectorChunk: 'Team Signals showing 8 development areas with mixed performance indicators'
    },
    {
      id: 'team-development',
      type: 'content',
      title: 'Team Development Areas',
      order: 2,
      content: {
        text: 'Your Team Signals assessment identifies key areas for team development and collaboration.',
        subsections: [
          {
            title: 'Strengths',
            content: 'Strong performance in areas 3 and 8 showing effective team dynamics.'
          },
          {
            title: 'Development Areas',
            content: 'Areas 2, 5, and 6 require focused attention for improvement.'
          }
        ]
      },
      vectorChunk: 'Team development analysis highlighting collaboration strengths and improvement areas'
    }
  ];
}