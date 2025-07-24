/**
 * Input validation tests for Report Context Service
 */

import { reportContextService } from '../report-context-service';
import { mockDataStore } from '../../mock-data-store';

describe('Report Context Service Input Validation', () => {
  const service = reportContextService;

  beforeEach(() => {
    // Clear any existing data
    service.clearAll();
    service.clearRateLimiter();
    
    // Create test organization and user
    mockDataStore.createOrganization('org-1', 'Test Organization');
    mockDataStore.createUser({
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'org-1',
      userType: 'Facilitator'
    });
  });

  describe('Subscription ID Validation', () => {
    it('should validate subscription ID format', async () => {
      const invalidIds = [
        '',
        'abc',
        '123abc',
        'DROP TABLE users',
        '<script>alert("xss")</script>',
        '123456789012345678901234567890123456789012345678901', // Too long (> 50 chars)
        '-123',
        '0',
        null,
        undefined
      ];

      for (const id of invalidIds) {
        const result = service.validateSubscriptionId(id as any);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('should accept valid subscription IDs', () => {
      const validIds = ['1', '123', '21988', '999999'];
      
      for (const id of validIds) {
        const result = service.validateSubscriptionId(id);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe(id);
      }
    });

    it('should sanitize subscription IDs', () => {
      const testCases = [
        { input: '  123  ', expected: '123' },
        { input: '00123', expected: '123' },
        { input: '123\n', expected: '123' }
      ];

      for (const { input, expected } of testCases) {
        const result = service.validateSubscriptionId(input);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBe(expected);
      }
    });
  });

  describe('Query Validation', () => {
    it('should reject queries that are too long', async () => {
      const longQuery = 'a'.repeat(5001);
      
      const result = await service.queryReport({
        subscriptionId: '21988',
        query: longQuery,
        userId: 'user-123'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Query is too long');
    });

    it('should reject empty queries', async () => {
      const emptyQueries = ['', '   ', '\n\n', '\t'];
      
      for (const query of emptyQueries) {
        const result = await service.queryReport({
          subscriptionId: '21988',
          query,
          userId: 'user-123'
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('Query cannot be empty');
      }
    });

    it('should sanitize queries with special characters', async () => {
      const queries = [
        { input: 'What is <script>alert("xss")</script> in my report?', shouldBlock: true },
        { input: 'SELECT * FROM users', shouldBlock: false }, // Allow SQL-like text in queries
        { input: 'What does ICAF mean?', shouldBlock: false }
      ];

      for (const { input, shouldBlock } of queries) {
        const result = service.sanitizeQuery(input);
        
        if (shouldBlock) {
          expect(result).not.toContain('<script>');
          expect(result).not.toContain('</script>');
        }
      }
    });
  });

  describe('User ID Validation', () => {
    it('should validate user ID format', () => {
      const invalidUserIds = [
        '',
        'user-',
        'user-', // Missing ID part
        '123',
        'USER-123', // Wrong case
        'admin-123', // Invalid prefix
        null,
        undefined
      ];

      for (const userId of invalidUserIds) {
        const result = service.validateUserId(userId as any);
        expect(result.valid).toBe(false);
      }
    });

    it('should accept valid user IDs', () => {
      const validUserIds = [
        'user-123',
        'user-1',
        'user-999999',
        'facilitator-1',
        'user-1234567890-abc123def', // Mock data store format
        'respondent-42',
        'cmcujg1nf0000smqd9rtnrfcp' // CUID format
      ];

      for (const userId of validUserIds) {
        const result = service.validateUserId(userId);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const userId = 'test-user';
      
      // Clear rate limiter first
      service.clearRateLimiter();
      
      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        expect(service.checkRateLimit(userId)).toBe(true);
      }
      
      // 6th request should be rate limited
      expect(service.checkRateLimit(userId)).toBe(false);
    });

    it('should reset rate limit after time window', () => {
      jest.useFakeTimers();
      
      const userId = 'test-user-reset';
      
      // Clear rate limiter first
      service.clearRateLimiter();
      
      // Hit rate limit
      for (let i = 0; i < 5; i++) {
        expect(service.checkRateLimit(userId)).toBe(true);
      }
      
      // Should be rate limited
      expect(service.checkRateLimit(userId)).toBe(false);
      
      // Advance time by 1 minute
      jest.advanceTimersByTime(60001);
      
      // Should be able to query again
      expect(service.checkRateLimit(userId)).toBe(true);
      
      jest.useRealTimers();
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in subscription ID', async () => {
      const maliciousIds = [
        "1'; DROP TABLE subscriptions; --",
        "1 OR 1=1",
        "1 UNION SELECT * FROM users",
        "1'; UPDATE users SET role='admin' WHERE id='user-123'; --"
      ];

      for (const id of maliciousIds) {
        const result = service.validateSubscriptionId(id);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid subscription ID format');
      }
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize HTML in queries', () => {
      const xssAttempts = [
        '<img src=x onerror=alert("xss")>',
        '<iframe src="javascript:alert(\'xss\')">',
        '<svg onload=alert("xss")>',
        'javascript:alert("xss")',
        '<a href="javascript:alert(\'xss\')">click</a>'
      ];

      for (const attempt of xssAttempts) {
        const sanitized = service.sanitizeQuery(attempt);
        
        // Should not contain any HTML tags or javascript:
        expect(sanitized).not.toMatch(/<[^>]+>/);
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onerror');
        expect(sanitized).not.toContain('onload');
      }
    });
  });
});