import { VariableExtractionService, VariableExtractionInput } from '../../services/variable-extraction';
import { LLMProvider } from '../llm';
import { BatchExtractor } from './batch-extraction';

export interface ExtractionRule {
  type: 'string' | 'number' | 'boolean' | 'array';
  patterns?: string[];
  required?: boolean;
  description?: string;
  useLLMFallback?: boolean; // Enable LLM fallback when regex fails
  preferLLM?: boolean; // Prefer LLM extraction over regex for this field
  examples?: string[]; // Example values to help LLM understand the field
  suggestedValues?: string[]; // Suggested values to display when user is uncertain
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
      if (!process.env.OPENAI_API_KEY) {
        console.warn('[Extraction] Warning: OPENAI_API_KEY not found. LLM extraction will not work.');
      }
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
    // Check if we should use batch extraction for better performance
    const llmEnabledFields = Object.entries(rules).filter(([_, rule]) => 
      rule.preferLLM !== false && context?.enableLLMFallback === true
    );
    
    // Temporarily disable batch extraction due to hanging issues
    // TODO: Re-enable after fixing JSON parsing
    const USE_BATCH_EXTRACTION = false;
    
    // If we have multiple LLM-enabled fields, use batch extraction
    if (USE_BATCH_EXTRACTION && llmEnabledFields.length > 1) {
      return this.extractFromMessageBatch(message, rules, context);
    }
    
    // Otherwise, fall back to individual extraction
    const results: ExtractionResult[] = [];

    for (const [fieldName, rule] of Object.entries(rules)) {
      let result: ExtractionResult;
      
      // Check if we should prefer LLM extraction for this field
      // Default to LLM extraction when available for better accuracy
      const preferLLM = rule.preferLLM !== false && context?.enableLLMFallback === true;
      
      if (fieldName === 'manager_name' || fieldName === 'manager_role') {
        console.log(`[Extraction] Processing ${fieldName}: preferLLM=${preferLLM}, enableLLMFallback=${context?.enableLLMFallback}`);
      }
      
      if (preferLLM) {
        // Use LLM extraction when enabled (now the default)
        const llmResult = await this.extractWithLLM(message, fieldName, rule);
        result = llmResult;
        
        // Log results for debugging
        if (rule.required || ['manager_name', 'manager_role', 'team_size', 'primary_challenge'].includes(fieldName)) {
          console.log(`[Extraction] LLM result for ${fieldName}: ${llmResult.successful ? llmResult.extractedValue : 'NOT_FOUND'}`);
        }
        
        // Optional: Fall back to regex if LLM fails and fallback is explicitly requested
        if (!result.successful && rule.useRegexFallback === true) {
          const regexResult = this.extractField(message, fieldName, rule);
          if (regexResult.successful) {
            result = regexResult;
            console.log(`[Extraction] Regex fallback succeeded for ${fieldName}: ${result.extractedValue}`);
          }
        }
      } else {
        // Use regex extraction only when LLM is explicitly disabled
        result = this.extractField(message, fieldName, rule);
        
        // Still allow LLM fallback if specifically configured
        if (!result.successful && rule.useLLMFallback && context?.enableLLMFallback === true) {
          const llmResult = await this.extractWithLLM(message, fieldName, rule);
          if (llmResult.successful) {
            result = llmResult;
            console.log(`[Extraction] LLM fallback succeeded for ${fieldName}: ${result.extractedValue}`);
          }
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
              // Check for range patterns (e.g., "10-15" or "10 to 15")
              if (match[2] && (pattern.includes('to|') || pattern.includes('-'))) {
                // Range detected - extract both numbers
                const start = parseInt(match[1].replace(/[^\d]/g, ''), 10);
                const end = parseInt(match[2].replace(/[^\d]/g, ''), 10);
                if (!isNaN(start) && !isNaN(end)) {
                  // Return the average for now (could be enhanced to return range object)
                  extractedValue = Math.round((start + end) / 2);
                  break;
                }
              }
              
              // Extract the first capture group or the full match
              const numStr = match[1] || match[0];
              
              // Check for descriptive terms
              const descriptiveMap: Record<string, number> = {
                'couple': 2,
                'few': 3,
                'several': 4,
                'handful': 5,
                'dozen': 12
              };
              
              const lowerStr = numStr.toLowerCase();
              for (const [term, value] of Object.entries(descriptiveMap)) {
                if (lowerStr.includes(term)) {
                  extractedValue = value;
                  break;
                }
              }
              
              if (!extractedValue) {
                extractedValue = parseInt(numStr.replace(/[^\d]/g, ''), 10);
                if (isNaN(extractedValue)) {
                  continue; // Try next pattern
                }
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
      
      // Check if LLM is properly configured
      if (!process.env.OPENAI_API_KEY) {
        console.error(`[LLM Extraction] Cannot extract ${fieldName}: OpenAI API key not configured`);
        return {
          fieldName,
          attempted: true,
          successful: false,
          confidence: 0,
          extractionMethod: 'llm'
        };
      }
      
      // Create extraction prompt
      const prompt = this.createExtractionPrompt(message, fieldName, rule);
      
      if (fieldName === 'manager_name' || fieldName === 'manager_role') {
        console.log(`[LLM Extraction] Starting extraction for ${fieldName} from: "${message}"`);
      }
      
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
      
      if (fieldName === 'manager_name' || fieldName === 'manager_role') {
        console.log(`[LLM Extraction] ${fieldName} from "${message}" → "${extractedText}"`);
      }
      
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

    // Special handling for name fields
    const isNameField = ['manager_name', 'user_name', 'name'].includes(fieldName);
    const isRoleField = ['manager_role', 'role', 'job_title', 'position'].includes(fieldName);
    
    if (isNameField) {
      return `Extract the person's name from the user's message.

IMPORTANT RULES:
1. Only extract if the person is explicitly introducing themselves
2. Common greeting responses are NOT names:
   - "I'm fine" → NOT a name introduction
   - "I'm good" → NOT a name introduction  
   - "I'm okay" → NOT a name introduction
3. Phrases expressing desires/needs are NOT names:
   - "I just want..." → NOT a name introduction
   - "I need..." → NOT a name introduction
   - "I think..." → NOT a name introduction
4. Look for actual name introduction patterns:
   - "My name is [NAME]"
   - "I'm [NAME]" (where NAME is clearly a person's name)
   - "Hi, I'm [NAME]"
   - "Hello, I'm [NAME]"
   - "Call me [NAME]"
   - "[NAME] here"
   - "This is [NAME]"

User Message: "${message}"

Respond with ONLY the person's actual name or "NOT_FOUND" if no name is introduced.
Examples:
- "I'm fine" → "NOT_FOUND"
- "I'm Sarah" → "Sarah"
- "Hi I'm Rowan" → "Rowan"
- "Hello, I'm John" → "John"
- "My name is John Smith" → "John Smith"
- "I just want to understand" → "NOT_FOUND"
- "I have 3 people in my team" → "NOT_FOUND"
- "I manage 5 people" → "NOT_FOUND"
- "We have 10 team members" → "NOT_FOUND"
- "I'm john and i manage a team" → "John"
- "i'm sarah" → "Sarah"

CRITICAL: 
- If someone says "Hi I'm [NAME]" or "Hello I'm [NAME]", extract the NAME
- Common names like Rowan, Sarah, John, etc. should be recognized
- Names may be written in lowercase - capitalize them properly (e.g., "john" → "John", "sarah" → "Sarah")
- If the message contains "I'm [name] and..." where [name] is a common first name, extract it
- If the message is about team size, roles, or work information WITHOUT a name introduction, respond with "NOT_FOUND"`;
    }
    
    if (isRoleField) {
      return `Extract the person's job title or role from the user's message.

IMPORTANT RULES:
1. Only extract the actual job title/role, not the company name or other details
2. Common role patterns to look for:
   - "I'm a [ROLE]"
   - "I am a [ROLE]"
   - "I work as [ROLE]"
   - "My role is [ROLE]"
   - "I'm the [ROLE]"
   - "serving as [ROLE]"
   - "position is [ROLE]"
   - "[ROLE] at/for [company]"
3. Clean up the extraction:
   - Remove articles (a, an, the)
   - Capitalize appropriately (e.g., "CTO", "VP of Sales")
   - Include full title (e.g., "Senior Software Engineer", not just "Engineer")

User Message: "${message}"

Respond with ONLY the job title/role or "NOT_FOUND" if no role is mentioned.
Examples:
- "I'm a software engineer" → "Software Engineer"
- "I work as a team lead" → "Team Lead"
- "My role is CTO" → "CTO"
- "I'm the VP of Engineering" → "VP of Engineering"
- "I am a senior product manager at Google" → "Senior Product Manager"
- "actually 'BHP' and I'm a CTO there" → "CTO"
- "I manage the sales team" → "NOT_FOUND" (describes responsibility, not title)
- "I have 5 years experience" → "NOT_FOUND" (no role mentioned)

CRITICAL:
- Extract ONLY the job title, not the company name
- Common abbreviations like CTO, CEO, CFO, VP should be kept in uppercase
- If someone says "I'm a [ROLE] at/for/with [company]", extract only the ROLE`;
    }
    
    // Generic extraction prompt for other fields
    const fieldNameFormatted = fieldName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    // Add field-specific guidance
    let fieldGuidance = '';
    if (fieldName.includes('team_size')) {
      fieldGuidance = `
Common patterns:
- "team of [NUMBER]"
- "[NUMBER] people/members/employees"
- "manage [NUMBER]"
- "have [NUMBER] direct reports"

Extract only the number. If a range is given (e.g., "10-15"), extract the average.`;
    } else if (fieldName.includes('challenge')) {
      fieldGuidance = `
Look for:
- Problems or issues mentioned
- Pain points or struggles
- Goals they want to achieve
- Improvements they're seeking

Extract the main challenge or problem, not the entire explanation.`;
    } else if (fieldName.includes('organization') || fieldName.includes('company')) {
      fieldGuidance = `
Extract only the company/organization name, not descriptions or additional context.`;
    }
    
    return `Extract the ${fieldNameFormatted} from the user's message.

Field: ${fieldName}
Description: ${rule.description || `Extract the ${fieldName}`}
Type: ${rule.type}
${typeHint}
${fieldGuidance}

User Message: "${message}"

Respond with only the extracted value or "NOT_FOUND" if the information is not present.
Examples of responses:
- If found: Just the value (e.g., "5", "Microsoft", "Poor communication")
- If not found: "NOT_FOUND"

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

    // Filter out unsuccessful extractions from the extracted object
    const cleanExtracted: Record<string, any> = {};
    for (const result of results) {
      if (result.successful && result.extractedValue !== undefined && result.extractedValue !== null) {
        cleanExtracted[result.fieldName] = result.extractedValue;
      }
    }

    return { extracted: cleanExtracted, results };
  }
  
  /**
   * Extract multiple fields using batch LLM extraction for better performance
   */
  private static async extractFromMessageBatch(
    message: string,
    rules: Record<string, ExtractionRule>,
    context?: ExtractionContext
  ): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = [];
    
    // Separate fields into LLM and regex groups
    const llmFields: Record<string, ExtractionRule> = {};
    const regexOnlyFields: Record<string, ExtractionRule> = {};
    
    for (const [fieldName, rule] of Object.entries(rules)) {
      if (rule.preferLLM !== false && context?.enableLLMFallback === true) {
        llmFields[fieldName] = rule;
      } else {
        regexOnlyFields[fieldName] = rule;
      }
    }
    
    // Batch extract LLM fields
    if (Object.keys(llmFields).length > 0) {
      console.log(`[Extraction] Batch extracting ${Object.keys(llmFields).length} fields with LLM`);
      const startTime = Date.now();
      
      const batchResults = await BatchExtractor.extractBatch({
        message,
        fields: llmFields
      });
      
      const duration = Date.now() - startTime;
      console.log(`[Extraction] Batch extraction completed in ${duration}ms`);
      
      // Add batch results to results array
      for (const [fieldName, result] of Object.entries(batchResults)) {
        results.push(result);
      }
    }
    
    // Extract regex-only fields individually
    for (const [fieldName, rule] of Object.entries(regexOnlyFields)) {
      const result = this.extractField(message, fieldName, rule);
      results.push(result);
    }
    
    return results;
  }
}