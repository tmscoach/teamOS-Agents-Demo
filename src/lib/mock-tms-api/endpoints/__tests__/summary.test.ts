/**
 * Tests for HTML Summary Endpoint
 */

import { getHTMLSummary } from '../reports';
import { mockDataStore, resetMockDataStore, type MockSubscription } from '../../mock-data-store';
import { WorkflowStateManager } from '../../workflow-state-manager';
import { mockTMSClient } from '../../mock-api-client';

// Mock the summary generator module
jest.mock('../../summary-generators', () => ({
  generateHTMLSummary: jest.fn().mockImplementation((subscription: MockSubscription, templateId: string) => {
    if (subscription.assessmentType === 'TMP') {
      return '<h3>Profile Summary</h3><table class="table backgroundWhite"><tbody><tr><td style="vertical-align:top" width="350"><img id="advancedImg" src="https://api-test.tms.global/GetGraph?CreateTMPQWheel&amp;mr=8&amp;rr1=7&amp;rr2=5&amp;clear=yes" class="pull-left" style=";max-width:300px;max-height:300px;width:100%"></td><td style="vertical-align:center"><table class="table backgroundWhite"><tbody><tr><td><b>Major Role:</b></td><td>Upholder Maintainer</td></tr><tr><td><b>1st Related Role:</b></td><td>Controller Inspector</td></tr><tr><td><b>2nd Related Role:</b></td><td>Thruster Organiser</td></tr><tr><td><b>Net Scores:</b></td><td>I:7 C:3 B:5 S:9</td></tr></tbody></table></td></tr></tbody></table>';
    } else if (subscription.assessmentType === 'QO2') {
      return '<h3>QO2 Summary</h3><table class="table backgroundWhite"><tbody><tr><td style="vertical-align:top" width="350"><img src="https://api-test.tms.global/GetGraph?CreateQO2Model&amp;gva=38&amp;pav=33&amp;ov=48&amp;tv=70&amp;povn=53&amp;enq=0.9&amp;clear=yes" class="pull-left" style="max-width:300px;max-height:300px;width:100%"></td><td style="vertical-align:center"><table class="table backgroundWhite"><tbody><tr><td><b>Opportunity Score:</b></td><td>65%</td></tr><tr><td><b>Obstacle Score:</b></td><td>35%</td></tr><tr><td><b>Overall QO2:</b></td><td>1.86</td></tr><tr><td><b>Primary Focus:</b></td><td>Opportunity-Focused</td></tr></tbody></table></td></tr></tbody></table>';
    }
    return '<div>Test Summary</div>';
  })
}));

// Mock the report context service
jest.mock('../../services/report-context-service', () => ({
  ReportContextService: class {
    async storeReportContext() {
      return { success: true };
    }
  }
}));

describe('GetHTMLSummary Endpoint', () => {
  beforeEach(() => {
    resetMockDataStore();
    jest.clearAllMocks();
  });

  it('should throw UNAUTHORIZED when no JWT is provided', async () => {
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21989'
      // No jwt provided
    };

    await expect(getHTMLSummary(options)).rejects.toMatchObject({
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  });

  it('should throw NOT_FOUND when subscription does not exist', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIlVzZXJUeXBlIjoiUmVzcG9uZGVudCJ9.test';
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/non-existent',
      jwt
    };

    await expect(getHTMLSummary(options)).rejects.toMatchObject({
      error: 'INVALID_REQUEST',
      message: 'Invalid endpoint format'
    });
  });

  it('should throw FORBIDDEN when subscription is not completed', async () => {
    const userId = 'user-123';
    const orgId = 'org-456';
    const jwt = mockTMSClient.generateJWT({
      sub: userId,
      UserType: 'Respondent'
    });
    
    mockDataStore.users.set(userId, {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      organizationId: orgId,
      userType: 'Respondent'
    } as any);
    
    // Create an incomplete subscription
    const subscription: MockSubscription = {
      subscriptionId: '21989',
      userId,
      organizationId: orgId,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'active', // Not completed
      completionPercentage: 50,
      assignedDate: new Date(),
      baseContentId: 3,
      currentPageId: 2
    };
    
    mockDataStore.subscriptions.set('21989', subscription);
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21989',
      jwt
    };

    await expect(getHTMLSummary(options)).rejects.toMatchObject({
      error: 'ASSESSMENT_NOT_COMPLETE',
      message: 'Assessment must be completed to generate summary'
    });
  });

  it('should successfully generate TMP summary for completed subscription', async () => {
    const userId = 'user-123';
    const orgId = 'org-456';
    const jwt = mockTMSClient.generateJWT({
      sub: userId,
      UserType: 'Respondent'
    });
    
    mockDataStore.users.set(userId, {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      organizationId: orgId,
      userType: 'Respondent'
    } as any);
    
    // Create a completed TMP subscription
    const subscription: MockSubscription = {
      subscriptionId: '21989',
      userId,
      organizationId: orgId,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-20'),
      baseContentId: 3,
      currentPageId: 2
    };
    
    mockDataStore.subscriptions.set('21989', subscription);
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21989',
      jwt
    };

    const htmlContent = await getHTMLSummary(options);
    
    // Verify it's valid HTML with expected content
    expect(htmlContent).toContain('<h3>Profile Summary</h3>');
    expect(htmlContent).toContain('Upholder Maintainer');
    expect(htmlContent).toContain('Controller Inspector');
    expect(htmlContent).toContain('Thruster Organiser');
    expect(htmlContent).toContain('I:7 C:3 B:5 S:9');
    expect(htmlContent).toContain('https://api-test.tms.global/GetGraph?CreateTMPQWheel');
  });

  it('should successfully generate QO2 summary for completed subscription', async () => {
    const userId = 'user-123';
    const orgId = 'org-456';
    const jwt = mockTMSClient.generateJWT({
      sub: userId,
      UserType: 'Respondent'
    });
    
    mockDataStore.users.set(userId, {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      organizationId: orgId,
      userType: 'Respondent'
    } as any);
    
    // Create a completed QO2 subscription
    const subscription: MockSubscription = {
      subscriptionId: '21983',
      userId,
      organizationId: orgId,
      workflowId: 'qo2-workflow',
      workflowName: 'Opportunities-Obstacles Quotient',
      assessmentType: 'QO2',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-21'),
      baseContentId: 5,
      currentPageId: 408
    };
    
    mockDataStore.subscriptions.set('21983', subscription);
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21983',
      jwt
    };

    const htmlContent = await getHTMLSummary(options);
    
    // Verify it's valid HTML with expected content
    expect(htmlContent).toContain('<h3>QO2 Summary</h3>');
    expect(htmlContent).toContain('Opportunity Score');
    expect(htmlContent).toContain('65%');
    expect(htmlContent).toContain('Obstacle Score');
    expect(htmlContent).toContain('35%');
    expect(htmlContent).toContain('https://api-test.tms.global/GetGraph?CreateQO2Model');
  });

  it('should handle template ID parameter', async () => {
    const userId = 'user-123';
    const orgId = 'org-456';
    const jwt = mockTMSClient.generateJWT({
      sub: userId,
      UserType: 'Respondent'
    });
    
    mockDataStore.users.set(userId, {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      organizationId: orgId,
      userType: 'Respondent'
    } as any);
    
    const subscription: MockSubscription = {
      subscriptionId: '21989',
      userId,
      organizationId: orgId,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-20'),
      baseContentId: 3,
      currentPageId: 2
    };
    
    mockDataStore.subscriptions.set('21989', subscription);
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21989?templateId=7',
      jwt
    };

    const htmlContent = await getHTMLSummary(options);
    expect(htmlContent).toContain('Profile Summary');
  });

  it('should return HTML fragment without wrapping HTML tags', async () => {
    const userId = 'user-123';
    const orgId = 'org-456';
    const jwt = mockTMSClient.generateJWT({
      sub: userId,
      UserType: 'Respondent'
    });
    
    mockDataStore.users.set(userId, {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      organizationId: orgId,
      userType: 'Respondent'
    } as any);
    
    const subscription: MockSubscription = {
      subscriptionId: '21989',
      userId,
      organizationId: orgId,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-20'),
      baseContentId: 3,
      currentPageId: 2
    };
    
    mockDataStore.subscriptions.set('21989', subscription);
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21989',
      jwt
    };

    const htmlContent = await getHTMLSummary(options);
    
    // Should not contain HTML document structure
    expect(htmlContent).not.toContain('<!DOCTYPE');
    expect(htmlContent).not.toContain('<html');
    expect(htmlContent).not.toContain('<head>');
    expect(htmlContent).not.toContain('<body>');
    
    // Should start with the summary content directly
    expect(htmlContent.trim()).toMatch(/^<h3>Profile Summary<\/h3>/);
  });

  it('should use HTML entities in image URLs', async () => {
    const userId = 'user-123';
    const orgId = 'org-456';
    const jwt = mockTMSClient.generateJWT({
      sub: userId,
      UserType: 'Respondent'
    });
    
    mockDataStore.users.set(userId, {
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      organizationId: orgId,
      userType: 'Respondent'
    } as any);
    
    const subscription: MockSubscription = {
      subscriptionId: '21989',
      userId,
      organizationId: orgId,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-20'),
      baseContentId: 3,
      currentPageId: 2
    };
    
    mockDataStore.subscriptions.set('21989', subscription);
    
    const options = {
      endpoint: '/PageContent/GetSubscriptionSummary/21989',
      jwt
    };

    const htmlContent = await getHTMLSummary(options);
    
    // Check that URLs use &amp; instead of &
    expect(htmlContent).toContain('&amp;mr=');
    expect(htmlContent).toContain('&amp;rr1=');
    expect(htmlContent).toContain('&amp;rr2=');
    expect(htmlContent).toContain('&amp;clear=yes');
  });
});