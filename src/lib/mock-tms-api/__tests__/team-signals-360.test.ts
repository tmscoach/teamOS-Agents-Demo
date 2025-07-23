import { MockTMSAPIClient } from '../mock-api-client';
import { mockDataStore, resetMockDataStore } from '../mock-data-store';
import { workflowStateManager } from '../workflow-state-manager';

describe('Team Signals 360 Report', () => {
  let mockApi: MockTMSAPIClient;
  let facilitator: any;
  let testOrg: any;
  let jwtToken: string;
  let teamMembers: any[] = [];
  let subscriptions: any[] = [];

  beforeEach(async () => {
    // Reset data store before each test
    resetMockDataStore();
    mockApi = new MockTMSAPIClient();

    // Setup test organization and facilitator
    testOrg = mockDataStore.createOrganization('Test Team Org', '');
    facilitator = mockDataStore.createUser({
      email: 'facilitator@teamtest.com',
      password: 'Test123!',
      firstName: 'Team',
      lastName: 'Manager',
      userType: 'Facilitator',
      organizationId: testOrg.id
    });

    // Get facilitator JWT token
    const loginResponse = await mockApi.request<any>({
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      data: {
        Email: 'facilitator@teamtest.com',
        Password: 'Test123!'
      }
    });
    jwtToken = loginResponse.token;

    // Create team members and their subscriptions
    teamMembers = [];
    subscriptions = [];

    // Create 3 team members with Team Signals subscriptions
    const teamData = [
      { name: 'Alice Johnson', scores: [56, 31, 75, 62, 38, 44, 56, 62] },
      { name: 'Bob Smith', scores: [62, 44, 81, 69, 44, 50, 62, 69] },
      { name: 'Charlie Davis', scores: [50, 25, 69, 56, 31, 38, 50, 56] }
    ];

    for (let i = 0; i < teamData.length; i++) {
      const member = mockDataStore.createUser({
        email: `member${i + 1}@teamtest.com`,
        password: 'Test123!',
        firstName: teamData[i].name.split(' ')[0],
        lastName: teamData[i].name.split(' ')[1],
        userType: 'Respondent',
        organizationId: testOrg.id,
        respondentName: teamData[i].name
      });
      teamMembers.push(member);

      const subscription = mockDataStore.createSubscription(
        member.id,
        'team-signals-workflow',
        testOrg.id
      );
      subscriptions.push(subscription);

      // Simulate completing the Team Signals assessment
      const state = workflowStateManager.getOrCreateWorkflowState(
        subscription.subscriptionId,
        'team-signals-workflow',
        12 // Team Signals base content ID
      );

      // Add mock answers based on scores
      const mockAnswers: Record<number, string> = {};
      for (let j = 0; j < 8; j++) {
        // Each development area has ~5 questions, simulate answers
        for (let q = 0; q < 5; q++) {
          const questionId = 100 + (j * 5) + q;
          // Generate answers that would result in the target score
          const targetScore = teamData[i].scores[j];
          const answer = Math.floor(targetScore / 20) + 1; // 1-5 scale
          mockAnswers[questionId] = answer.toString();
        }
      }

      workflowStateManager.updateWorkflowState(
        subscription.subscriptionId,
        97, // Team Signals starting page
        Object.entries(mockAnswers).map(([id, value]) => ({
          questionID: parseInt(id),
          value
        }))
      );

      // Mark subscription as completed
      subscription.status = 'completed';
      subscription.completionPercentage = 100;
    }
  });

  describe('Team Signals 360 HTML Report Generation', () => {
    it('should generate Team Signals 360 HTML report', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360' // Team Signals 360 template
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('Team Signals - Team Report');
      expect(response.html).toContain('Test Team Org');
      expect(response.html).toContain('Development Areas');
    });

    it('should include all team member scores in 360 report', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '3' // Alternative template ID for 360
        },
        jwt: jwtToken
      });

      // Check that all team members are included
      expect(response.html).toContain('Alice Johnson');
      expect(response.html).toContain('Bob Smith');
      expect(response.html).toContain('Charlie Davis');

      // Check for individual scores
      expect(response.html).toContain('56%'); // Alice's first score
      expect(response.html).toContain('62%'); // Bob's first score
      expect(response.html).toContain('50%'); // Charlie's first score
    });

    it('should calculate correct averages in 360 report', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      // Expected averages: (56+62+50)/3 = 56%, (31+44+25)/3 = 33%, etc.
      expect(response.html).toContain('Average: 56%'); // Who are we?
      expect(response.html).toContain('Average: 33%'); // Where are we now?
      expect(response.html).toContain('Average: 75%'); // Where are we going?
    });

    it('should display correct traffic lights based on scores', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      // Check traffic light indicators
      expect(response.html).toContain('class="light orange"'); // 56% = orange
      expect(response.html).toContain('class="light magenta"'); // 33% = pink/magenta
      expect(response.html).toContain('class="light green"'); // 75% = green
    });

    it('should include response range visualizations', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      // Check for range visualization components
      expect(response.html).toContain('response-range');
      expect(response.html).toContain('min-marker');
      expect(response.html).toContain('max-marker');
      expect(response.html).toContain('avg-marker');
    });

    it('should handle Team Signals 360 graph generation', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-graph',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          graphType: 'CreateTeamSignals',
          templateId: '360'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('image');
      expect(response).toHaveProperty('mimeType', 'image/png');
      expect(response).toHaveProperty('graphType', 'CreateTeamSignals');
      
      // Check that the graph uses averaged colors
      expect(response).toHaveProperty('parameters');
      expect(response.parameters).toHaveProperty('colors');
      // Should have colors based on averaged scores
      expect(response.parameters.colors).toContain('amber');
      expect(response.parameters.colors).toContain('red');
      expect(response.parameters.colors).toContain('green');
    });
  });

  describe('Access Control for Team Signals 360', () => {
    it('should allow facilitator to generate 360 report', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('Team Signals - Team Report');
    });

    it('should prevent individual team members from accessing 360 report', async () => {
      // Login as a team member
      const memberLogin = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'member1@teamtest.com',
          Password: 'Test123!'
        }
      });

      // Try to generate 360 report as team member
      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: memberLogin.token
      })).rejects.toMatchObject({
        error: 'ACCESS_DENIED',
        message: 'Only facilitators can generate Team Signals 360 reports'
      });
    });

    it('should allow team members to access their individual reports', async () => {
      // Login as a team member
      const memberLogin = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        data: {
          Email: 'member1@teamtest.com',
          Password: 'Test123!'
        }
      });

      // Generate individual report (not 360)
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '1' // Individual report template
        },
        jwt: memberLogin.token
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('Team Signals');
      expect(response.html).not.toContain('Team Report'); // Individual, not team
    });
  });

  describe('Edge Cases', () => {
    it('should handle team with single member', async () => {
      // Remove all but one subscription by removing other team members
      subscriptions = [subscriptions[0]];
      // Just use the first subscription, don't modify the data store

      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      expect(response.html).toContain('1 team member'); // Should indicate single member
    });

    it('should handle incomplete team assessments', async () => {
      // Mark one subscription as incomplete
      subscriptions[1].status = 'in_progress';
      subscriptions[1].completionPercentage = 50;

      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      expect(response).toHaveProperty('html');
      // Should still generate report with available data
      expect(response.html).toContain('Alice Johnson');
      expect(response.html).toContain('Charlie Davis');
      // Bob's data might be partial or excluded
    });

    it('should reject invalid template IDs for non-Team Signals assessments', async () => {
      // Create a TMP subscription
      const tmpSubscription = mockDataStore.createSubscription(
        facilitator.id,
        'tmp-workflow',
        testOrg.id
      );

      await expect(mockApi.request({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: tmpSubscription.subscriptionId,
          templateId: '360' // Team Signals 360 template on TMP assessment
        },
        jwt: jwtToken
      })).rejects.toMatchObject({
        error: 'INVALID_TEMPLATE',
        message: 'Template 360 is only available for Team Signals assessments'
      });
    });
  });

  describe('Report Content Verification', () => {
    it('should include all 8 development areas', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      const developmentAreas = [
        'Who are we?',
        'Where are we now?',
        'Where are we going?',
        'How will we get there?',
        'What is expected of us?',
        'What support do we need?',
        'How effective are we?',
        'What recognition do we get?'
      ];

      developmentAreas.forEach(area => {
        expect(response.html).toContain(area);
      });
    });

    it('should include questionnaire items for reference', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      // Check for sample questions
      expect(response.html).toContain('Team members know what work colleagues prefer to do');
      expect(response.html).toContain('The team understands and acts on the opportunities');
      expect(response.html).toContain('Everyone in the team understands the purpose');
    });

    it('should embed correct graph image URL', async () => {
      const response = await mockApi.request<any>({
        method: 'POST',
        endpoint: '/api/v1/tms/generate-html-report',
        data: {
          subscriptionId: subscriptions[0].subscriptionId,
          templateId: '360'
        },
        jwt: jwtToken
      });

      // Check for Team Signals graph with correct parameters
      expect(response.html).toContain('https://api-test.tms.global/GetGraph?CreateTeamSignals');
      expect(response.html).toContain('colors=amber|red|green|amber|red|red|amber|amber');
    });
  });
});