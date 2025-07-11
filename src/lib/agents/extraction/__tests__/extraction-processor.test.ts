import { ExtractionProcessor, ExtractionRule } from '../extraction-processor';
import { VariableExtractionService } from '../../../services/variable-extraction';

// Mock the VariableExtractionService
jest.mock('../../../services/variable-extraction', () => ({
  VariableExtractionService: {
    trackExtractionBatch: jest.fn().mockResolvedValue(0)
  }
}));

describe('ExtractionProcessor', () => {
  let originalEnv: string | undefined;

  beforeAll(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    // Set NODE_ENV to 'development' to enable tracking in tests
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractFromMessage', () => {
    it('should extract string fields with patterns', async () => {
      const rules: Record<string, ExtractionRule> = {
        manager_name: {
          type: 'string',
          patterns: [
            "(?:I'm|I am|My name is)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)"
          ],
          required: true
        }
      };

      const message = "Hi, I'm Sarah Johnson from TechCorp";
      const results = await ExtractionProcessor.extractFromMessage(message, rules);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        fieldName: 'manager_name',
        attempted: true,
        successful: true,
        extractedValue: 'Sarah Johnson',
        confidence: expect.any(Number)
      });
    });

    it('should extract number fields', async () => {
      const rules: Record<string, ExtractionRule> = {
        team_size: {
          type: 'number',
          patterns: [
            "(\\d+)\\s*(?:people|members|employees)"
          ]
        }
      };

      const message = "We have 25 people on our team";
      const results = await ExtractionProcessor.extractFromMessage(message, rules);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        fieldName: 'team_size',
        attempted: true,
        successful: true,
        extractedValue: 25,
        confidence: expect.any(Number)
      });
    });

    it('should handle multiple patterns for a field', async () => {
      const rules: Record<string, ExtractionRule> = {
        organization: {
          type: 'string',
          patterns: [
            "(?:work at|from)\\s+([A-Za-z0-9]+)",
            "(?:company|org)\\s+(?:is|called)\\s+([A-Za-z0-9]+)"
          ]
        }
      };

      const message1 = "I work at Microsoft";
      const results1 = await ExtractionProcessor.extractFromMessage(message1, rules);
      expect(results1[0].extractedValue).toBe('Microsoft');

      const message2 = "My company is Apple";
      const results2 = await ExtractionProcessor.extractFromMessage(message2, rules);
      expect(results2[0].extractedValue).toBe('Apple');
    });

    it('should mark field as attempted but not successful when no match', async () => {
      const rules: Record<string, ExtractionRule> = {
        budget: {
          type: 'string',
          patterns: ["\\$([\\d,]+)"]
        }
      };

      const message = "We don't have a specific budget yet";
      const results = await ExtractionProcessor.extractFromMessage(message, rules);

      expect(results[0]).toMatchObject({
        fieldName: 'budget',
        attempted: true,
        successful: false,
        confidence: 0
      });
    });

    it('should handle fields with no patterns', async () => {
      const rules: Record<string, ExtractionRule> = {
        notes: {
          type: 'string',
          description: 'General notes'
          // No patterns defined
        }
      };

      const message = "Some random text";
      const results = await ExtractionProcessor.extractFromMessage(message, rules);

      expect(results[0]).toMatchObject({
        fieldName: 'notes',
        attempted: true,
        successful: false,
        confidence: 0
      });
    });

    it('should handle invalid regex patterns gracefully', async () => {
      const rules: Record<string, ExtractionRule> = {
        invalid: {
          type: 'string',
          patterns: ["[invalid(regex"]
        }
      };

      const message = "Test message";
      const results = await ExtractionProcessor.extractFromMessage(message, rules);

      expect(results[0]).toMatchObject({
        fieldName: 'invalid',
        attempted: true,
        successful: false
      });
    });
  });

  describe('confidence calculation', () => {
    it('should give higher confidence for matches at the beginning', async () => {
      const rules: Record<string, ExtractionRule> = {
        name: {
          type: 'string',
          patterns: ["([A-Z][a-z]+)"]
        }
      };

      const message1 = "John is my name";
      const message2 = "My name is John but people call me Johnny";
      
      const results1 = await ExtractionProcessor.extractFromMessage(message1, rules);
      const results2 = await ExtractionProcessor.extractFromMessage(message2, rules);

      // Both should have confidence scores
      expect(results1[0].confidence).toBeGreaterThan(0);
      expect(results2[0].confidence).toBeGreaterThan(0);
      
      // First match "John" at position 0 should have higher confidence than later match
      // Since "John" appears at position 0 in message1 and position 11 in message2
      expect(results1[0].confidence).toBeGreaterThanOrEqual(results2[0].confidence!);
    });
  });

  describe('extractAndTrack', () => {
    it('should extract and track extractions', async () => {
      const rules: Record<string, ExtractionRule> = {
        name: {
          type: 'string',
          patterns: ["I'm\\s+([A-Z][a-z]+)"]
        },
        team_size: {
          type: 'number',
          patterns: ["(\\d+)\\s+people"]
        }
      };

      const context = {
        conversationId: 'conv-123',
        agentName: 'TestAgent'
      };

      const message = "I'm Bob and we have 10 people";
      const { extracted, results } = await ExtractionProcessor.extractAndTrack(
        message,
        rules,
        context
      );

      expect(extracted).toEqual({
        name: 'Bob',
        team_size: 10
      });

      expect(results).toHaveLength(2);
      expect(VariableExtractionService.trackExtractionBatch).toHaveBeenCalled();
    });

    it('should not track in test environment', async () => {
      const oldEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      try {
        const rules: Record<string, ExtractionRule> = {
          name: { type: 'string', patterns: ["I'm\\s+([A-Z][a-z]+)"] }
        };

        const context = {
          conversationId: 'conv-123',
          agentName: 'TestAgent'
        };

        await ExtractionProcessor.extractAndTrack("I'm Alice", rules, context);
        
        expect(VariableExtractionService.trackExtractionBatch).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = oldEnv;
      }
    });

    it('should not track test conversation IDs', async () => {
      const rules: Record<string, ExtractionRule> = {
        name: { type: 'string', patterns: ["I'm\\s+([A-Z][a-z]+)"] }
      };

      const context = {
        conversationId: 'test-123',
        agentName: 'TestAgent'
      };

      await ExtractionProcessor.extractAndTrack("I'm Bob", rules, context);
      
      expect(VariableExtractionService.trackExtractionBatch).not.toHaveBeenCalled();
    });
  });
});