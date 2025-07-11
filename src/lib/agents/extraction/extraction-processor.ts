import { VariableExtractionService, VariableExtractionInput } from '../../services/variable-extraction';
import { LLMProvider } from '../llm';

export interface ExtractionRule {
  type: 'string' | 'number' | 'boolean' | 'array';
  patterns?: string[];
  required?: boolean;
  description?: string;
  useLLMFallback?: boolean; // New field to enable LLM fallback per rule
}

export interface ExtractionResult {
  fieldName: string;
  attempted: boolean;
  successful: boolean;
  extractedValue?: any;
  confidence?: number;
  pattern?: string;
  extractionMethod?: 'regex' | 'llm'; // Track which method succeeded
}

export interface ExtractionContext {
  conversationId: string;
  agentName: string;
  teamId?: string;
  managerId?: string;
  enableLLMFallback?: boolean; // Global flag for LLM fallback
}

export class ExtractionProcessor {
  private static llmProvider: LLMProvider | null = null;

  /**
   * Initialize LLM provider for extraction fallback
   */
  private static getLLMProvider(): LLMProvider {
    if (!this.llmProvider) {
      this.llmProvider = new LLMProvider();
    }
    return this.llmProvider;
  }

  /**
   * Extract variables from a message using configured extraction rules
   */
  static async extractFromMessage(
    message: string, 
    rules: Record<string, ExtractionRule>,
    context?: ExtractionContext
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];

    for (const [fieldName, rule] of Object.entries(rules)) {
      // First try regex extraction
      let result = this.extractField(message, fieldName, rule);
      
      // If regex failed and LLM fallback is enabled, try LLM extraction
      if (!result.successful && rule.required && rule.useLLMFallback &&
          context?.enableLLMFallback !== false) {
        const llmResult = await this.extractWithLLM(message, fieldName, rule);
        if (llmResult.successful) {
          result = llmResult;
        } else {
          // Still update the extraction method even if unsuccessful
          result.extractionMethod = 'llm';
        }
      }
      
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
            pattern,
            extractionMethod: 'regex'
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
      confidence: 0,
      extractionMethod: 'regex'
    };
  }

  /**
   * Extract a field using LLM when regex patterns fail
   */
  private static async extractWithLLM(
    message: string,
    fieldName: string,
    rule: ExtractionRule
  ): Promise<ExtractionResult> {
    try {
      const llm = this.getLLMProvider();
      
      // Create extraction prompt
      const prompt = this.createExtractionPrompt(message, fieldName, rule);
      
      // Get LLM response
      const response = await llm.generateResponse([
        { 
          role: 'system', 
          content: 'You are a precise information extraction assistant. Extract only the requested information from the given text. If the information is not present, respond with "NOT_FOUND".' 
        },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.1, // Low temperature for more deterministic extraction
        maxTokens: 100
      });

      const extractedText = response.completion.choices[0]?.message?.content?.trim() || '';
      
      // Check if extraction was successful
      if (extractedText === 'NOT_FOUND' || extractedText === '') {
        return {
          fieldName,
          attempted: true,
          successful: false,
          confidence: 0,
          extractionMethod: 'llm'
        };
      }

      // Parse the extracted value based on type
      let extractedValue: any = extractedText;
      
      switch (rule.type) {
        case 'number':
          extractedValue = parseInt(extractedText.replace(/[^\d]/g, ''), 10);
          if (isNaN(extractedValue)) {
            return {
              fieldName,
              attempted: true,
              successful: false,
              confidence: 0,
              extractionMethod: 'llm'
            };
          }
          break;
          
        case 'boolean':
          extractedValue = ['yes', 'true', '1', 'correct', 'affirmative'].includes(extractedText.toLowerCase());
          break;
          
        case 'array':
          // Try to parse as comma-separated values
          extractedValue = extractedText.split(',').map(v => v.trim()).filter(Boolean);
          break;
      }

      return {
        fieldName,
        attempted: true,
        successful: true,
        extractedValue,
        confidence: 0.8, // LLM extractions get a fixed confidence of 0.8
        extractionMethod: 'llm'
      };
    } catch (error) {
      console.error(`LLM extraction failed for field ${fieldName}:`, error);
      return {
        fieldName,
        attempted: true,
        successful: false,
        confidence: 0,
        extractionMethod: 'llm'
      };
    }
  }

  /**
   * Create a focused prompt for LLM extraction
   */
  private static createExtractionPrompt(
    message: string,
    fieldName: string,
    rule: ExtractionRule
  ): string {
    let typeHint = '';
    switch (rule.type) {
      case 'number':
        typeHint = 'Extract only the numeric value.';
        break;
      case 'boolean':
        typeHint = 'Extract yes/no or true/false.';
        break;
      case 'array':
        typeHint = 'Extract multiple values as a comma-separated list.';
        break;
      default:
        typeHint = 'Extract the exact text value.';
    }

    return `Extract the following information from the user's message:

Field: ${fieldName}
Description: ${rule.description || `Extract the ${fieldName}`}
Type: ${rule.type}
${typeHint}

User Message: "${message}"

Respond with only the extracted value or "NOT_FOUND" if the information is not present in the message.
Do not include any explanation or additional text.`;
  }

  /**
   * Calculate confidence score for an extraction
   */
  private static calculateConfidence(
    match: RegExpMatchArray,
    _pattern: string,
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
      confidence: result.confidence,
      extractionMethod: result.extractionMethod
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
    // Extract from message (now async due to potential LLM calls)
    const results = await this.extractFromMessage(message, rules, context);

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