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

    describe('Password-less Authentication', () => {
      const validApiKey = 'mock-api-key-12345';

      it('should create organization with Clerk ID', async () => {
        const signupData = {
          Email: 'clerk@example.com',
          FirstName: 'Clerk',
          LastName: 'User',
          OrganizationName: 'Clerk Org',
          ClerkUserId: 'clerk_user_123'
        };

        const response = await mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/signup',
          data: signupData
        });

        expect(response).toHaveProperty('token');
        expect(response).toHaveProperty('userId');
        expect(response).toHaveProperty('userType', 'Facilitator');
        
        // Verify user was created with Clerk ID
        const user = mockDataStore.getUserByEmail('clerk@example.com');
        expect(user).toBeDefined();
        expect(user?.clerkUserId).toBe('clerk_user_123');
        expect(user?.authSource).toBe('clerk');
        expect(user?.password).toBeUndefined();
      });

      it('should create respondent without password', async () => {
        const org = mockDataStore.createOrganization('Test Org', '');
        
        const response = await mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/create-respondent',
          headers: { 'x-api-key': validApiKey },
          data: {
            email: 'respondent@example.com',
            firstName: 'Test',
            lastName: 'Respondent',
            organizationId: org.id,
            clerkUserId: 'clerk_resp_123',
            userType: 'Respondent'
          }
        });

        expect(response).toHaveProperty('token');
        expect(response).toHaveProperty('userType', 'Respondent');
        
        const user = mockDataStore.getUserByClerkId('clerk_resp_123');
        expect(user).toBeDefined();
        expect(user?.password).toBeUndefined();
      });

      it('should create facilitator without password', async () => {
        const org = mockDataStore.createOrganization('Test Org', '');
        
        const response = await mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/create-facilitator',
          headers: { 'x-api-key': validApiKey },
          data: {
            email: 'facilitator2@example.com',
            firstName: 'Test',
            lastName: 'Facilitator',
            organizationId: org.id,
            clerkUserId: 'clerk_fac_123',
            userType: 'Facilitator'
          }
        });

        expect(response).toHaveProperty('token');
        expect(response).toHaveProperty('userType', 'Facilitator');
      });

      it('should exchange Clerk ID for JWT token', async () => {
        // First create a user with Clerk ID
        const org = mockDataStore.createOrganization('Test Org', '');
        mockDataStore.createUser({
          email: 'exchange@example.com',
          firstName: 'Exchange',
          lastName: 'User',
          userType: 'Facilitator',
          organizationId: org.id,
          clerkUserId: 'clerk_exchange_123'
        });

        const response = await mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/token-exchange',
          headers: { 'x-api-key': validApiKey },
          data: {
            clerkUserId: 'clerk_exchange_123'
          }
        });

        expect(response).toHaveProperty('token');
        expect(response).toHaveProperty('email', 'exchange@example.com');
      });

      it('should reject password-less endpoints without API key', async () => {
        await expect(mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/create-respondent',
          data: {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            organizationId: 'org-123',
            clerkUserId: 'clerk_123',
            userType: 'Respondent'
          }
        })).rejects.toMatchObject({
          error: 'UNAUTHORIZED'
        });
      });

      it('should reject login for Clerk users', async () => {
        // Create a Clerk user
        const org = mockDataStore.createOrganization('Test Org', '');
        mockDataStore.createUser({
          email: 'clerkonly@example.com',
          firstName: 'Clerk',
          lastName: 'Only',
          userType: 'Facilitator',
          organizationId: org.id,
          clerkUserId: 'clerk_only_123'
        });

        await expect(mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/login',
          data: {
            Email: 'clerkonly@example.com',
            Password: 'any-password'
          }
        })).rejects.toMatchObject({
          error: 'INVALID_AUTH_METHOD'
        });
      });

      it('should update existing user with Clerk ID', async () => {
        // Create user with password first
        const org = mockDataStore.createOrganization('Test Org', '');
        mockDataStore.createUser({
          email: 'existing@example.com',
          password: 'Test123!',
          firstName: 'Existing',
          lastName: 'User',
          userType: 'Respondent',
          organizationId: org.id
        });

        // Create same user with Clerk ID
        const response = await mockApi.request({
          method: 'POST',
          endpoint: '/api/v1/auth/create-respondent',
          headers: { 'x-api-key': validApiKey },
          data: {
            email: 'existing@example.com',
            firstName: 'Existing',
            lastName: 'User',
            organizationId: org.id,
            clerkUserId: 'clerk_existing_123',
            userType: 'Respondent'
          }
        });

        expect(response).toHaveProperty('token');
        
        // Verify user was updated, not duplicated
        const user = mockDataStore.getUserByEmail('existing@example.com');
        expect(user?.clerkUserId).toBe('clerk_existing_123');
        expect(user?.authSource).toBe('clerk');
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

  // Legacy report endpoints have been removed - see HTML Report Generation tests below

  describe('HTML Report Generation', () => {
    let testUser: any;
    let testOrg: any;
    let jwtToken: string;
    let tmpSubscription: any;
    let qo2Subscription: any;
    let tsSubscription: any;

    beforeEach(async () => {
      // Setup test data
      testOrg = mockDataStore.createOrganization('HTML Report Test Org', '');
      testUser = mockDataStore.createUser({
        email: 'htmlreport@example.com',
        password: 'Test123!',
        firstName: 'HTML',
        lastName: 'Reporter',
        userType: 'Facilitator',
        organizationId: testOrg.id,
        respondentName: 'HTML Test User'
      });

      // Get JWT token
      const loginResponse = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'htmlreport@example.com',
          Password: 'Test123!'
        }
      });
      jwtToken = loginResponse.token;

      // Create test subscriptions for each assessment type
      tmpSubscription = mockDataStore.createSubscription(testUser.id, 'tmp-workflow', testOrg.id);
      qo2Subscription = mockDataStore.createSubscription(testUser.id, 'qo2-workflow', testOrg.id);
      tsSubscription = mockDataStore.createSubscription(testUser.id, 'team-signals-workflow', testOrg.id);
    });

    it('should generate TMP HTML report with embedded graphs', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: tmpSubscription.subscriptionId,
          templateId: '1'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('Team Management Profile');
      expect(response.html).toContain('HTML Test User');
      expect(response.html).toContain('HTML Report Test Org');
      
      // Check for embedded graph URLs
      expect(response.html).toContain('https://api-test.tms.global/GetGraph?CreateTMPQWheel');
      expect(response.html).toContain('https://api-test.tms.global/GetGraph?CreateTMPQPreferenceWheel');
    });

    it('should generate QO2 HTML report with risk orientation graphs', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: qo2Subscription.subscriptionId,
          templateId: '1'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('Opportunities-Obstacles Quotient');
      expect(response.html).toContain('Risk Orientation');
      
      // Check for QO2 specific graphs
      expect(response.html).toContain('https://api-test.tms.global/GetGraph?CreateQO2Model');
    });

    it('should generate Team Signals individual HTML report', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: tsSubscription.subscriptionId,
          templateId: '1'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('Team Signals');
      expect(response.html).toContain('HTML Report Test Org');
      
      // Check for Team Signals wheel graph
      expect(response.html).toContain('https://api-test.tms.global/GetGraph?CreateTeamSignals');
      expect(response.html).toContain('colors=');
    });

    it('should handle graph generation requests', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-graph',
        data: {
          subscriptionId: tmpSubscription.subscriptionId,
          graphType: 'CreateTMPQWheel'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('image');
      expect(response).toHaveProperty('mimeType', 'image/png');
      expect(response).toHaveProperty('graphType', 'CreateTMPQWheel');
      expect(response).toHaveProperty('parameters');
      
      // Check that image is base64 encoded PNG
      expect(response.image).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should generate different graph types', async () => {
      const graphTypes = ['CreateTMPQWheel', 'CreateTMPBar', 'CreateQO2Model', 'CreateTeamSignals'];
      
      for (const graphType of graphTypes) {
        const response = await mockApi.request<any>({
          method: 'POST',
          endpoint: '/api/v1/tms/generate-graph',
          data: {
            subscriptionId: tmpSubscription.subscriptionId,
            graphType: graphType
          },
          jwt: jwtToken
        });

        expect(response).toHaveProperty('graphType', graphType);
        expect(response).toHaveProperty('image');
      }
    });

    it('should return error for invalid graph type', async () => {
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-graph',
        data: {
          subscriptionId: tmpSubscription.subscriptionId,
          graphType: 'InvalidGraphType'
        },
        jwt: jwtToken
      })).rejects.toMatchObject({
        error: 'INVALID_GRAPH_TYPE'
      });
    });

    it('should return error for invalid template ID', async () => {
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: tmpSubscription.subscriptionId,
          templateId: '999' // Invalid template
        },
        jwt: jwtToken
      })).rejects.toMatchObject({
        error: 'INVALID_TEMPLATE'
      });
    });

    it('should use respondent name from user data in reports', async () => {
      // Update user's respondent name
      testUser.respondentName = 'John Test Smith';

      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: tmpSubscription.subscriptionId,
          templateId: '1'
        },
        jwt: jwtToken
      });

      expect(response.html).toContain('John Test Smith');
    });
  });
});