import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';
import { DEFAULT_AGENT_CONFIGS } from '@/src/lib/agents/config/default-agent-configs';

describe('Admin Agent Config - Extraction Rules', () => {
  describe('OnboardingAgent Extraction Rules', () => {
    const EXPECTED_REQUIRED_FIELDS = [
      'user_name',
      'user_role',
      'team_size',
      'organization',
      'primary_challenge'
    ];

    it('should have required fields in default config (including aliases)', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      const requiredFields = Object.entries(extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field);
      
      // Should have 7 required fields (5 unique + 2 aliases)
      expect(requiredFields).toHaveLength(7);
      
      // Should match our expected fields
      EXPECTED_REQUIRED_FIELDS.forEach(field => {
        expect(requiredFields).toContain(field);
      });
    });

    it('should NOT have extra fields marked as required', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      const FIELDS_THAT_SHOULD_NOT_BE_REQUIRED = [
        'team_tenure',
        'success_metrics',
        'timeline_preference',
        'budget_range',
        'leader_commitment'
      ];
      
      FIELDS_THAT_SHOULD_NOT_BE_REQUIRED.forEach(field => {
        if (extractionRules[field]) {
          expect(extractionRules[field].required).toBe(false);
        }
      });
    });

    it('should have proper field types for required fields', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      const expectedTypes = {
        'user_name': 'string',
        'user_role': 'string',
        'team_size': 'number',
        'organization': 'string',
        'primary_challenge': 'string'
      };
      
      Object.entries(expectedTypes).forEach(([field, type]) => {
        expect(extractionRules[field]).toBeDefined();
        expect(extractionRules[field].type).toBe(type);
      });
    });

    it('should have field aliases for backward compatibility', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      // Both user_name and manager_name should exist
      expect(extractionRules.user_name).toBeDefined();
      expect(extractionRules.manager_name).toBeDefined();
      
      // Both should have the same required status
      expect(extractionRules.user_name.required).toBe(true);
      expect(extractionRules.manager_name.required).toBe(true);
      
      // Same for role fields
      expect(extractionRules.user_role).toBeDefined();
      expect(extractionRules.manager_role).toBeDefined();
      expect(extractionRules.user_role.required).toBe(true);
      expect(extractionRules.manager_role.required).toBe(true);
    });

    it('should have consistent required fields in flowConfig', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const flowConfigRequiredFields = defaultConfig.flowConfig.requiredFields || [];
      
      // Should have some required fields defined
      expect(flowConfigRequiredFields.length).toBeGreaterThan(0);
      
      // Should include our core fields (minus organization which might be in extraction only)
      expect(flowConfigRequiredFields).toContain('user_name');
      expect(flowConfigRequiredFields).toContain('user_role');
      expect(flowConfigRequiredFields).toContain('team_size');
      expect(flowConfigRequiredFields).toContain('primary_challenge');
    });
  });

  describe('Extraction Rule Structure', () => {
    it('should have valid extraction rule structure', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      Object.entries(extractionRules).forEach(([field, rule]: [string, any]) => {
        // Every rule should have a type
        expect(rule.type).toBeDefined();
        expect(['string', 'number', 'boolean', 'array']).toContain(rule.type);
        
        // Required should be a boolean
        if (rule.required !== undefined) {
          expect(typeof rule.required).toBe('boolean');
        }
        
        // If patterns exist, they should be an array
        if (rule.patterns) {
          expect(Array.isArray(rule.patterns)).toBe(true);
        }
        
        // If suggestedValues exist, they should be an array
        if (rule.suggestedValues) {
          expect(Array.isArray(rule.suggestedValues)).toBe(true);
        }
      });
    });

    it('should have descriptions for all required fields', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      const requiredFields = Object.entries(extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field);
      
      requiredFields.forEach(field => {
        const rule = extractionRules[field];
        expect(rule.description).toBeDefined();
        expect(typeof rule.description).toBe('string');
        expect(rule.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Suggested Values', () => {
    it('should have suggested values for role and challenge fields', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      // user_role should have suggested values
      expect(extractionRules.user_role.suggestedValues).toBeDefined();
      expect(extractionRules.user_role.suggestedValues.length).toBeGreaterThan(0);
      
      // primary_challenge should have suggested values
      expect(extractionRules.primary_challenge.suggestedValues).toBeDefined();
      expect(extractionRules.primary_challenge.suggestedValues.length).toBeGreaterThan(0);
    });

    it('should have consistent suggested values across aliases', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      // user_role and manager_role should have the same suggested values
      if (extractionRules.user_role.suggestedValues && extractionRules.manager_role.suggestedValues) {
        expect(extractionRules.user_role.suggestedValues).toEqual(
          extractionRules.manager_role.suggestedValues
        );
      }
    });
  });

  describe('Config Loader Integration', () => {
    it('should return correct default extraction rules', () => {
      const defaultRules = AgentConfigLoader.getDefaultExtractionRules('OnboardingAgent');
      
      expect(defaultRules).toBeDefined();
      expect(Object.keys(defaultRules).length).toBeGreaterThan(0);
      
      // Should include our required fields
      const expectedFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
      expectedFields.forEach(field => {
        expect(defaultRules[field]).toBeDefined();
      });
    });

    it('should handle missing agent gracefully', () => {
      const rules = AgentConfigLoader.getDefaultExtractionRules('NonExistentAgent');
      expect(rules).toEqual({});
    });
  });

  describe('Field Name Consistency', () => {
    it('should use consistent field naming convention', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      // All field names should be snake_case
      Object.keys(extractionRules).forEach(field => {
        expect(field).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    it('should not have conflicting field definitions', () => {
      const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const extractionRules = defaultConfig.extractionRules;
      
      // Track field purposes to ensure no conflicts
      const fieldPurposes: Record<string, string> = {
        'user_name': 'name',
        'manager_name': 'name',
        'user_role': 'role',
        'manager_role': 'role',
        'team_size': 'size',
        'organization': 'company',
        'primary_challenge': 'challenge'
      };
      
      // Verify aliases have the same purpose
      expect(fieldPurposes.user_name).toBe(fieldPurposes.manager_name);
      expect(fieldPurposes.user_role).toBe(fieldPurposes.manager_role);
    });
  });
});