/**
 * Tests for Summary Generators
 */

import { generateHTMLSummary } from '../summary-generators';
import type { MockSubscription } from '../mock-data-store';

describe('Summary Generators', () => {
  describe('generateHTMLSummary', () => {
    it('should generate TMP summary with correct structure', async () => {
      const subscription: MockSubscription = {
        subscriptionId: '21989',
        userId: 'user-123',
        organizationId: 'org-456',
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

      const html = await generateHTMLSummary(subscription);
      
      // Check for required elements
      expect(html).toContain('<h3>Profile Summary</h3>');
      expect(html).toContain('Major Role:');
      expect(html).toContain('1st Related Role:');
      expect(html).toContain('2nd Related Role:');
      expect(html).toContain('Net Scores:');
      
      // Check for correct roles (hardcoded for subscription 21989)
      expect(html).toContain('Upholder Maintainer');
      expect(html).toContain('Controller Inspector');
      expect(html).toContain('Thruster Organiser');
      expect(html).toContain('I:7 C:3 B:5 S:9');
      
      // Check for image URL
      expect(html).toContain('https://api-test.tms.global/GetGraph?CreateTMPQWheel');
      expect(html).toContain('&amp;mr=8');
      expect(html).toContain('&amp;rr1=7');
      expect(html).toContain('&amp;rr2=5');
    });

    it('should generate QO2 summary with correct structure', async () => {
      const subscription: MockSubscription = {
        subscriptionId: '21983',
        userId: 'user-123',
        organizationId: 'org-456',
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

      const html = await generateHTMLSummary(subscription);
      
      // Check for required elements
      expect(html).toContain('<h3>QO2 Summary</h3>');
      expect(html).toContain('Opportunity Score:');
      expect(html).toContain('Obstacle Score:');
      expect(html).toContain('Overall QO2:');
      expect(html).toContain('Primary Focus:');
      
      // Check for values
      expect(html).toContain('65%');
      expect(html).toContain('35%');
      expect(html).toContain('1.86');
      expect(html).toContain('Opportunity-Focused');
      
      // Check for image URL
      expect(html).toContain('https://api-test.tms.global/GetGraph?CreateQO2Model');
      expect(html).toContain('&amp;gva=38');
      expect(html).toContain('&amp;pav=33');
    });

    it('should generate Team Signals summary', async () => {
      const subscription: MockSubscription = {
        subscriptionId: '21988',
        userId: 'user-123',
        organizationId: 'org-456',
        workflowId: 'team-signals-workflow',
        workflowName: 'Team Signals',
        assessmentType: 'TeamSignals',
        status: 'completed',
        completionPercentage: 100,
        assignedDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-22'),
        baseContentId: 12,
        currentPageId: 97
      };

      const html = await generateHTMLSummary(subscription);
      
      // Should contain Team Signals specific content
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(0);
    });

    it('should generate generic summary for WOW assessment', async () => {
      const subscription: MockSubscription = {
        subscriptionId: 'wow-123',
        userId: 'user-123',
        organizationId: 'org-456',
        workflowId: 'wow-workflow',
        workflowName: 'Ways of Working',
        assessmentType: 'WOW',
        status: 'completed',
        completionPercentage: 100,
        assignedDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-22'),
        baseContentId: 10,
        currentPageId: 50
      };

      const html = await generateHTMLSummary(subscription);
      
      // Should contain generic summary
      expect(html).toContain('Ways of Working Summary');
      expect(html).toContain('Assessment completed');
    });

    it('should generate generic summary for LLP assessment', async () => {
      const subscription: MockSubscription = {
        subscriptionId: 'llp-123',
        userId: 'user-123',
        organizationId: 'org-456',
        workflowId: 'llp-workflow',
        workflowName: 'Linking Leader Profile',
        assessmentType: 'LLP',
        status: 'completed',
        completionPercentage: 100,
        assignedDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-22'),
        baseContentId: 15,
        currentPageId: 75
      };

      const html = await generateHTMLSummary(subscription);
      
      // Should contain generic summary
      expect(html).toContain('Linking Leader Profile Summary');
      expect(html).toContain('Assessment completed');
    });

    it('should throw error for unknown assessment type', async () => {
      const subscription: MockSubscription = {
        subscriptionId: 'unknown-123',
        userId: 'user-123',
        organizationId: 'org-456',
        workflowId: 'unknown-workflow',
        workflowName: 'Unknown Assessment',
        assessmentType: 'UNKNOWN' as any,
        status: 'completed',
        completionPercentage: 100,
        assignedDate: new Date('2024-01-15'),
        completedDate: new Date('2024-01-22'),
        baseContentId: 99,
        currentPageId: 99
      };

      await expect(generateHTMLSummary(subscription)).rejects.toThrow('Unknown assessment type: UNKNOWN');
    });

    it('should use template ID parameter when provided', async () => {
      const subscription: MockSubscription = {
        subscriptionId: '21989',
        userId: 'user-123',
        organizationId: 'org-456',
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

      const html = await generateHTMLSummary(subscription, '7');
      
      // Should still generate correct summary
      expect(html).toContain('<h3>Profile Summary</h3>');
      expect(html).toContain('Upholder Maintainer');
    });

    it('should generate dynamic TMP summary for other subscriptions', async () => {
      const subscription: MockSubscription = {
        subscriptionId: 'other-tmp-123', // Different subscription ID
        userId: 'user-123',
        organizationId: 'org-456',
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

      const html = await generateHTMLSummary(subscription);
      
      // Should generate dynamic summary (not the hardcoded one)
      expect(html).toContain('<h3>Profile Summary</h3>');
      expect(html).toContain('Major Role:');
      expect(html).toContain('https://api-test.tms.global/GetGraph?CreateTMPQWheel');
      
      // Should have dynamic values (default values since no answers)
      expect(html).toContain('Upholder Maintainer'); // Default major role
    });

    it('should return HTML as single line without formatting', async () => {
      const subscription: MockSubscription = {
        subscriptionId: '21989',
        userId: 'user-123',
        organizationId: 'org-456',
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

      const html = await generateHTMLSummary(subscription);
      
      // Should not contain newlines (single line HTML)
      expect(html).not.toContain('\n');
      
      // Should be valid HTML fragment
      expect(html).toMatch(/^<h3>/);
      expect(html).toMatch(/<\/table>$/);
    });
  });
});