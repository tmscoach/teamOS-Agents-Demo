import { mockDataStore, resetMockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { getDashboardSubscriptions } from '@/src/lib/mock-tms-api/endpoints/subscriptions';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

describe('Dashboard Subscriptions User Lookup', () => {
  beforeEach(() => {
    resetMockDataStore();
  });

  it('should find subscriptions by email when user ID not found', async () => {
    // Create test organization
    const testOrg = mockDataStore.createOrganization('Test Org', '');
    
    // Create user with specific email
    const user = mockDataStore.createUser({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      userType: 'Respondent',
      organizationId: testOrg.id,
      clerkUserId: 'clerk_user_123'
    });
    
    // Create subscription for the user
    mockDataStore.subscriptions.set('sub-123', {
      subscriptionId: 'sub-123',
      userId: user.id,
      organizationId: testOrg.id,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-16'),
      baseContentId: 3,
      currentPageId: 2
    });
    
    // Generate JWT with different user ID but same email
    const jwt = mockTMSClient.generateJWT({
      sub: 'different-user-id',
      UserType: 'Respondent',
      nameid: 'test@example.com',
      organisationId: testOrg.id
    });
    
    // Get subscriptions
    const result = await getDashboardSubscriptions({ jwt });
    
    // Should find subscription by email lookup
    expect(result).toHaveLength(1);
    expect(result[0].SubscriptionID).toBe(0); // parseInt('sub-123') returns 0
    expect(result[0].WorkflowType).toBe('TMP');
    expect(result[0].Status).toBe('Completed');
  });

  it('should find subscriptions by Clerk user ID', async () => {
    // Create test organization
    const testOrg = mockDataStore.createOrganization('Test Org', '');
    
    // Create user with Clerk ID
    const user = mockDataStore.createUser({
      email: 'clerk@example.com',
      firstName: 'Clerk',
      lastName: 'User',
      userType: 'Respondent',
      organizationId: testOrg.id,
      clerkUserId: 'clerk_abc123'
    });
    
    // Create subscription
    mockDataStore.subscriptions.set('sub-456', {
      subscriptionId: 'sub-456',
      userId: user.id,
      organizationId: testOrg.id,
      workflowId: 'qo2-workflow',
      workflowName: 'QO2',
      assessmentType: 'QO2',
      status: 'in_progress',
      completionPercentage: 50,
      assignedDate: new Date('2024-01-20'),
      baseContentId: 5,
      currentPageId: 408
    });
    
    // Generate JWT with Clerk user ID
    const jwt = mockTMSClient.generateJWT({
      sub: 'clerk_abc123',
      UserType: 'Respondent',
      nameid: 'clerk@example.com',
      organisationId: testOrg.id
    });
    
    // Get subscriptions
    const result = await getDashboardSubscriptions({ jwt });
    
    // Should find subscription by Clerk ID lookup
    expect(result).toHaveLength(1);
    expect(result[0].WorkflowType).toBe('QO2');
    expect(result[0].Status).toBe('In Progress');
    expect(result[0].Progress).toBe(50);
  });

  it('should find subscriptions by direct user ID match', async () => {
    // Create test organization
    const testOrg = mockDataStore.createOrganization('Test Org', '');
    
    // Create user
    const user = mockDataStore.createUser({
      email: 'direct@example.com',
      firstName: 'Direct',
      lastName: 'User',
      userType: 'Respondent',
      organizationId: testOrg.id
    });
    
    // Create subscription
    mockDataStore.subscriptions.set('sub-789', {
      subscriptionId: 'sub-789',
      userId: user.id,
      organizationId: testOrg.id,
      workflowId: 'team-signals-workflow',
      workflowName: 'Team Signals',
      assessmentType: 'TeamSignals',
      status: 'not_started',
      completionPercentage: 0,
      assignedDate: new Date('2024-01-25'),
      baseContentId: 12,
      currentPageId: 97
    });
    
    // Generate JWT with exact user ID
    const jwt = mockTMSClient.generateJWT({
      sub: user.id,
      UserType: 'Respondent',
      nameid: 'direct@example.com',
      organisationId: testOrg.id
    });
    
    // Get subscriptions
    const result = await getDashboardSubscriptions({ jwt });
    
    // Should find subscription by direct user ID match
    expect(result).toHaveLength(1);
    expect(result[0].WorkflowType).toBe('TeamSignals');
    expect(result[0].Status).toBe('Not Started');
  });

  it('should allow facilitators to see all org subscriptions', async () => {
    // Create test organization
    const testOrg = mockDataStore.createOrganization('Test Org', '');
    
    // Create facilitator
    const facilitator = mockDataStore.createUser({
      email: 'facilitator@example.com',
      firstName: 'Test',
      lastName: 'Facilitator',
      userType: 'Facilitator',
      organizationId: testOrg.id
    });
    
    // Create multiple users and subscriptions
    const user1 = mockDataStore.createUser({
      email: 'user1@example.com',
      firstName: 'User',
      lastName: 'One',
      userType: 'Respondent',
      organizationId: testOrg.id
    });
    
    const user2 = mockDataStore.createUser({
      email: 'user2@example.com',
      firstName: 'User',
      lastName: 'Two',
      userType: 'Respondent',
      organizationId: testOrg.id
    });
    
    // Create subscriptions for different users
    mockDataStore.subscriptions.set('sub-1', {
      subscriptionId: 'sub-1',
      userId: user1.id,
      organizationId: testOrg.id,
      workflowId: 'tmp-workflow',
      workflowName: 'TMP',
      assessmentType: 'TMP',
      status: 'completed',
      completionPercentage: 100,
      assignedDate: new Date('2024-01-01'),
      completedDate: new Date('2024-01-02')
    });
    
    mockDataStore.subscriptions.set('sub-2', {
      subscriptionId: 'sub-2',
      userId: user2.id,
      organizationId: testOrg.id,
      workflowId: 'qo2-workflow',
      workflowName: 'QO2',
      assessmentType: 'QO2',
      status: 'in_progress',
      completionPercentage: 60,
      assignedDate: new Date('2024-01-05')
    });
    
    // Generate JWT for facilitator
    const jwt = mockTMSClient.generateJWT({
      sub: facilitator.id,
      UserType: 'Facilitator',
      nameid: 'facilitator@example.com',
      organisationId: testOrg.id
    });
    
    // Get subscriptions
    const result = await getDashboardSubscriptions({ jwt });
    
    // Facilitator should see all org subscriptions
    expect(result).toHaveLength(2);
    expect(result.map(s => s.WorkflowType).sort()).toEqual(['QO2', 'TMP']);
  });
});