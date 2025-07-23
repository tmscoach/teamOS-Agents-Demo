import { MockTMSAPIClient } from '../../mock-api-client';
import { mockDataStore, resetMockDataStore } from '../../mock-data-store';
import { reportContextService } from '../../services/report-context-service';

describe('Debrief Endpoints', () => {
  let mockApi: MockTMSAPIClient;
  let facilitator: any;
  let respondent: any;
  let testOrg: any;
  let facilitatorToken: string;
  let respondentToken: string;
  let subscription: any;

  beforeEach(async () => {
    // Reset everything
    resetMockDataStore();
    reportContextService.clearAll();
    mockApi = new MockTMSAPIClient();

    // Setup test data
    testOrg = mockDataStore.createOrganization('Test Team Org', '');
    
    // Create facilitator
    facilitator = mockDataStore.createUser({
      email: 'facilitator@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'Facilitator',
      userType: 'Facilitator',
      organizationId: testOrg.id
    });

    // Create respondent
    respondent = mockDataStore.createUser({
      email: 'respondent@test.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'Respondent',
      userType: 'Respondent',
      organizationId: testOrg.id
    });

    // Get tokens
    const facilitatorLogin = await mockApi.request<any>({
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      data: { Email: 'facilitator@test.com', Password: 'Test123!' }
    });
    facilitatorToken = facilitatorLogin.token;

    const respondentLogin = await mockApi.request<any>({
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      data: { Email: 'respondent@test.com', Password: 'Test123!' }
    });
    respondentToken = respondentLogin.token;

    // Create a subscription
    subscription = mockDataStore.createSubscription(
      respondent.id,
      'tmp-workflow',
      testOrg.id
    );

    // Store a test report
    const testReport = `
      <html>
        <body>
          <h1>Team Management Profile</h1>
          <img src="https://api.tms.global/GetGraph?CreateTMPQWheel&mr=8&rr1=7&rr2=5" />
          <p>Your major role is Upholder-Maintainer</p>
        </body>
      </html>
    `;
    await reportContextService.storeReportContext(subscription.subscriptionId, testReport);
  });

  describe('POST /api/v1/tms/debrief-report', () => {
    it('should successfully debrief a report with user access', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'What does the green section in my wheel represent?'
        },
        jwt: respondentToken
      });

      expect(response).toHaveProperty('response');
      expect(response).toHaveProperty('relevantSections');
      expect(response).toHaveProperty('suggestedQuestions');
      expect(response.response).toContain('Advising');
      expect(response.response).toContain('green');
      expect(response.relevantSections).toBeInstanceOf(Array);
      expect(response.suggestedQuestions).toBeInstanceOf(Array);
      expect(response.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should allow facilitator to access team member reports', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'What are the key findings in this report?'
        },
        jwt: facilitatorToken
      });

      expect(response).toHaveProperty('response');
      expect(response.response).toBeTruthy();
    });

    it('should include session ID in response', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'Tell me about my results',
          context: {
            sessionId: 'test-session-123'
          }
        },
        jwt: respondentToken
      });

      expect(response.sessionId).toBe('test-session-123');
    });

    it('should handle conversation context', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'What else can you tell me?',
          context: {
            previousMessages: [
              { role: 'user', content: 'What does my wheel show?' },
              { role: 'assistant', content: 'Your wheel shows your team role preferences.' }
            ]
          }
        },
        jwt: respondentToken
      });

      expect(response).toHaveProperty('response');
      expect(response.response).toBeTruthy();
    });

    it('should generate report if not already stored', async () => {
      // Create new subscription without stored report
      const newSubscription = mockDataStore.createSubscription(
        respondent.id,
        'qo2-workflow',
        testOrg.id
      );

      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: newSubscription.subscriptionId,
          query: 'What does my QO2 score mean?'
        },
        jwt: respondentToken
      });

      expect(response).toHaveProperty('response');
      expect(response.response).toContain('QO2');
      
      // Verify report was stored
      const storedContext = reportContextService.getReportContext(newSubscription.subscriptionId);
      expect(storedContext).toBeDefined();
    });

    it('should fail without authentication', async () => {
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'Test query'
        }
      })).rejects.toMatchObject({
        error: 'AUTH_REQUIRED',
        message: 'Authentication token required'
      });
    });

    it('should fail with invalid token', async () => {
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'Test query'
        },
        jwt: 'invalid-token'
      })).rejects.toMatchObject({
        error: 'AUTH_TOKEN_EXPIRED'
      });
    });

    it('should fail for non-existent subscription', async () => {
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: 'non-existent',
          query: 'Test query'
        },
        jwt: respondentToken
      })).rejects.toMatchObject({
        error: 'SUBSCRIPTION_NOT_FOUND'
      });
    });

    it('should deny access to other users reports', async () => {
      // Create another user
      const otherUser = mockDataStore.createUser({
        email: 'other@test.com',
        password: 'Test123!',
        firstName: 'Other',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: 'different-org'
      });

      const otherLogin = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: { Email: 'other@test.com', Password: 'Test123!' }
      });

      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/debrief-report',
        data: {
          subscriptionId: subscription.subscriptionId,
          query: 'Test query'
        },
        jwt: otherLogin.token
      })).rejects.toMatchObject({
        error: 'ACCESS_DENIED'
      });
    });
  });

  describe('GET /api/v1/tms/debrief-report/samples', () => {
    it('should return sample questions for all assessment types', async () => {
      const response = await mockApi.request<any>({
        method: 'GET',
        endpoint: '/api/v1/tms/debrief-report/samples'
      });

      expect(response).toBeInstanceOf(Array);
      expect(response.length).toBeGreaterThan(0);
      
      // Check TMP samples
      const tmpSamples = response.find((r: any) => r.assessmentType === 'TMP');
      expect(tmpSamples).toBeDefined();
      expect(tmpSamples.sampleQuestions).toBeInstanceOf(Array);
      expect(tmpSamples.sampleQuestions.length).toBeGreaterThan(0);
      expect(tmpSamples.sampleQuestions).toContain('What does the green section in my TMP wheel represent?');

      // Check Team Signals samples
      const tsSamples = response.find((r: any) => r.assessmentType === 'TeamSignals');
      expect(tsSamples).toBeDefined();
      expect(tsSamples.sampleQuestions).toContain('What do the traffic lights in my report mean?');

      // Check QO2 samples
      const qo2Samples = response.find((r: any) => r.assessmentType === 'QO2');
      expect(qo2Samples).toBeDefined();
      expect(qo2Samples.sampleQuestions).toContain('What does my QO2 score tell me about my mindset?');
    });
  });

  describe('Query intent recognition', () => {
    it('should correctly identify visual element queries', async () => {
      const visualQueries = [
        'What does the wheel show?',
        'Explain the colors in my chart',
        'What is the green section?',
        'Tell me about the graph'
      ];

      for (const query of visualQueries) {
        const response = await mockApi.request<any>({
          method: 'POST',
          endpoint: '/api/v1/tms/debrief-report',
          data: {
            subscriptionId: subscription.subscriptionId,
            query
          },
          jwt: respondentToken
        });

        expect(response.response).toBeTruthy();
        // Visual queries should often include image sections
        if (response.relevantSections.length > 0) {
          const hasImageSection = response.relevantSections.some((s: any) => s.type === 'image');
          expect(hasImageSection).toBe(true);
        }
      }
    });

    it('should correctly identify next steps queries', async () => {
      const actionQueries = [
        'What should I do next?',
        'How can I improve?',
        'What actions should I take?',
        'What should I focus on?'
      ];

      for (const query of actionQueries) {
        const response = await mockApi.request<any>({
          method: 'POST',
          endpoint: '/api/v1/tms/debrief-report',
          data: {
            subscriptionId: subscription.subscriptionId,
            query
          },
          jwt: respondentToken
        });

        expect(response.response).toContain('next steps');
      }
    });
  });
});