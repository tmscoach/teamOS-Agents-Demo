/**
 * Guard test to ensure extraction configuration remains consistent
 * This test will fail if anyone changes the extraction rules incorrectly
 */

import { DEFAULT_AGENT_CONFIGS } from '@/src/lib/agents/config/default-agent-configs';

describe('Extraction Configuration Guard', () => {
  const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;

  describe('Critical Configuration Invariants', () => {
    it('MUST have exactly 5 unique required fields', () => {
      const extractionRules = config.extractionRules;
      
      // Get all required fields
      const requiredFields = Object.entries(extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field);
      
      // Map to canonical names
      const canonicalFields = requiredFields.map(field => {
        if (field === 'manager_name') return 'user_name';
        if (field === 'manager_role') return 'user_role';
        return field;
      });
      
      // Get unique fields
      const uniqueFields = [...new Set(canonicalFields)];
      
      // CRITICAL: Must have exactly these 5 fields
      expect(uniqueFields).toHaveLength(5);
      expect(uniqueFields.sort()).toEqual([
        'organization',
        'primary_challenge',
        'team_size',
        'user_name',
        'user_role'
      ]);
    });

    it('MUST NOT mark extra fields as required', () => {
      const extractionRules = config.extractionRules;
      
      // These fields MUST remain optional
      const MUST_BE_OPTIONAL = [
        'team_tenure',
        'success_metrics',
        'timeline_preference',
        'budget_range',
        'leader_commitment'
      ];
      
      MUST_BE_OPTIONAL.forEach(field => {
        if (extractionRules[field]) {
          expect(extractionRules[field].required).not.toBe(true);
        }
      });
    });

    it('MUST have consistent flowConfig.requiredFields', () => {
      const flowRequiredFields = config.flowConfig.requiredFields || [];
      
      // Must match our 5 core fields
      expect(flowRequiredFields.sort()).toEqual([
        'organization',
        'primary_challenge',
        'team_size',
        'user_name',
        'user_role'
      ]);
    });

    it('MUST use LLM extraction for all fields', () => {
      const extractionRules = config.extractionRules;
      
      // All required fields should support LLM extraction
      const requiredFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
      
      requiredFields.forEach(field => {
        const rule = extractionRules[field];
        expect(rule).toBeDefined();
        
        // Should not explicitly disable LLM
        if (rule.preferLLM !== undefined) {
          expect(rule.preferLLM).not.toBe(false);
        }
        if (rule.useLLMFallback !== undefined) {
          expect(rule.useLLMFallback).not.toBe(false);
        }
      });
    });

    it('MUST have suggested values for appropriate fields only', () => {
      const extractionRules = config.extractionRules;
      
      // These fields MUST have suggested values
      const MUST_HAVE_SUGGESTIONS = ['user_role', 'manager_role', 'primary_challenge'];
      
      MUST_HAVE_SUGGESTIONS.forEach(field => {
        expect(extractionRules[field]?.suggestedValues).toBeDefined();
        expect(extractionRules[field]?.suggestedValues.length).toBeGreaterThan(0);
      });
      
      // These fields MUST NOT have suggested values
      const MUST_NOT_HAVE_SUGGESTIONS = ['user_name', 'manager_name', 'team_size', 'organization'];
      
      MUST_NOT_HAVE_SUGGESTIONS.forEach(field => {
        if (extractionRules[field]) {
          expect(extractionRules[field].suggestedValues).toBeUndefined();
        }
      });
    });

    it('MUST handle bare numbers for team_size', () => {
      const teamSizeRule = config.extractionRules.team_size;
      
      expect(teamSizeRule).toBeDefined();
      expect(teamSizeRule.type).toBe('number');
      expect(teamSizeRule.required).toBe(true);
      
      // Should have patterns that can match bare numbers
      if (teamSizeRule.patterns) {
        const hasBareNumberPattern = teamSizeRule.patterns.some((pattern: string) => 
          pattern.includes('^') && pattern.includes('\\d+') && pattern.includes('$')
        );
        expect(hasBareNumberPattern).toBe(true);
      }
    });

    it('MUST maintain field aliases for backward compatibility', () => {
      const extractionRules = config.extractionRules;
      
      // Both versions must exist
      expect(extractionRules.user_name).toBeDefined();
      expect(extractionRules.manager_name).toBeDefined();
      expect(extractionRules.user_role).toBeDefined();
      expect(extractionRules.manager_role).toBeDefined();
      
      // Both must have same required status
      expect(extractionRules.user_name.required).toBe(extractionRules.manager_name.required);
      expect(extractionRules.user_role.required).toBe(extractionRules.manager_role.required);
      
      // Both must have same type
      expect(extractionRules.user_name.type).toBe(extractionRules.manager_name.type);
      expect(extractionRules.user_role.type).toBe(extractionRules.manager_role.type);
    });
  });

  describe('Breaking Change Detection', () => {
    it('should alert if someone adds new required fields', () => {
      const extractionRules = config.extractionRules;
      
      const allRequiredFields = Object.entries(extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field);
      
      // Should only have our known required fields and their aliases
      const allowedRequiredFields = [
        'user_name', 'manager_name',
        'user_role', 'manager_role',
        'team_size',
        'organization',
        'primary_challenge'
      ];
      
      allRequiredFields.forEach(field => {
        expect(allowedRequiredFields).toContain(field);
      });
    });

    it('should alert if critical fields are removed', () => {
      const extractionRules = config.extractionRules;
      
      // These fields must always exist
      const criticalFields = [
        'user_name',
        'user_role',
        'team_size',
        'organization',
        'primary_challenge'
      ];
      
      criticalFields.forEach(field => {
        expect(extractionRules[field]).toBeDefined();
        expect(extractionRules[field].required).toBe(true);
      });
    });
  });
});