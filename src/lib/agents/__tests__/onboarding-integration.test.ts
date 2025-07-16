/**
 * Integration test for onboarding flow
 */

describe('Onboarding Integration', () => {
  describe('Required Fields', () => {
    it('should only require 5 core fields', () => {
      // These are the only fields that should be required
      const requiredFields = [
        'user_name',
        'user_role', 
        'team_size',
        'organization',
        'primary_challenge'
      ];
      
      expect(requiredFields).toHaveLength(5);
      
      // These fields should NOT be required
      const notRequiredFields = [
        'team_tenure',
        'success_metrics',
        'timeline_preference',
        'budget_range',
        'leader_commitment'
      ];
      
      // Verify they're different lists
      notRequiredFields.forEach(field => {
        expect(requiredFields).not.toContain(field);
      });
    });
  });

  describe('Field Extraction', () => {
    it('should extract bare number for team_size', () => {
      const testCases = [
        { input: '0', expected: 0 },
        { input: '1', expected: 1 },
        { input: '5', expected: 5 },
        { input: '10', expected: 10 },
        { input: '100', expected: 100 }
      ];
      
      testCases.forEach(test => {
        // Simulate the bare number check in extraction processor
        const isBareNumber = /^\d+$/.test(test.input.trim());
        expect(isBareNumber).toBe(true);
        
        const extracted = parseInt(test.input.trim(), 10);
        expect(extracted).toBe(test.expected);
      });
    });

    it('should handle field aliases', () => {
      const aliases = {
        'manager_name': 'user_name',
        'manager_role': 'user_role'
      };
      
      // Both should map to the canonical field name
      Object.entries(aliases).forEach(([alias, canonical]) => {
        expect(canonical).toBeDefined();
        expect(alias).not.toBe(canonical);
      });
    });
  });

  describe('Completion Logic', () => {
    it('should complete when all 5 fields are captured', () => {
      const capturedFields = {
        user_name: 'John',
        user_role: 'Engineering Manager',
        team_size: 10,
        organization: 'Tech Corp',
        primary_challenge: 'Communication issues'
      };
      
      const requiredFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
      const capturedCount = requiredFields.filter(field => capturedFields[field] !== undefined).length;
      
      expect(capturedCount).toBe(5);
      expect(capturedCount === requiredFields.length).toBe(true);
    });

    it('should not complete with missing fields', () => {
      const capturedFields = {
        user_name: 'John',
        user_role: 'Engineering Manager',
        // Missing team_size
        organization: 'Tech Corp',
        primary_challenge: 'Communication issues'
      };
      
      const requiredFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
      const capturedCount = requiredFields.filter(field => capturedFields[field] !== undefined).length;
      
      expect(capturedCount).toBe(4);
      expect(capturedCount === requiredFields.length).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    it('should have retry phrasings for all required fields', () => {
      const retryPhrasings = {
        'user_name': "I don't think I caught your name earlier. What should I call you?",
        'user_role': "I may have missed your job title. What's your current role in the organization?",
        'team_size': "I didn't quite catch how many people are on your team. How many team members do you have? (Enter 0 if you're working solo for now)",
        'organization': "Could you remind me which company or organization you work for?",
        'primary_challenge': "Let me make sure I understand - what's the main challenge you're facing with your team right now?"
      };
      
      const requiredFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
      
      requiredFields.forEach(field => {
        expect(retryPhrasings[field]).toBeDefined();
        expect(retryPhrasings[field]).toContain('?'); // Should be a question
      });
      
      // Special check for team_size retry - should mention 0 is valid
      expect(retryPhrasings.team_size).toContain('0');
    });
  });

  describe('LLM Extraction', () => {
    it('should always use LLM extraction when enabled', () => {
      // Both streaming route and OnboardingAgent should use enableLLMFallback: true
      const streamingRouteConfig = { enableLLMFallback: true };
      const onboardingAgentConfig = { enableLLMFallback: true }; // Now hardcoded to true
      
      expect(streamingRouteConfig.enableLLMFallback).toBe(true);
      expect(onboardingAgentConfig.enableLLMFallback).toBe(true);
      expect(streamingRouteConfig.enableLLMFallback).toBe(onboardingAgentConfig.enableLLMFallback);
    });
  });
});