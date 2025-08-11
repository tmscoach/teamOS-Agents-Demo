/**
 * Tests for JSON Report Endpoint
 */

import { getJSONReport } from '../json-reports';
import { mockDataStore, resetMockDataStore } from '../../mock-data-store';
import { mockTMSClient } from '../../mock-api-client';

describe('JSON Report Endpoint', () => {
  let testOrg: any;
  let testUser: any;
  let testSubscription: any;
  let testToken: string;

  beforeEach(() => {
    // Reset mock data store
    resetMockDataStore();
    
    // Create test organization
    testOrg = mockDataStore.createOrganization('Test Org', 'Technology');
    
    // Create test user
    testUser = mockDataStore.createUser({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      organizationId: testOrg.id,
      userType: 'Respondent'
    });
    
    // Create completed subscription
    testSubscription = mockDataStore.createSubscription(
      testUser.id,
      'tmp-workflow',
      testOrg.id
    );
    
    // Mark it as completed
    testSubscription.status = 'completed';
    testSubscription.completedAt = new Date().toISOString();
    
    // Generate JWT token
    testToken = mockTMSClient.generateJWT({
      sub: testUser.id,
      email: testUser.email,
      UserType: testUser.userType,
      organisationId: testUser.organizationId
    });
  });

  it('should retrieve JSON report for valid subscription', async () => {
    const result = await getJSONReport({
      endpoint: `/api/v2/reports/${testSubscription.subscriptionId}`,
      jwt: testToken
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.subscriptionId).toBe(testSubscription.subscriptionId);
    expect(result.data.workflowType).toBe('TMP');
    expect(result.data.sections).toBeDefined();
    expect(Array.isArray(result.data.sections)).toBe(true);
    expect(result.data.sections.length).toBeGreaterThan(0);
  });

  it('should return error for missing JWT', async () => {
    await expect(getJSONReport({
      endpoint: '/api/v2/reports/12345',
      jwt: undefined
    })).rejects.toMatchObject({
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  });

  it('should return error for invalid subscription', async () => {
    await expect(getJSONReport({
      endpoint: '/api/v2/reports/99999',
      jwt: testToken
    })).rejects.toMatchObject({
      error: 'SUBSCRIPTION_NOT_FOUND',
      message: 'Subscription not found'
    });
  });

  it('should return error for incomplete assessment', async () => {
    // Create incomplete subscription
    const incompleteSub = mockDataStore.createSubscription(
      testUser.id,
      'qo2-workflow',
      testOrg.id
    );
    // Keep it as in_progress (default)
    
    await expect(getJSONReport({
      endpoint: `/api/v2/reports/${incompleteSub.subscriptionId}`,
      jwt: testToken
    })).rejects.toMatchObject({
      error: 'ASSESSMENT_NOT_COMPLETE',
      message: 'Assessment must be completed to retrieve report'
    });
  });

  it('should generate QO2-specific sections', async () => {
    // Create QO2 subscription
    const qo2Sub = mockDataStore.createSubscription(
      testUser.id,
      'qo2-workflow',
      testOrg.id
    );
    qo2Sub.status = 'completed';
    qo2Sub.completedAt = new Date().toISOString();
    
    const result = await getJSONReport({
      endpoint: `/api/v2/reports/${qo2Sub.subscriptionId}`,
      jwt: testToken
    });
    
    expect(result.success).toBe(true);
    expect(result.data.workflowType).toBe('QO2');
    expect(result.data.sections[0].id).toBe('qo2-overview');
    expect(result.data.sections[0].visualization.type).toBe('CreateQO2Model');
  });

  it('should generate Team Signals-specific sections', async () => {
    // Create Team Signals subscription
    const tsSub = mockDataStore.createSubscription(
      testUser.id,
      'team-signals-workflow',
      testOrg.id
    );
    tsSub.status = 'completed';
    tsSub.completedAt = new Date().toISOString();
    
    const result = await getJSONReport({
      endpoint: `/api/v2/reports/${tsSub.subscriptionId}`,
      jwt: testToken
    });
    
    expect(result.success).toBe(true);
    expect(result.data.workflowType).toBe('TeamSignals');
    expect(result.data.sections[0].id).toBe('team-signals-overview');
    expect(result.data.sections[0].visualization.type).toBe('CreateTeamSignals');
  });

  it('should allow facilitator access to team member reports', async () => {
    // Create facilitator
    const facilitator = mockDataStore.createUser({
      email: 'facilitator@example.com',
      password: 'password123',
      firstName: 'Facilitator',
      lastName: 'User',
      organizationId: testOrg.id,
      userType: 'Facilitator'
    });
    
    // Facilitator token
    const facilitatorToken = mockTMSClient.generateJWT({
      sub: facilitator.id,
      email: facilitator.email,
      UserType: facilitator.userType,
      organisationId: facilitator.organizationId
    });
    
    const result = await getJSONReport({
      endpoint: `/api/v2/reports/${testSubscription.subscriptionId}`,
      jwt: facilitatorToken
    });
    
    expect(result.success).toBe(true);
    expect(result.data.subscriptionId).toBe(testSubscription.subscriptionId);
  });

  it('should deny access to reports from different organizations', async () => {
    // Create user from different org
    const otherOrg = mockDataStore.createOrganization('Other Org', 'Finance');
    const otherUser = mockDataStore.createUser({
      email: 'other@example.com',
      password: 'password123',
      firstName: 'Other',
      lastName: 'User',
      organizationId: otherOrg.id,
      userType: 'Respondent'
    });
    
    const otherToken = mockTMSClient.generateJWT({
      sub: otherUser.id,
      email: otherUser.email,
      UserType: otherUser.userType,
      organisationId: otherUser.organizationId
    });
    
    await expect(getJSONReport({
      endpoint: `/api/v2/reports/${testSubscription.subscriptionId}`,
      jwt: otherToken
    })).rejects.toMatchObject({
      error: 'ACCESS_DENIED',
      message: 'You do not have access to this subscription'
    });
  });
});