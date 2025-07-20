/**
 * Tests for organization name extraction edge cases
 */

import { BatchExtractor } from '../batch-extraction';
import { ExtractionRule } from '../extraction-processor';

// Mock the LLM provider
jest.mock('../../llm', () => ({
  LLMProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockImplementation((messages) => {
      const userMessage = messages[1].content;
      
      // Test responses for different organization names
      if (userMessage.includes('User Message: "Allen Ovary"')) {
        return Promise.resolve({
          completion: {
            choices: [{
              message: {
                content: JSON.stringify({
                  organization: { value: 'Allen Ovary', found: true }
                })
              }
            }]
          }
        });
      }
      
      if (userMessage.includes('User Message: "Morgan Stanley"')) {
        return Promise.resolve({
          completion: {
            choices: [{
              message: {
                content: JSON.stringify({
                  organization: { value: 'Morgan Stanley', found: true }
                })
              }
            }]
          }
        });
      }
      
      if (userMessage.includes('User Message: "John Lewis"')) {
        return Promise.resolve({
          completion: {
            choices: [{
              message: {
                content: JSON.stringify({
                  organization: { value: 'John Lewis', found: true }
                })
              }
            }]
          }
        });
      }
      
      return Promise.resolve({
        completion: {
          choices: [{
            message: {
              content: JSON.stringify({
                organization: { value: null, found: false }
              })
            }}]
          }
        });
    })
  }))
}));

describe('Organization Name Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractBatch - organization names that sound like person names', () => {
    it('should extract "Allen Ovary" as an organization name', async () => {
      const fields: Record<string, ExtractionRule> = {
        organization: {
          type: 'string',
          description: 'The user\'s organization',
          preferLLM: true,
          required: true
        }
      };

      const results = await BatchExtractor.extractBatch({
        message: 'Allen Ovary',
        fields
      });

      expect(results.organization).toEqual({
        fieldName: 'organization',
        attempted: true,
        successful: true,
        extractedValue: 'Allen Ovary',
        confidence: 0.8,
        extractionMethod: 'llm'
      });
    });

    it('should extract "Morgan Stanley" as an organization name', async () => {
      const fields: Record<string, ExtractionRule> = {
        organization: {
          type: 'string',
          description: 'The user\'s organization',
          preferLLM: true,
          required: true
        }
      };

      const results = await BatchExtractor.extractBatch({
        message: 'Morgan Stanley',
        fields
      });

      expect(results.organization).toEqual({
        fieldName: 'organization',
        attempted: true,
        successful: true,
        extractedValue: 'Morgan Stanley',
        confidence: 0.8,
        extractionMethod: 'llm'
      });
    });

    it('should extract "John Lewis" as an organization name', async () => {
      const fields: Record<string, ExtractionRule> = {
        organization: {
          type: 'string',
          description: 'The user\'s organization',
          preferLLM: true,
          required: true
        }
      };

      const results = await BatchExtractor.extractBatch({
        message: 'John Lewis',
        fields
      });

      expect(results.organization).toEqual({
        fieldName: 'organization',
        attempted: true,
        successful: true,
        extractedValue: 'John Lewis',
        confidence: 0.8,
        extractionMethod: 'llm'
      });
    });
  });
});