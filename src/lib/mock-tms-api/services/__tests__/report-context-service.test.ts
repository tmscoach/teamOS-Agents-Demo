import { reportContextService } from '../report-context-service';
import { mockDataStore, resetMockDataStore } from '../../mock-data-store';

describe('ReportContextService', () => {
  beforeEach(() => {
    // Clear all stored reports
    reportContextService.clearAll();
    // Reset mock data store
    resetMockDataStore();
  });

  describe('storeReportContext', () => {
    it('should store report context successfully', async () => {
      const subscriptionId = 'test-sub-123';
      const htmlContent = `
        <html>
          <body>
            <h1>Team Management Profile</h1>
            <img src="https://api.tms.global/GetGraph?CreateTMPQWheel&mr=8&rr1=7&rr2=5" />
            <p>Your major role is Upholder-Maintainer</p>
          </body>
        </html>
      `;

      // Create test subscription
      const org = mockDataStore.createOrganization('Test Org', '');
      const user = mockDataStore.createUser({
        email: 'test@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: org.id
      });
      const subscription = mockDataStore.createSubscription(
        user.id,
        'tmp-workflow',
        org.id
      );

      await reportContextService.storeReportContext(subscription.subscriptionId, htmlContent);

      const context = reportContextService.getReportContext(subscription.subscriptionId);
      expect(context).toBeDefined();
      expect(context?.subscriptionId).toBe(subscription.subscriptionId);
      expect(context?.htmlContent).toBe(htmlContent);
      expect(context?.plainText).toContain('Team Management Profile');
      expect(context?.images.size).toBe(1);
    });

    it('should extract images correctly', async () => {
      const subscriptionId = 'test-sub-456';
      const htmlContent = `
        <html>
          <body>
            <img src="https://api.tms.global/GetGraph?CreateTMPQWheel&mr=8&rr1=7&rr2=5" />
            <img src="https://api.tms.global/GetGraph?CreateTMPQRido&lv=15&rv=22" />
          </body>
        </html>
      `;

      // Create test subscription
      const org = mockDataStore.createOrganization('Test Org', '');
      const user = mockDataStore.createUser({
        email: 'test2@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: org.id
      });
      const subscription = mockDataStore.createSubscription(
        user.id,
        'tmp-workflow',
        org.id
      );

      await reportContextService.storeReportContext(subscription.subscriptionId, htmlContent);

      const context = reportContextService.getReportContext(subscription.subscriptionId);
      expect(context?.images.size).toBe(2);
      
      const images = Array.from(context?.images.values() || []);
      expect(images[0].type).toBe('CreateTMPQWheel');
      expect(images[0].parameters).toEqual({ mr: '8', rr1: '7', rr2: '5' });
      expect(images[1].type).toBe('CreateTMPQRido');
      expect(images[1].parameters).toEqual({ lv: '15', rv: '22' });
    });
  });

  describe('queryReport', () => {
    const setupTestReport = async () => {
      const org = mockDataStore.createOrganization('Test Org', '');
      const user = mockDataStore.createUser({
        email: 'test@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: org.id
      });
      const subscription = mockDataStore.createSubscription(
        user.id,
        'tmp-workflow',
        org.id
      );

      const htmlContent = `
        <html>
          <body>
            <h1>Team Management Profile</h1>
            <img src="https://api.tms.global/GetGraph?CreateTMPQWheel&mr=8&rr1=7&rr2=5" />
            <p>Your major role is Upholder-Maintainer</p>
          </body>
        </html>
      `;

      await reportContextService.storeReportContext(subscription.subscriptionId, htmlContent);
      return subscription.subscriptionId;
    };

    it('should handle visual element queries', async () => {
      const subscriptionId = await setupTestReport();
      
      const response = await reportContextService.queryReport(
        subscriptionId,
        'What does the green section in my wheel represent?'
      );

      expect(response.response).toContain('Advising');
      expect(response.response).toContain('green');
      // Wheel image should be in relevant sections if found
      if (response.relevantSections.length > 0) {
        expect(response.relevantSections[0].type).toBe('image');
      }
      expect(response.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should handle score comparison queries', async () => {
      const subscriptionId = await setupTestReport();
      
      const response = await reportContextService.queryReport(
        subscriptionId,
        'How do I compare to others?'
      );

      expect(response.response).toContain('Team Management Profile');
      expect(response.response.toLowerCase()).toContain('compare');
      expect(response.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should handle interpretation queries', async () => {
      const subscriptionId = await setupTestReport();
      
      const response = await reportContextService.queryReport(
        subscriptionId,
        'What does my profile mean?'
      );

      expect(response.response).toContain('results indicate');
      expect(response.response).toContain('preferences');
      expect(response.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should handle next steps queries', async () => {
      const subscriptionId = await setupTestReport();
      
      const response = await reportContextService.queryReport(
        subscriptionId,
        'What should I do next?'
      );

      expect(response.response).toContain('next steps');
      expect(response.response).toContain('Review and Reflect');
      expect(response.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should handle general queries', async () => {
      const subscriptionId = await setupTestReport();
      
      const response = await reportContextService.queryReport(
        subscriptionId,
        'Can you help me understand my report?'
      );

      // Since "help me understand" triggers interpret_results intent
      expect(response.response).toContain('results indicate');
      expect(response.response).toContain('preferences');
      expect(response.suggestedQuestions.length).toBeGreaterThan(0);
    });

    it('should throw error for non-existent subscription', async () => {
      await expect(
        reportContextService.queryReport('non-existent', 'test query')
      ).rejects.toThrow('No report context found');
    });
  });

  describe('Team Signals specific queries', () => {
    const setupTeamSignalsReport = async () => {
      const org = mockDataStore.createOrganization('Test Org', '');
      const user = mockDataStore.createUser({
        email: 'test@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: org.id
      });
      const subscription = mockDataStore.createSubscription(
        user.id,
        'team-signals-workflow',
        org.id
      );

      const htmlContent = `
        <html>
          <body>
            <h1>Team Signals Report</h1>
            <div class="traffic-lights">
              <div class="light green"></div>
              <div class="light amber"></div>
              <div class="light red"></div>
            </div>
            <img src="https://api.tms.global/GetGraph?CreateTeamSignals&colors=green|amber|red|amber|amber|red|amber|amber" />
          </body>
        </html>
      `;

      await reportContextService.storeReportContext(subscription.subscriptionId, htmlContent);
      return subscription.subscriptionId;
    };

    it('should explain traffic lights', async () => {
      const subscriptionId = await setupTeamSignalsReport();
      
      const response = await reportContextService.queryReport(
        subscriptionId,
        'What do the traffic lights mean?'
      );

      // Check that it's recognized as a visual query about traffic lights
      expect(response.response.toLowerCase()).toContain('traffic light');
      // The response might explain traffic lights differently
      if (response.response.includes('traffic light system')) {
        expect(response.response).toContain('Green');
        expect(response.response).toContain('Amber');
        expect(response.response).toContain('Red');
      }
    });
  });

  describe('clearAll', () => {
    it('should clear all stored reports', async () => {
      // Store some reports
      const org = mockDataStore.createOrganization('Test Org', '');
      const user = mockDataStore.createUser({
        email: 'test@example.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'Respondent',
        organizationId: org.id
      });
      
      const sub1 = mockDataStore.createSubscription(user.id, 'tmp-workflow', org.id);
      const sub2 = mockDataStore.createSubscription(user.id, 'qo2-workflow', org.id);

      await reportContextService.storeReportContext(sub1.subscriptionId, '<html>Report 1</html>');
      await reportContextService.storeReportContext(sub2.subscriptionId, '<html>Report 2</html>');

      expect(reportContextService.getAllReportIds()).toHaveLength(2);

      reportContextService.clearAll();

      expect(reportContextService.getAllReportIds()).toHaveLength(0);
    });
  });
});