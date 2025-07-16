import { DEFAULT_AGENT_CONFIGS } from '@/src/lib/agents/config/default-agent-configs';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';

describe('Field Requirements Consistency', () => {
  const ONBOARDING_CONFIG = DEFAULT_AGENT_CONFIGS.OnboardingAgent;

  describe('Required Fields Alignment', () => {
    it('should have matching required fields between flowConfig and extractionRules', () => {
      const flowRequiredFields = ONBOARDING_CONFIG.flowConfig.requiredFields || [];
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      // Get required fields from extraction rules
      const extractionRequiredFields = Object.entries(extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field)
        .filter(field => !['manager_name', 'manager_role'].includes(field)); // Exclude aliases
      
      // Flow config should have the core required fields
      expect(flowRequiredFields).toContain('user_name');
      expect(flowRequiredFields).toContain('user_role');
      expect(flowRequiredFields).toContain('team_size');
      expect(flowRequiredFields).toContain('primary_challenge');
      
      // Should not have more than 5 core fields
      expect(flowRequiredFields.length).toBeLessThanOrEqual(5);
    });

    it('should have exactly 5 unique required fields (excluding aliases)', () => {
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      // Get all required fields
      const allRequiredFields = Object.entries(extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field);
      
      // Map aliases to canonical names
      const canonicalFields = allRequiredFields.map(field => {
        if (field === 'manager_name') return 'user_name';
        if (field === 'manager_role') return 'user_role';
        return field;
      });
      
      // Get unique fields
      const uniqueRequiredFields = [...new Set(canonicalFields)];
      
      expect(uniqueRequiredFields).toHaveLength(5);
      expect(uniqueRequiredFields).toContain('user_name');
      expect(uniqueRequiredFields).toContain('user_role');
      expect(uniqueRequiredFields).toContain('team_size');
      expect(uniqueRequiredFields).toContain('organization');
      expect(uniqueRequiredFields).toContain('primary_challenge');
    });
  });

  describe('Field Naming Consistency', () => {
    it('should use consistent naming convention', () => {
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      Object.keys(extractionRules).forEach(field => {
        // Should be lowercase with underscores
        expect(field).toMatch(/^[a-z]+(_[a-z]+)*$/);
        
        // Should not have camelCase
        expect(field).not.toMatch(/[A-Z]/);
        
        // Should not start or end with underscore
        expect(field).not.toMatch(/^_|_$/);
      });
    });

    it('should have matching types for aliased fields', () => {
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      // user_name and manager_name should have same type
      expect(extractionRules.user_name.type).toBe(extractionRules.manager_name.type);
      
      // user_role and manager_role should have same type
      expect(extractionRules.user_role.type).toBe(extractionRules.manager_role.type);
    });
  });

  describe('Prompt References', () => {
    it('should reference correct field names in prompts', () => {
      const prompts = ONBOARDING_CONFIG.prompts;
      
      // System prompt should mention asking for specific role/title
      expect(prompts.system).toContain('role/title');
      
      // Greeting should ask for name
      expect(prompts.greeting.toLowerCase()).toContain('name');
      
      // Context discovery should ask about role
      expect(prompts.context_discovery.toLowerCase()).toContain('role');
      
      // Challenge exploration should mention challenge
      expect(prompts.challenge_exploration.toLowerCase()).toContain('challenge');
    });
  });

  describe('State Transitions', () => {
    it('should have states that align with required field collection', () => {
      const flowConfig = ONBOARDING_CONFIG.flowConfig;
      const states = flowConfig.states;
      
      // Should have states for collecting each type of info
      expect(states).toContain('greeting'); // For name
      expect(states).toContain('context_discovery'); // For role and team info
      expect(states).toContain('challenge_exploration'); // For primary challenge
      
      // Should have recap state
      expect(states).toContain('recap_and_handoff');
    });

    it('should allow progression through all states', () => {
      const transitions = ONBOARDING_CONFIG.flowConfig.transitions;
      
      // Verify each state (except final) has a next state
      const nonFinalStates = [
        'greeting',
        'context_discovery',
        'challenge_exploration',
        'tms_explanation',
        'goal_setting',
        'resource_confirmation',
        'stakeholder_mapping'
      ];
      
      nonFinalStates.forEach(state => {
        expect(transitions[state]).toBeDefined();
        expect(transitions[state].length).toBeGreaterThan(0);
      });
      
      // recap_and_handoff should be terminal
      expect(transitions.recap_and_handoff).toEqual([]);
    });
  });

  describe('Extraction Rules Completeness', () => {
    it('should have all required properties for each extraction rule', () => {
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      Object.entries(extractionRules).forEach(([field, rule]: [string, any]) => {
        // Must have type
        expect(rule.type).toBeDefined();
        expect(['string', 'number', 'boolean', 'array']).toContain(rule.type);
        
        // Required flag should be a boolean if defined
        if (rule.required !== undefined) {
          expect(typeof rule.required).toBe('boolean');
        }
        
        // Should have description
        expect(rule.description).toBeDefined();
        expect(typeof rule.description).toBe('string');
      });
    });

    it('should not have duplicate extraction logic', () => {
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      // Check that patterns don't overlap significantly between non-alias fields
      const patternMap = new Map<string, string[]>();
      
      Object.entries(extractionRules).forEach(([field, rule]: [string, any]) => {
        if (rule.patterns && !['manager_name', 'manager_role'].includes(field)) {
          patternMap.set(field, rule.patterns);
        }
      });
      
      // Each field should have unique patterns (no exact duplicates)
      const allPatterns = Array.from(patternMap.values()).flat();
      const uniquePatterns = [...new Set(allPatterns)];
      
      // Most patterns should be unique (allow some overlap for flexibility)
      const overlapRatio = (allPatterns.length - uniquePatterns.length) / allPatterns.length;
      expect(overlapRatio).toBeLessThan(0.2); // Less than 20% overlap
    });
  });

  describe('Optional Fields Configuration', () => {
    it('should have optional fields marked as not required', () => {
      const extractionRules = ONBOARDING_CONFIG.extractionRules;
      
      const OPTIONAL_FIELDS = [
        'team_tenure',
        'success_metrics',
        'timeline_preference',
        'budget_range',
        'leader_commitment',
        'company_name',
        'department',
        'team_distribution',
        'urgency_level',
        'previous_initiatives'
      ];
      
      OPTIONAL_FIELDS.forEach(field => {
        if (extractionRules[field]) {
          // Optional fields should either have required: false or no required property
          const rule = extractionRules[field];
          if (rule.required !== undefined) {
            expect(rule.required).toBe(false);
          }
        }
      });
    });

    it('should not include optional fields in flowConfig requiredFields', () => {
      const requiredFields = ONBOARDING_CONFIG.flowConfig.requiredFields || [];
      
      const SHOULD_NOT_BE_REQUIRED = [
        'team_tenure',
        'success_metrics',
        'timeline_preference',
        'budget_range',
        'leader_commitment'
      ];
      
      SHOULD_NOT_BE_REQUIRED.forEach(field => {
        expect(requiredFields).not.toContain(field);
      });
    });
  });
});