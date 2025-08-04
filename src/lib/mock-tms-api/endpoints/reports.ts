/**
 * Mock TMS Report Endpoints
 * Simulates TMS Global custom report generation endpoints
 */

import { mockDataStore } from '../mock-data-store';
import { mockTMSClient, MockTMSAPIClient } from '../mock-api-client';
import { 
  TMSGenerateReportRequest,
  TMSProductUsage,
  TMSErrorResponse
} from '../types';
import { generateHTMLReport as generateHTMLReportContent } from '../report-generators';
import { reportContextService } from '../services/report-context-service';

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

/**
 * GET /Report/GetSummary/{subscriptionId}
 * Get HTML summary for a specific assessment
 */
export async function getHTMLSummary(options: {
  endpoint: string;
  jwt?: string;
}): Promise<string> {
  // Extract path parameters
  const pathMatch = options.endpoint.match(/\/Report\/GetSummary\/(\d+)/);
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
      message: 'Assessment must be completed to generate summary'
    } as TMSErrorResponse;
  }

  // Generate HTML summary based on assessment type
  const { generateHTMLSummary } = await import('../summary-generators');
  const htmlSummary = await generateHTMLSummary(subscription, '6'); // Default template ID
  
  return htmlSummary;
}

/**
 * GET /Subscription/GetHTMLView/{templateId}/{subscriptionId}
 * Get HTML report for a specific assessment
 */
export async function getHTMLReport(options: {
  endpoint: string;
  jwt?: string;
}): Promise<string> {
  // Extract path parameters
  const pathMatch = options.endpoint.match(/\/Subscription\/GetHTMLView\/(\d+)\/(\d+)/);
  if (!pathMatch) {
    throw {
      error: 'INVALID_REQUEST',
      message: 'Invalid endpoint format'
    } as TMSErrorResponse;
  }

  const templateId = pathMatch[1];
  const subscriptionId = pathMatch[2];

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

  // Generate HTML report based on assessment type
  const { generateHTMLReport } = await import('../report-generators');
  const htmlReport = await generateHTMLReport(subscription, templateId);
  
  // Store the report context for debrief functionality
  await reportContextService.storeReportContext(subscriptionId, htmlReport);
  console.log(`[Reports] Stored report context for subscription ${subscriptionId} via GetHTMLView`);

  return htmlReport;
}

/**
 * GET /GetGraph
 * Generate PNG graph/chart for reports
 */
export async function generateGraph(options: {
  endpoint: string;
  jwt?: string;
}): Promise<Buffer> {
  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    } as TMSErrorResponse;
  }

  // For mock implementation, try live API first but always fall back to mock on any error
  try {
    const liveApiUrl = `https://api-test.tms.global${options.endpoint}`;
    console.log('Fetching graph from live API:', liveApiUrl);
    
    const response = await fetch(liveApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.jwt}`,
        'Accept': 'image/png',
      },
    });
    
    if (!response.ok) {
      console.log(`Live API returned ${response.status}, falling back to mock implementation`);
      throw new Error(`Live API error: ${response.status}`);
    }
    
    // Get the image data as a buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error: any) {
    console.log('Live API failed, using mock chart generator:', error.message);
    
    // Fallback to mock implementation
    const url = new URL(options.endpoint, 'https://api.tms.global');
    const queryString = url.search.substring(1);
    
    // Parse chart type and parameters
    const parts = queryString.split('&');
    const chartType = parts[0]; // First parameter is always the chart type
    
    const params: Record<string, string> = {};
    for (let i = 1; i < parts.length; i++) {
      const [key, value] = parts[i].split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }

    console.log(`Generating mock chart for ${chartType} with params:`, params);

    // Generate PNG based on chart type
    const { generateChartPNG } = await import('../chart-generator');
    const pngBuffer = await generateChartPNG(chartType, params);

    return pngBuffer;
  }
}

/**
 * Generate HTML Report Endpoint - New endpoint for TMS API test
 */
export async function generateHTMLReport(options: {
  data: {
    subscriptionId: string;
    templateId: string;
  };
  jwt?: string;
}): Promise<{ html: string }> {
  const { subscriptionId, templateId } = options.data;

  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'AUTH_REQUIRED',
      message: 'Authentication token required'
    };
  }

  const mockClient = new MockTMSAPIClient();
  const claims = mockClient.decodeJWT(options.jwt);
  if (!claims) {
    throw {
      error: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    };
  }

  // Get subscription
  const subscription = mockDataStore.getSubscription(subscriptionId);
  if (!subscription) {
    throw {
      error: 'NOT_FOUND',
      message: 'Subscription not found'
    };
  }

  // Get user
  const user = mockDataStore.getUser(claims.sub);
  if (!user) {
    throw {
      error: 'USER_NOT_FOUND',
      message: 'User not found'
    };
  }

  // Check access control for Team Signals 360
  if ((templateId === '360' || templateId === '3') && subscription.assessmentType === 'TeamSignals') {
    if (user.userType !== 'Facilitator') {
      throw {
        error: 'ACCESS_DENIED',
        message: 'Only facilitators can generate Team Signals 360 reports'
      };
    }
  }

  // Check template validity
  if (templateId === '360' && subscription.assessmentType !== 'TeamSignals') {
    throw {
      error: 'INVALID_TEMPLATE',
      message: 'Template 360 is only available for Team Signals assessments'
    };
  }

  // Check invalid template IDs
  const validTemplates = ['1', '2', '3', '360'];
  if (!validTemplates.includes(templateId)) {
    throw {
      error: 'INVALID_TEMPLATE',
      message: `Invalid template ID: ${templateId}`
    };
  }

  // Generate HTML report
  try {
    const html = await generateHTMLReportContent(subscription, templateId);
    
    // Store the report context for debrief functionality
    await reportContextService.storeReportContext(subscriptionId, html);
    console.log(`[Reports] Stored report context for subscription ${subscriptionId}`);
    
    return { html };
  } catch (error) {
    throw {
      error: 'REPORT_GENERATION_FAILED',
      message: error instanceof Error ? error.message : 'Failed to generate report'
    };
  }
}

/**
 * Generate Graph API Endpoint - New endpoint for TMS API test
 */
export async function generateGraphAPI(options: {
  data: {
    subscriptionId: string;
    graphType: string;
    templateId?: string;
  };
  jwt?: string;
}): Promise<{
  image: string;
  mimeType: string;
  graphType: string;
  parameters: Record<string, any>;
}> {
  const { subscriptionId, graphType, templateId } = options.data;

  // Validate JWT
  if (!options.jwt) {
    throw {
      error: 'AUTH_REQUIRED',
      message: 'Authentication token required'
    };
  }

  // Validate graph type
  const validGraphTypes = ['CreateTMPQWheel', 'CreateTMPBar', 'CreateQO2Model', 'CreateQO2Bar', 'CreateTeamSignals'];
  if (!validGraphTypes.includes(graphType)) {
    throw {
      error: 'INVALID_GRAPH_TYPE',
      message: `Invalid graph type: ${graphType}`
    };
  }

  // Get subscription
  const subscription = mockDataStore.getSubscription(subscriptionId);
  if (!subscription) {
    throw {
      error: 'NOT_FOUND',
      message: 'Subscription not found'
    };
  }

  // Generate appropriate parameters based on graph type and template
  let parameters: Record<string, any> = {};
  
  if (graphType === 'CreateTeamSignals' && (templateId === '360' || templateId === '3')) {
    // For Team Signals 360, aggregate team scores
    const orgSubscriptions = mockDataStore.getAllSubscriptions()
      .filter(s => s.organizationId === subscription.organizationId && 
                   s.assessmentType === 'TeamSignals' &&
                   s.status === 'completed');
    
    // Calculate average scores for each development area
    const avgScores = [56, 33, 75, 62, 38, 44, 56, 62]; // Mock averages
    const colors = avgScores.map(score => {
      if (score >= 75) return 'green';
      if (score >= 50) return 'amber';
      return 'red';
    });
    
    parameters.colors = colors.join('|');
  } else if (graphType === 'CreateTeamSignals') {
    // Individual Team Signals
    parameters.colors = 'amber|red|amber|amber|red|red|amber|amber';
  } else if (graphType === 'CreateTMPQWheel') {
    parameters.mr = 8;
    parameters.rr1 = 7;
    parameters.rr2 = 5;
  } else if (graphType === 'CreateQO2Model') {
    parameters.gva = 38;
    parameters.pav = 33;
    parameters.ov = 48;
    parameters.tv = 70;
    parameters.povn = 53;
    parameters.enq = 0.9;
    parameters.clear = 'yes';
  }

  // Generate mock base64 PNG data
  const mockImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  return {
    image: mockImageData,
    mimeType: 'image/png',
    graphType,
    parameters
  };
}