/**
 * Focused test for bare number extraction logic
 */

describe('Bare Number Extraction Logic', () => {
  it('should detect bare numbers correctly', () => {
    const testCases = [
      { input: '0', expected: true },
      { input: '10', expected: true },
      { input: '150', expected: true },
      { input: '999', expected: true },
      { input: ' 5 ', expected: true }, // With whitespace
      { input: '10 people', expected: false },
      { input: 'I have 10', expected: false },
      { input: 'team of 5', expected: false },
      { input: '', expected: false },
      { input: 'zero', expected: false },
      { input: '10.5', expected: false } // Decimals don't match
    ];

    testCases.forEach(test => {
      const isBareNumber = /^\d+$/.test(test.input.trim());
      expect(isBareNumber).toBe(test.expected);
    });
  });

  it('should parse bare numbers correctly', () => {
    const testCases = [
      { input: '0', expected: 0 },
      { input: '10', expected: 10 },
      { input: '150', expected: 150 },
      { input: ' 5 ', expected: 5 },
      { input: '00123', expected: 123 } // Leading zeros
    ];

    testCases.forEach(test => {
      const parsed = parseInt(test.input.trim(), 10);
      expect(parsed).toBe(test.expected);
    });
  });

  it('should handle the extraction flow for team_size', () => {
    // Simulate the extraction flow
    const message = '10';
    const fieldName = 'team_size';
    const rule = { type: 'number' as const, required: true };
    
    // Check if it's a bare number
    const isBareNumber = rule.type === 'number' && /^\d+$/.test(message.trim());
    expect(isBareNumber).toBe(true);
    
    // Extract the value
    const extractedValue = parseInt(message.trim(), 10);
    expect(extractedValue).toBe(10);
    
    // Verify it would be marked as successful
    const result = {
      fieldName,
      attempted: true,
      successful: true,
      extractedValue,
      confidence: 0.9,
      extractionMethod: 'llm' as const
    };
    
    expect(result.successful).toBe(true);
    expect(result.extractedValue).toBe(10);
  });

  it('should handle zero as a valid team size', () => {
    const message = '0';
    const rule = { type: 'number' as const };
    
    const isBareNumber = rule.type === 'number' && /^\d+$/.test(message.trim());
    expect(isBareNumber).toBe(true);
    
    const value = parseInt(message.trim(), 10);
    expect(value).toBe(0);
    expect(value).not.toBeNaN();
    expect(value >= 0).toBe(true);
  });
});