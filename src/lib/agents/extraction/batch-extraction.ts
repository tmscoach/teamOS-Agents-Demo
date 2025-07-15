/**
 * Batch extraction for multiple fields in a single LLM call
 */

import { LLMProvider } from '../llm';
import { ExtractionRule, ExtractionResult } from './extraction-processor';

interface BatchExtractionRequest {
  message: string;
  fields: Record<string, ExtractionRule>;
}

interface BatchExtractionResponse {
  [fieldName: string]: {
    value: any;
    found: boolean;
  };
}

export class BatchExtractor {
  private static llmProvider: LLMProvider;
  
  /**
   * Get or create LLM provider instance
   */
  private static getLLMProvider(): LLMProvider {
    if (!this.llmProvider) {
      this.llmProvider = new LLMProvider();
    }
    return this.llmProvider;
  }
  
  /**
   * Extract multiple fields in a single LLM call
   */
  static async extractBatch(request: BatchExtractionRequest): Promise<Record<string, ExtractionResult>> {
    const { message, fields } = request;
    const results: Record<string, ExtractionResult> = {};
    
    // Filter fields that should use LLM extraction
    const llmFields = Object.entries(fields).filter(([_, rule]) => 
      rule.preferLLM !== false || rule.useLLMFallback
    );
    
    if (llmFields.length === 0) {
      return results;
    }
    
    try {
      // Create a structured prompt for batch extraction
      const prompt = this.createBatchExtractionPrompt(message, llmFields);
      
      const llm = this.getLLMProvider();
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Batch extraction timeout')), 5000);
      });
      
      const responsePromise = llm.generateResponse([
        {
          role: 'system',
          content: 'You are a precise information extraction assistant. Extract the requested information from the given text and return it in the specified JSON format. If information is not present, use null for that field. Return ONLY valid JSON.'
        },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.1,
        maxTokens: 500
        // Temporarily disable JSON mode as it may be causing issues
        // responseFormat: { type: 'json_object' }
      });
      
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      const content = response.completion.choices[0]?.message?.content || '{}';
      let extractedData: BatchExtractionResponse;
      
      try {
        extractedData = JSON.parse(content);
      } catch (parseError) {
        console.error('[BatchExtractor] Failed to parse JSON response:', content);
        throw new Error('Invalid JSON response from LLM');
      }
      
      // Convert batch response to ExtractionResult format
      for (const [fieldName, rule] of llmFields) {
        const fieldData = extractedData[fieldName];
        
        if (fieldData && fieldData.found && fieldData.value !== null) {
          results[fieldName] = {
            fieldName,
            attempted: true,
            successful: true,
            extractedValue: this.convertValue(fieldData.value, rule.type),
            confidence: 0.8,
            extractionMethod: 'batch_llm'
          };
        } else {
          results[fieldName] = {
            fieldName,
            attempted: true,
            successful: false,
            confidence: 0,
            extractionMethod: 'batch_llm'
          };
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('[BatchExtractor] Batch extraction failed:', error);
      
      // Return empty results for all fields on error
      for (const [fieldName] of llmFields) {
        results[fieldName] = {
          fieldName,
          attempted: true,
          successful: false,
          confidence: 0,
          extractionMethod: 'batch_llm'
        };
      }
      
      return results;
    }
  }
  
  /**
   * Create a structured prompt for batch extraction
   */
  private static createBatchExtractionPrompt(
    message: string,
    fields: Array<[string, ExtractionRule]>
  ): string {
    const fieldDescriptions = fields.map(([fieldName, rule]) => {
      const typeHint = this.getTypeHint(rule.type);
      return `- ${fieldName}: ${rule.description || fieldName} (${typeHint})`;
    }).join('\n');
    
    const exampleResponse: BatchExtractionResponse = {};
    for (const [fieldName, rule] of fields) {
      exampleResponse[fieldName] = {
        value: rule.type === 'number' ? 5 : 
               rule.type === 'array' ? ['example'] : 
               rule.type === 'boolean' ? true : 'example',
        found: true
      };
    }
    
    return `Extract the following information from the user's message:

${fieldDescriptions}

User Message: "${message}"

Return a JSON object with the following structure:
${JSON.stringify(exampleResponse, null, 2)}

For each field:
- Set "found" to true if the information is present, false otherwise
- Set "value" to the extracted value if found, null if not found
- For person names, only extract if they are introducing themselves (not general greetings like "I'm fine")
- For roles/titles, extract the job title only, not the company name

IMPORTANT: Return ONLY valid JSON, no additional text.`;
  }
  
  /**
   * Get type hint for extraction
   */
  private static getTypeHint(type: string): string {
    switch (type) {
      case 'number':
        return 'numeric value';
      case 'boolean':
        return 'true/false';
      case 'array':
        return 'list of values';
      default:
        return 'text';
    }
  }
  
  /**
   * Convert extracted value to correct type
   */
  private static convertValue(value: any, type: string): any {
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value : parseInt(value, 10);
      case 'boolean':
        return typeof value === 'boolean' ? value : value === 'true';
      case 'array':
        return Array.isArray(value) ? value : [value];
      default:
        return String(value);
    }
  }
}