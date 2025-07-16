/**
 * Tests for merge-suggestions utility
 */

import { 
  mergeSuggestedValues, 
  getSuggestedValuesForField, 
  hasSuggestedValues 
} from '../merge-suggestions';
import { FIELD_SUGGESTIONS } from '../suggested-options';

describe('merge-suggestions', () => {
  describe('mergeSuggestedValues', () => {
    it('should add suggested values to fields that have them in FIELD_SUGGESTIONS', () => {
      const rules = {
        primary_challenge: {
          type: 'string',
          required: true,
          patterns: ['challenge', 'problem']
        },
        team_size: {
          type: 'number',
          required: true,
          patterns: ['\\d+ people']
        }
      };
      
      const merged = mergeSuggestedValues(rules);
      
      // Should have suggested values for primary_challenge
      expect(merged.primary_challenge.suggestedValues).toBeDefined();
      expect(merged.primary_challenge.suggestedValues).toEqual(
        FIELD_SUGGESTIONS.primary_challenge.options
      );
      expect(merged.primary_challenge.helpText).toEqual(
        FIELD_SUGGESTIONS.primary_challenge.helpText
      );
      
      // Should not have suggested values for team_size (not in FIELD_SUGGESTIONS)
      expect(merged.team_size.suggestedValues).toBeUndefined();
    });
    
    it('should preserve existing rule properties', () => {
      const rules = {
        budget_range: {
          type: 'string',
          required: true,
          patterns: ['budget', 'invest'],
          customField: 'preserved'
        }
      };
      
      const merged = mergeSuggestedValues(rules);
      
      // Should preserve all original properties
      expect(merged.budget_range.type).toBe('string');
      expect(merged.budget_range.required).toBe(true);
      expect(merged.budget_range.patterns).toEqual(['budget', 'invest']);
      expect(merged.budget_range.customField).toBe('preserved');
      
      // And add suggested values
      expect(merged.budget_range.suggestedValues).toBeDefined();
    });
    
    it('should not modify rules for fields without suggestions', () => {
      const rules = {
        unknown_field: {
          type: 'string',
          required: false
        }
      };
      
      const merged = mergeSuggestedValues(rules);
      
      // Should be unchanged
      expect(merged.unknown_field).toEqual(rules.unknown_field);
      expect(merged.unknown_field.suggestedValues).toBeUndefined();
    });
    
    it('should handle empty rules object', () => {
      const merged = mergeSuggestedValues({});
      expect(merged).toEqual({});
    });
  });
  
  describe('getSuggestedValuesForField', () => {
    it('should return suggested values for known fields', () => {
      const values = getSuggestedValuesForField('primary_challenge');
      expect(values).toBeDefined();
      expect(values).toEqual(FIELD_SUGGESTIONS.primary_challenge.options);
    });
    
    it('should return undefined for unknown fields', () => {
      const values = getSuggestedValuesForField('unknown_field');
      expect(values).toBeUndefined();
    });
  });
  
  describe('hasSuggestedValues', () => {
    it('should return true for fields with suggestions', () => {
      expect(hasSuggestedValues('primary_challenge')).toBe(true);
      expect(hasSuggestedValues('success_metrics')).toBe(true);
      expect(hasSuggestedValues('budget_range')).toBe(true);
    });
    
    it('should return false for fields without suggestions', () => {
      expect(hasSuggestedValues('team_size')).toBe(false);
      expect(hasSuggestedValues('unknown_field')).toBe(false);
    });
  });
});