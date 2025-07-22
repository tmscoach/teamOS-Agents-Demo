import { MockTMSAPIClient } from '../mock-api-client';
import { mockDataStore, resetMockDataStore } from '../mock-data-store';
import { workflowStateManager } from '../workflow-state-manager';

describe('Mock TMS API', () => {
  let mockApi: MockTMSAPIClient;

  beforeEach(() => {
    // Reset data store before each test
    resetMockDataStore();
    mockApi = new MockTMSAPIClient();
  });

  describe('Authentication', () => {
    it('should create organization and facilitator account', async () => {
      const signupData = {
        Email: 'test@example.com',
        Password: 'Test123!',
        FirstName: 'John',
        LastName: 'Doe',
        OrganizationName: 'Test Org'
      };

      const response = await mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/auth/signup',
        data: signupData
      });

      expect(response).toHaveProperty('token');
      expect(response).toHaveProperty('userId');
      expect(response).toHaveProperty('userType', 'Facilitator');
      expect(response).toHaveProperty('email', 'test@example.com');
    });

    it('should login with valid credentials', async () => {
      // First create a user
      const user = mockDataStore.createUser({
        email: 'login@example.com',
        password: 'Test123!',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'Facilitator',
        organizationId: 'org-test'
      });

      const response = await mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'login@example.com',
          Password: 'Test123!'
        }
      });

      expect(response).toHaveProperty('token');
      expect(response).toHaveProperty('email', 'login@example.com');
    });

    it('should reject invalid credentials', async () => {
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'invalid@example.com',
          Password: 'wrong'
        }
      })).rejects.toMatchObject({
        error: 'INVALID_CREDENTIALS'
      });
    });

    it('should validate JWT token', async () => {
      // Create user and get token
      const org = mockDataStore.createOrganization('Test Org', '');
      const user = mockDataStore.createUser({
        email: 'validate@example.com',
        password: 'Test123!',
        firstName: 'Val',
        lastName: 'User',
        userType: 'Facilitator',
        organizationId: org.id
      });

      const loginResponse = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'validate@example.com',
          Password: 'Test123!'
        }
      });

      const validateResponse = await mockApi.request({
        method: 'GET',
        endpoint: '/api/v1/team-os/auth/validate',
        jwt: loginResponse.token
      });

      expect(validateResponse).toMatchObject({
        valid: true,
        userId: user.id,
        userType: 'Facilitator'
      });
    });
  });

  describe('Workflow Management', () => {
    let testUser: any;
    let testOrg: any;
    let jwtToken: string;

    beforeEach(async () => {
      // Setup test data
      testOrg = mockDataStore.createOrganization('Test Org', '');
      testUser = mockDataStore.createUser({
        email: 'workflow@example.com',
        password: 'Test123!',
        firstName: 'Work',
        lastName: 'Flow',
        userType: 'Facilitator',
        organizationId: testOrg.id
      });

      // Get JWT token
      const loginResponse = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'workflow@example.com',
          Password: 'Test123!'
        }
      });
      jwtToken = loginResponse.token;

      // Create test subscription
      mockDataStore.createSubscription(testUser.id, 'tmp-workflow', testOrg.id);
    });

    it('should get workflow process page', async () => {
      const subscription = mockDataStore.getUserSubscriptions(testUser.id)[0];
      
      const response = await mockApi.request<any>({
        method: 'GET',
        endpoint: `/Workflow/Process/${subscription.subscriptionId}/3/2/2`,
        jwt: jwtToken
      });

      expect(response).toHaveProperty('PageID', 2);
      expect(response).toHaveProperty('Questions');
      expect(response.Questions).toBeInstanceOf(Array);
      expect(response.Questions.length).toBeGreaterThan(0);
      
      // Check for seesaw questions
      const seesawQuestion = response.Questions.find((q: any) => q.Type === 18);
      expect(seesawQuestion).toBeDefined();
      expect(seesawQuestion).toHaveProperty('StatementA');
      expect(seesawQuestion).toHaveProperty('StatementB');
    });

    it('should update workflow with answers', async () => {
      const subscription = mockDataStore.getUserSubscriptions(testUser.id)[0];
      
      const response = await mockApi.request({
        method: 'POST',
        endpoint: '/Workflow/Update',
        data: {
          subscriptionID: subscription.subscriptionId,  // Keep as string
          pageID: 2,
          questions: [
            { questionID: 20, value: "20" },
            { questionID: 21, value: "12" }
          ]
        },
        jwt: jwtToken
      });

      expect(response).toBe(true);
    });

    it('should start workflow', async () => {
      const subscription = mockDataStore.getUserSubscriptions(testUser.id)[0];
      
      const response = await mockApi.request<any>({
        method: 'GET',
        endpoint: `/Workflow/Start/tmp-workflow/${subscription.subscriptionId}`,
        jwt: jwtToken
      });

      expect(response).toMatchObject({
        success: true,
        firstPageUrl: expect.stringContaining('/Workflow/Process/')
      });
    });
  });

  describe('Dashboard Subscriptions', () => {
    it('should get facilitator subscriptions', async () => {
      // Create test data
      const org = mockDataStore.createOrganization('Test Org', '');
      const facilitator = mockDataStore.createUser({
        email: 'facilitator@test.com',
        password: 'Test123!',
        firstName: 'Fac',
        lastName: 'User',
        userType: 'Facilitator',
        organizationId: org.id
      });

      // Create subscriptions
      mockDataStore.createSubscription(facilitator.id, 'tmp-workflow', org.id);
      mockDataStore.createSubscription(facilitator.id, 'qo2-workflow', org.id);

      // Login
      const loginResponse = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'facilitator@test.com',
          Password: 'Test123!'
        }
      });

      // Get subscriptions
      const response = await mockApi.request<any>({
        method: 'GET',
        endpoint: '/Respondent/GetDashboardSubscription',
        jwt: loginResponse.token
      });

      expect(response).toBeInstanceOf(Array);
      expect(response.length).toBe(2);
      expect(response[0]).toHaveProperty('SubscriptionID');
      expect(response[0]).toHaveProperty('WorkflowType');
      expect(response[0]).toHaveProperty('Status');
    });
  });

  describe('Workflow State Management', () => {
    it('should maintain state across pages', () => {
      const subscriptionId = 'test-sub-123';
      
      // Initialize workflow state
      const state = workflowStateManager.getOrCreateWorkflowState(
        subscriptionId,
        'tmp-workflow'
      );

      expect(state.currentPageId).toBe(2); // First page
      expect(state.completionPercentage).toBe(0);

      // Update with answers
      workflowStateManager.updateWorkflowState(
        subscriptionId,
        2,
        [
          { questionID: 20, value: "20" },
          { questionID: 21, value: "12" }
        ]
      );

      const updatedState = workflowStateManager.getOrCreateWorkflowState(
        subscriptionId,
        'tmp-workflow'
      );

      expect(updatedState.answers[20]).toBe("20");
      expect(updatedState.answers[21]).toBe("12");
    });

    it('should calculate navigation info correctly', () => {
      const subscriptionId = 'nav-test-123';
      
      workflowStateManager.getOrCreateWorkflowState(
        subscriptionId,
        'tmp-workflow'
      );

      const navInfo = workflowStateManager.getNavigationInfo(subscriptionId);

      expect(navInfo.currentPageId).toBe(2);
      expect(navInfo.nextPageId).toBe(3);
      expect(navInfo.canGoForward).toBe(true);
      expect(navInfo.canGoBack).toBe(false); // First page
    });
  });

  describe('Report Generation', () => {
    let testUser: any;
    let testOrg: any;
    let jwtToken: string;
    let subscription: any;

    beforeEach(async () => {
      // Setup test data
      testOrg = mockDataStore.createOrganization('Report Test Org', '');
      testUser = mockDataStore.createUser({
        email: 'report@example.com',
        password: 'Test123!',
        firstName: 'Report',
        lastName: 'User',
        userType: 'Facilitator',
        organizationId: testOrg.id
      });

      // Get JWT token
      const loginResponse = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'report@example.com',
          Password: 'Test123!'
        }
      });
      jwtToken = loginResponse.token;

      // Create test subscription
      subscription = mockDataStore.createSubscription(testUser.id, 'tmp-workflow', testOrg.id);
      
      // Add some answers to workflow state
      workflowStateManager.updateWorkflowState(
        subscription.subscriptionId,
        2,
        [
          { questionID: 20, value: "30" },
          { questionID: 21, value: "12" },
          { questionID: 22, value: "21" },
          { questionID: 23, value: "03" },
          { questionID: 24, value: "20" }
        ]
      );
    });

    it('should get report summary for completed assessment', async () => {
      const response = await mockApi.request<any>({
        method: 'GET',
        endpoint: `/api/v1/workflow/report-summary/${subscription.subscriptionId}`,
        jwt: jwtToken
      });

      expect(response).toHaveProperty('subscriptionId', subscription.subscriptionId);
      expect(response).toHaveProperty('assessmentType', 'TMP');
      expect(response).toHaveProperty('completedDate');
      expect(response).toHaveProperty('scores');
      expect(response).toHaveProperty('insights');
      expect(response).toHaveProperty('recommendations');
      expect(response).toHaveProperty('htmlContent');
      
      // Check that scores are calculated
      expect(Object.keys(response.scores).length).toBeGreaterThan(0);
      expect(response.insights.length).toBeGreaterThan(0);
      expect(response.recommendations.length).toBeGreaterThan(0);
    });

    it('should get available report templates', async () => {
      const response = await mockApi.request<any>({
        method: 'GET',
        endpoint: `/api/v1/workflow/report-templates/${subscription.subscriptionId}`,
        jwt: jwtToken
      });

      expect(response).toBeInstanceOf(Array);
      expect(response.length).toBeGreaterThan(0);
      
      const template = response[0];
      expect(template).toHaveProperty('templateId');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('format');
      expect(template).toHaveProperty('assessmentType', 'TMP');
      expect(template).toHaveProperty('sections');
    });

    it('should generate subscription report', async () => {
      // First get templates
      const templates = await mockApi.request<any>({
        method: 'GET',
        endpoint: `/api/v1/workflow/report-templates/${subscription.subscriptionId}`,
        jwt: jwtToken
      });

      const templateId = templates[0].templateId;

      // Generate report
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/workflow/generate-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          templateId: templateId
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('reportId');
      expect(response).toHaveProperty('reportUrl');
      expect(response).toHaveProperty('status', 'completed');
      expect(response.reportUrl).toContain('tmp');
      expect(response.reportUrl).toContain('.pdf');
    });

    it('should restrict report access for respondents', async () => {
      // Create another user's subscription
      const otherUser = mockDataStore.createUser({
        email: 'other@example.com',
        password: 'Test123!',
        firstName: 'Other',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: testOrg.id
      });

      const otherSubscription = mockDataStore.createSubscription(otherUser.id, 'qo2-workflow', testOrg.id);

      // Try to access another user's report as respondent
      await expect(mockApi.request({
        method: 'GET',
        endpoint: `/api/v1/workflow/report-summary/${otherSubscription.subscriptionId}`,
        jwt: jwtToken // Using facilitator token
      })).resolves.toBeTruthy(); // Facilitator can see all org reports

      // Login as respondent
      const respondentLogin = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'other@example.com',
          Password: 'Test123!'
        }
      });

      // Respondent can't see other user's report
      await expect(mockApi.request({
        method: 'GET',
        endpoint: `/api/v1/workflow/report-summary/${subscription.subscriptionId}`,
        jwt: respondentLogin.token
      })).rejects.toMatchObject({
        error: 'ACCESS_DENIED'
      });
    });
  });
});