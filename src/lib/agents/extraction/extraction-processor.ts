import { VariableExtractionService, VariableExtractionInput } from '../../services/variable-extraction';

export interface ExtractionRule {
  type: 'string' | 'number' | 'boolean' | 'array';
  patterns?: string[];
  required?: boolean;
  description?: string;
}

export interface ExtractionResult {
  fieldName: string;
  attempted: boolean;
  successful: boolean;
  extractedValue?: any;
  confidence?: number;
  pattern?: string;
}

export interface ExtractionContext {
  conversationId: string;
  agentName: string;
  teamId?: string;
  managerId?: string;
}

export class ExtractionProcessor {
  /**
   * Extract variables from a message using configured extraction rules
   */
  static extractFromMessage(
    message: string, 
    rules: Record<string, ExtractionRule>
  ): ExtractionResult[] {
    const results: ExtractionResult[] = [];

    for (const [fieldName, rule] of Object.entries(rules)) {
      const result = this.extractField(message, fieldName, rule);
      results.push(result);
    }

    return results;
  }

  /**
   * Extract a single field using its rule configuration
   */
  private static extractField(
    message: string,
    fieldName: string,
    rule: ExtractionRule
  ): ExtractionResult {
    // If no patterns defined, mark as attempted but not successful
    if (!rule.patterns || rule.patterns.length === 0) {
      return {
        fieldName,
        attempted: true,
        successful: false,
        confidence: 0
      };
    }

    // Try each pattern
    for (const pattern of rule.patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        const match = message.match(regex);

        if (match) {
          let extractedValue: any;

          // Extract based on type
          switch (rule.type) {
            case 'number':
              // Extract the first capture group or the full match
              const numStr = match[1] || match[0];
              extractedValue = parseInt(numStr.replace(/[^\d]/g, ''), 10);
              if (isNaN(extractedValue)) {
                continue; // Try next pattern
              }
              break;

            case 'boolean':
              // For boolean, just check if pattern matched
              extractedValue = true;
              break;

            case 'array':
              // For arrays, extract all capture groups
              extractedValue = match.slice(1).filter(Boolean);
              break;

            case 'string':
            default:
              // Extract first capture group or full match
              extractedValue = match[1] || match[0];
              break;
          }

          // Calculate confidence based on match quality
          const confidence = this.calculateConfidence(match, pattern, message);

          return {
            fieldName,
            attempted: true,
            successful: true,
            extractedValue,
            confidence,
            pattern
          };
        }
      } catch (error) {
        console.error(`Invalid regex pattern for field ${fieldName}: ${pattern}`, error);
      }
    }

    // No patterns matched
    return {
      fieldName,
      attempted: true,
      successful: false,
      confidence: 0
    };
  }

  /**
   * Calculate confidence score for an extraction
   */
  private static calculateConfidence(
    match: RegExpMatchArray,
    pattern: string,
    message: string
  ): number {
    // Base confidence of 0.6 for any match
    let confidence = 0.6;

    // Boost confidence for exact pattern matches
    if (match[0].length === message.length) {
      confidence += 0.2;
    }

    // Boost confidence for matches with multiple captured groups
    if (match.length > 2) {
      confidence += 0.1;
    }

    // Boost confidence if match is near the beginning of the message
    if (match.index !== undefined && match.index < 20) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Track extraction results to the database
   */
  static async trackExtractions(
    results: ExtractionResult[],
    context: ExtractionContext
  ): Promise<void> {
    const extractionInputs: VariableExtractionInput[] = results.map(result => ({
      conversationId: context.conversationId,
      agentName: context.agentName,
      fieldName: result.fieldName,
      attempted: result.attempted,
      successful: result.successful,
      extractedValue: result.extractedValue ? String(result.extractedValue) : undefined,
      confidence: result.confidence
    }));

    // Only track if we have results and a valid conversation ID
    if (extractionInputs.length > 0 && context.conversationId && 
        !context.conversationId.startsWith('test-') && 
        process.env.NODE_ENV !== 'test') {
      try {
        await VariableExtractionService.trackExtractionBatch(extractionInputs);
      } catch (error) {
        console.error('Failed to track extractions:', error);
        // Don't throw - extraction tracking should not break the main flow
      }
    }
  }

  /**
   * Extract and track in one operation
   */
  static async extractAndTrack(
    message: string,
    rules: Record<string, ExtractionRule>,
    context: ExtractionContext
  ): Promise<{ extracted: Record<string, any>; results: ExtractionResult[] }> {
    // Extract from message
    const results = this.extractFromMessage(message, rules);

    // Build extracted values object
    const extracted: Record<string, any> = {};
    for (const result of results) {
      if (result.successful && result.extractedValue !== undefined) {
        extracted[result.fieldName] = result.extractedValue;
      }
    }

    // Track extractions
    await this.trackExtractions(results, context);

    return { extracted, results };
  }
}