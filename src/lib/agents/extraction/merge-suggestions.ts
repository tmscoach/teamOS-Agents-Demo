/**
 * Utility to merge FIELD_SUGGESTIONS into extraction rules
 */

import { FIELD_SUGGESTIONS } from './suggested-options';
import type { ExtractionRule } from './extraction-processor';

/**
 * Merge suggested values from FIELD_SUGGESTIONS into extraction rules
 */
export function mergeSuggestedValues(
  extractionRules: Record<string, any>
): Record<string, any> {
  const mergedRules: Record<string, any> = {};
  
  // Copy all existing rules
  for (const [fieldName, rule] of Object.entries(extractionRules)) {
    mergedRules[fieldName] = { ...rule };
    
    // If this field has suggested values in FIELD_SUGGESTIONS, add them
    if (FIELD_SUGGESTIONS[fieldName]) {
      mergedRules[fieldName].suggestedValues = FIELD_SUGGESTIONS[fieldName].options;
      
      // Optionally add helpText as part of description if it exists
      if (FIELD_SUGGESTIONS[fieldName].helpText) {
        mergedRules[fieldName].helpText = FIELD_SUGGESTIONS[fieldName].helpText;
      }
    }
  }
  
  return mergedRules;
}

/**
 * Get suggested values for a specific field
 */
export function getSuggestedValuesForField(fieldName: string): string[] | undefined {
  return FIELD_SUGGESTIONS[fieldName]?.options;
}

/**
 * Check if a field has suggested values configured
 */
export function hasSuggestedValues(fieldName: string): boolean {
  return fieldName in FIELD_SUGGESTIONS;
}