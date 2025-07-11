import { ExtractionProcessor, ExtractionRule, ExtractionContext } from '../extraction-processor';

// Mock the LLM provider
jest.mock('../../llm', () => ({
  LLMProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockImplementation((prompt) => {
      // Mock responses based on prompt content
      if (prompt.includes('manager_name') && prompt.includes('"Sarah from engineering"')) {
        return Promise.resolve({ content: 'Sarah' });
      }
      if (prompt.includes('team_size') && prompt.includes('"we have about fifteen people"')) {
        return Promise.resolve({ content: '15' });
      }
      if (prompt.includes('department') && prompt.includes('"I work in the finance department"')) {
        return Promise.resolve({ content: 'finance department' });
      }
      return Promise.resolve({ content: 'NOT_FOUND' });
    })
  }))
}));

describe('LLM Extraction Fallback', () => {
  const context: ExtractionContext = {
    conversationId: 'test-123',
    agentName: 'TestAgent',
    enableLLMFallback: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to avoid test skipping
    process.env.NODE_ENV = 'development';
  });

  test('should fall back to LLM when regex fails for required field', async () => {
    const rules: Record<string, ExtractionRule> = {
      manager_name: {
        type: 'string',
        patterns: ["I'm\\s+([A-Z][a-z]+)"], // Won't match "Sarah from engineering"
        required: true,
        useLLMFallback: true,
        description: 'Extract the manager name'
      }
    };

    const message = "Hi there, Sarah from engineering here to learn about TMS";
    const results = await ExtractionProcessor.extractFromMessage(message, rules, context);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      fieldName: 'manager_name',
      attempted: true,
      successful: true,
      extractedValue: 'Sarah',
      extractionMethod: 'llm',
      confidence: 0.8
    });
  });

  test('should extract number type correctly with LLM', async () => {
    const rules: Record<string, ExtractionRule> = {
      team_size: {
        type: 'number',
        patterns: ["(\\d+)\\s+people"], // Won't match "about fifteen people"
        required: true,
        useLLMFallback: true,
        description: 'Number of team members'
      }
    };

    const message = "Hi, we have about fifteen people on our team";
    const results = await ExtractionProcessor.extractFromMessage(message, rules, context);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      fieldName: 'team_size',
      attempted: true,
      successful: true,
      extractedValue: 15,
      extractionMethod: 'llm'
    });
  });

  test('should use regex when it succeeds, not LLM', async () => {
    const rules: Record<string, ExtractionRule> = {
      team_size: {
        type: 'number',
        patterns: ["(\\d+)\\s+people"],
        required: true,
        useLLMFallback: true
      }
    };

    const message = "We have 10 people on our team";
    const results = await ExtractionProcessor.extractFromMessage(message, rules, context);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      fieldName: 'team_size',
      attempted: true,
      successful: true,
      extractedValue: 10,
      extractionMethod: 'regex'
    });
  });

  test('should not use LLM if useLLMFallback is false', async () => {
    const rules: Record<string, ExtractionRule> = {
      department: {
        type: 'string',
        patterns: ["work in (\\w+) department"], // Won't match "the finance department"
        required: true,
        useLLMFallback: false
      }
    };

    const message = "I work in the finance department";
    const results = await ExtractionProcessor.extractFromMessage(message, rules, context);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      fieldName: 'department',
      attempted: true,
      successful: false,
      extractionMethod: 'regex'
    });
  });

  test('should not use LLM if context.enableLLMFallback is false', async () => {
    const disabledContext: ExtractionContext = {
      ...context,
      enableLLMFallback: false
    };

    const rules: Record<string, ExtractionRule> = {
      manager_name: {
        type: 'string',
        patterns: ["I'm\\s+([A-Z][a-z]+)"],
        required: true,
        useLLMFallback: true
      }
    };

    const message = "Sarah from engineering here";
    const results = await ExtractionProcessor.extractFromMessage(message, rules, disabledContext);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      fieldName: 'manager_name',
      attempted: true,
      successful: false,
      extractionMethod: 'regex'
    });
  });

  test('should handle LLM returning NOT_FOUND', async () => {
    const rules: Record<string, ExtractionRule> = {
      unknown_field: {
        type: 'string',
        patterns: ["pattern_that_wont_match"],
        required: true,
        useLLMFallback: true,
        description: 'Some unknown field'
      }
    };

    const message = "This message doesn't contain the field we're looking for";
    const results = await ExtractionProcessor.extractFromMessage(message, rules, context);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      fieldName: 'unknown_field',
      attempted: true,
      successful: false,
      extractionMethod: 'llm',
      confidence: 0
    });
  });
});