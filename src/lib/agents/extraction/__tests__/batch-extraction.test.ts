/**
 * Tests for batch extraction
 */

import { BatchExtractor } from '../batch-extraction';
import { ExtractionRule } from '../extraction-processor';

// Mock the LLM provider
jest.mock('../../llm', () => ({
  LLMProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue({
      completion: {
        choices: [{
          message: {
            content: JSON.stringify({
              manager_name: { value: 'John Smith', found: true },
              team_size: { value: 5, found: true },
              organization: { value: null, found: false }
            })
          }
        }]
      }
    })
  }))
}));

describe('BatchExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractBatch', () => {
    it('should extract multiple fields in a single LLM call', async () => {
      const fields: Record<string, ExtractionRule> = {
        manager_name: {
          type: 'string',
          description: 'Manager name',
          preferLLM: true,
          required: true
        },
        team_size: {
          type: 'number',
          description: 'Team size',
          preferLLM: true,
          required: true
        },
        organization: {
          type: 'string',
          description: 'Organization name',
          preferLLM: true,
          required: false
        }
      };

      const results = await BatchExtractor.extractBatch({
        message: "I'm John Smith and I manage a team of 5 people",
        fields
      });

      expect(results.manager_name).toEqual({
        fieldName: 'manager_name',
        attempted: true,
        successful: true,
        extractedValue: 'John Smith',
        confidence: 0.8,
        extractionMethod: 'batch_llm'
      });

      expect(results.team_size).toEqual({
        fieldName: 'team_size',
        attempted: true,
        successful: true,
        extractedValue: 5,
        confidence: 0.8,
        extractionMethod: 'batch_llm'
      });

      expect(results.organization).toEqual({
        fieldName: 'organization',
        attempted: true,
        successful: false,
        confidence: 0,
        extractionMethod: 'batch_llm'
      });
    });

    it('should handle empty fields gracefully', async () => {
      const results = await BatchExtractor.extractBatch({
        message: 'Hello world',
        fields: {}
      });

      expect(results).toEqual({});
    });

    it('should handle LLM errors gracefully', async () => {
      // Mock LLM error
      const { LLMProvider } = require('../../llm');
      LLMProvider.mockImplementation(() => ({
        generateResponse: jest.fn().mockRejectedValue(new Error('LLM error'))
      }));

      const fields: Record<string, ExtractionRule> = {
        test_field: {
          type: 'string',
          required: true
        }
      };

      const results = await BatchExtractor.extractBatch({
        message: 'Test message',
        fields
      });

      expect(results.test_field).toEqual({
        fieldName: 'test_field',
        attempted: true,
        successful: false,
        confidence: 0,
        extractionMethod: 'batch_llm'
      });
    });

    it('should convert values to correct types', async () => {
      const { LLMProvider } = require('../../llm');
      LLMProvider.mockImplementation(() => ({
        generateResponse: jest.fn().mockResolvedValue({
          completion: {
            choices: [{
              message: {
                content: JSON.stringify({
                  count: { value: '42', found: true },
                  enabled: { value: 'true', found: true },
                  tags: { value: ['tag1', 'tag2'], found: true }
                })
              }
            }]
          }
        })
      }));

      const fields: Record<string, ExtractionRule> = {
        count: { type: 'number', required: true },
        enabled: { type: 'boolean', required: true },
        tags: { type: 'array', required: true }
      };

      const results = await BatchExtractor.extractBatch({
        message: 'Test message',
        fields
      });

      expect(results.count.extractedValue).toBe(42);
      expect(typeof results.count.extractedValue).toBe('number');

      expect(results.enabled.extractedValue).toBe(true);
      expect(typeof results.enabled.extractedValue).toBe('boolean');

      expect(results.tags.extractedValue).toEqual(['tag1', 'tag2']);
      expect(Array.isArray(results.tags.extractedValue)).toBe(true);
    });
  });
});