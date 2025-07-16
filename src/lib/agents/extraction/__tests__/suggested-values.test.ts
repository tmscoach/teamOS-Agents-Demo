import { SUGGESTED_OPTIONS } from '../suggested-options';
import { mergeSuggestedValues } from '../merge-suggestions';
import { DEFAULT_AGENT_CONFIGS } from '../../config/default-agent-configs';

describe('Suggested Values Integration', () => {
  describe('SUGGESTED_OPTIONS Structure', () => {
    it('should have suggested options for key fields', () => {
      expect(SUGGESTED_OPTIONS.user_role).toBeDefined();
      expect(SUGGESTED_OPTIONS.manager_role).toBeDefined();
      expect(SUGGESTED_OPTIONS.primary_challenge).toBeDefined();
    });

    it('should have consistent role suggestions across aliases', () => {
      expect(SUGGESTED_OPTIONS.user_role).toEqual(SUGGESTED_OPTIONS.manager_role);
      expect(SUGGESTED_OPTIONS.user_role.length).toBeGreaterThan(0);
    });

    it('should have valid suggestion structure', () => {
      Object.entries(SUGGESTED_OPTIONS).forEach(([field, suggestions]) => {
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
        
        // Each suggestion should be a non-empty string
        suggestions.forEach(suggestion => {
          expect(typeof suggestion).toBe('string');
          expect(suggestion.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have appropriate role suggestions', () => {
      const roleSuggestions = SUGGESTED_OPTIONS.user_role;
      
      // Should include common manager roles
      expect(roleSuggestions).toContain('Engineering Manager');
      expect(roleSuggestions).toContain('Product Manager');
      expect(roleSuggestions).toContain('Team Lead');
      
      // Should not have too many options (overwhelming)
      expect(roleSuggestions.length).toBeLessThanOrEqual(20);
      expect(roleSuggestions.length).toBeGreaterThanOrEqual(5);
    });

    it('should have appropriate challenge suggestions', () => {
      const challengeSuggestions = SUGGESTED_OPTIONS.primary_challenge;
      
      // Should include common team challenges
      expect(challengeSuggestions.some(s => s.toLowerCase().includes('communication'))).toBe(true);
      expect(challengeSuggestions.some(s => s.toLowerCase().includes('morale'))).toBe(true);
      expect(challengeSuggestions.some(s => s.toLowerCase().includes('performance'))).toBe(true);
      
      // Should be concise and clear
      challengeSuggestions.forEach(challenge => {
        expect(challenge.length).toBeLessThan(100); // Not too long
        expect(challenge.split(' ').length).toBeGreaterThanOrEqual(3); // Not too short
      });
    });
  });

  describe('mergeSuggestedValues Function', () => {
    it('should merge suggested values into extraction rules', () => {
      const rules = {
        user_role: { type: 'string' as const, required: true },
        team_size: { type: 'number' as const, required: true }
      };
      
      const merged = mergeSuggestedValues(rules);
      
      // Should add suggested values to user_role
      expect(merged.user_role.suggestedValues).toBeDefined();
      expect(merged.user_role.suggestedValues).toEqual(SUGGESTED_OPTIONS.user_role);
      
      // Should not add suggested values to fields without them
      expect(merged.team_size.suggestedValues).toBeUndefined();
    });

    it('should preserve existing rule properties', () => {
      const rules = {
        user_role: { 
          type: 'string' as const, 
          required: true,
          description: 'User role description',
          patterns: ['pattern1', 'pattern2']
        }
      };
      
      const merged = mergeSuggestedValues(rules);
      
      // Should preserve all original properties
      expect(merged.user_role.type).toBe('string');
      expect(merged.user_role.required).toBe(true);
      expect(merged.user_role.description).toBe('User role description');
      expect(merged.user_role.patterns).toEqual(['pattern1', 'pattern2']);
      
      // And add suggested values
      expect(merged.user_role.suggestedValues).toBeDefined();
    });

    it('should not override existing suggested values', () => {
      const customSuggestions = ['Custom Role 1', 'Custom Role 2'];
      const rules = {
        user_role: { 
          type: 'string' as const,
          suggestedValues: customSuggestions
        }
      };
      
      const merged = mergeSuggestedValues(rules);
      
      // Should keep the existing suggested values
      expect(merged.user_role.suggestedValues).toEqual(customSuggestions);
      expect(merged.user_role.suggestedValues).not.toEqual(SUGGESTED_OPTIONS.user_role);
    });
  });

  describe('Integration with Default Config', () => {
    it('should have suggested values in OnboardingAgent default config', () => {
      const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const rules = config.extractionRules;
      
      // Check that suggested values are present
      expect(rules.user_role.suggestedValues).toBeDefined();
      expect(rules.manager_role.suggestedValues).toBeDefined();
      expect(rules.primary_challenge.suggestedValues).toBeDefined();
      
      // Should match our SUGGESTED_OPTIONS
      expect(rules.user_role.suggestedValues).toEqual(SUGGESTED_OPTIONS.user_role);
      expect(rules.primary_challenge.suggestedValues).toEqual(SUGGESTED_OPTIONS.primary_challenge);
    });

    it('should only add suggested values to appropriate fields', () => {
      const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const rules = config.extractionRules;
      
      // These should have suggested values
      expect(rules.user_role.suggestedValues).toBeDefined();
      expect(rules.primary_challenge.suggestedValues).toBeDefined();
      
      // These should NOT have suggested values (free text/number fields)
      expect(rules.user_name.suggestedValues).toBeUndefined();
      expect(rules.team_size.suggestedValues).toBeUndefined();
      expect(rules.organization.suggestedValues).toBeUndefined();
    });
  });

  describe('Suggested Values Display Logic', () => {
    it('should only show suggestions for fields that have them', () => {
      const fieldWithSuggestions = {
        type: 'string',
        suggestedValues: ['Option 1', 'Option 2']
      };
      
      const fieldWithoutSuggestions = {
        type: 'string'
      };
      
      // Logic check
      const shouldShowSuggestions = (field: any) => {
        return field.suggestedValues && field.suggestedValues.length > 0;
      };
      
      expect(shouldShowSuggestions(fieldWithSuggestions)).toBe(true);
      expect(shouldShowSuggestions(fieldWithoutSuggestions)).toBe(false);
    });

    it('should have help text for fields with suggestions', () => {
      const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const rules = config.extractionRules;
      
      // Fields with suggested values should have descriptions
      if (rules.user_role.suggestedValues) {
        expect(rules.user_role.description).toBeDefined();
      }
      
      if (rules.primary_challenge.suggestedValues) {
        expect(rules.primary_challenge.description).toBeDefined();
      }
    });
  });

  describe('Field-Specific Suggestions', () => {
    it('should not suggest values for numeric fields', () => {
      const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const rules = config.extractionRules;
      
      // team_size is numeric and should not have suggestions
      expect(rules.team_size.type).toBe('number');
      expect(rules.team_size.suggestedValues).toBeUndefined();
    });

    it('should not suggest values for open-ended text fields', () => {
      const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const rules = config.extractionRules;
      
      // user_name and organization are open-ended
      expect(rules.user_name.suggestedValues).toBeUndefined();
      expect(rules.organization.suggestedValues).toBeUndefined();
    });

    it('should have suggestions for enumerable fields only', () => {
      const config = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
      const rules = config.extractionRules;
      
      // Count fields with suggestions
      const fieldsWithSuggestions = Object.entries(rules)
        .filter(([_, rule]: [string, any]) => rule.suggestedValues && rule.suggestedValues.length > 0)
        .map(([field, _]) => field);
      
      // Should only be role and challenge fields
      expect(fieldsWithSuggestions).toContain('user_role');
      expect(fieldsWithSuggestions).toContain('manager_role');
      expect(fieldsWithSuggestions).toContain('primary_challenge');
      
      // Should not include free-form fields
      expect(fieldsWithSuggestions).not.toContain('user_name');
      expect(fieldsWithSuggestions).not.toContain('team_size');
      expect(fieldsWithSuggestions).not.toContain('organization');
    });
  });
});