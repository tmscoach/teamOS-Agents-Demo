import { ExtractionProcessor, ExtractionRule } from '../extraction-processor';

// Mock the LLM provider
jest.mock('../../llm', () => ({
  LLMProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockImplementation(async (messages) => {
      // Simple mock that extracts based on the prompt content
      const userMessage = messages[1]?.content || '';
      
      // Mock responses for different extraction types
      if (userMessage.includes('Team Size') && userMessage.includes('"0"')) {
        return { completion: { choices: [{ message: { content: '0' } }] } };
      }
      if (userMessage.includes('Team Size') && userMessage.includes('"10"')) {
        return { completion: { choices: [{ message: { content: '10' } }] } };
      }
      if (userMessage.includes('Team Size') && userMessage.includes('"150"')) {
        return { completion: { choices: [{ message: { content: '150' } }] } };
      }
      
      // Mock name extraction
      if (userMessage.includes('person\'s name')) {
        const match = userMessage.match(/"([^"]+)"/);
        if (match) {
          const input = match[1];
          if (input.match(/^[A-Za-z]+$/)) {
            return { completion: { choices: [{ message: { content: input.charAt(0).toUpperCase() + input.slice(1).toLowerCase() } }] } };
          }
          if (input.includes("I'm")) {
            const name = input.split("I'm ")[1]?.split(' ')[0];
            if (name) {
              return { completion: { choices: [{ message: { content: name } }] } };
            }
          }
        }
      }
      
      // Default to NOT_FOUND
      return { completion: { choices: [{ message: { content: 'NOT_FOUND' } }] } };
    })
  }))
}));

describe('ExtractionProcessor', () => {
  describe('Bare Number Extraction', () => {
    const teamSizeRule: ExtractionRule = {
      type: 'number',
      required: true,
      description: 'Team size'
    };

    it('should extract bare number "0"', async () => {
      const results = await ExtractionProcessor.extractFromMessage(
        '0',
        { team_size: teamSizeRule },
        { 
          conversationId: 'test-1', 
          agentName: 'OnboardingAgent',
          enableLLMFallback: true 
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0].successful).toBe(true);
      expect(results[0].extractedValue).toBe(0);
      expect(results[0].extractionMethod).toBe('llm');
    });

    it('should extract bare number "10"', async () => {
      const results = await ExtractionProcessor.extractFromMessage(
        '10',
        { team_size: teamSizeRule },
        { 
          conversationId: 'test-2', 
          agentName: 'OnboardingAgent',
          enableLLMFallback: true 
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0].successful).toBe(true);
      expect(results[0].extractedValue).toBe(10);
      expect(results[0].extractionMethod).toBe('llm');
    });

    it('should extract large bare numbers', async () => {
      const results = await ExtractionProcessor.extractFromMessage(
        '150',
        { team_size: teamSizeRule },
        { 
          conversationId: 'test-3', 
          agentName: 'OnboardingAgent',
          enableLLMFallback: true 
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0].successful).toBe(true);
      expect(results[0].extractedValue).toBe(150);
      expect(results[0].extractionMethod).toBe('llm');
    });
  });

  describe('Name Extraction', () => {
    const nameRule: ExtractionRule = {
      type: 'string',
      required: true,
      description: 'User name'
    };

    it('should extract single word names', async () => {
      const testCases = ['john', 'John', 'JOHN', 'rowan', 'Rowan', 'sarah', 'Sarah'];
      
      for (const name of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(
          name,
          { user_name: nameRule },
          { 
            conversationId: `test-name-${name}`, 
            agentName: 'OnboardingAgent',
            enableLLMFallback: true 
          }
        );

        expect(results).toHaveLength(1);
        expect(results[0].successful).toBe(true);
        // Should capitalize properly
        const expectedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        expect(results[0].extractedValue).toBe(expectedName);
      }
    });

    it('should extract names from introductions', async () => {
      const testCases = [
        { input: "Hi I'm John", expected: "John" },
        { input: "Hello I'm Sarah", expected: "Sarah" },
        { input: "My name is Rowan", expected: "Rowan" },
        { input: "I'm Mike", expected: "Mike" }
      ];
      
      for (const test of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(
          test.input,
          { user_name: nameRule },
          { 
            conversationId: `test-intro-${test.expected}`, 
            agentName: 'OnboardingAgent',
            enableLLMFallback: true 
          }
        );

        expect(results).toHaveLength(1);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBe(test.expected);
      }
    });

    it('should NOT extract non-name responses', async () => {
      const testCases = [
        "I'm fine",
        "I'm good", 
        "I just want to understand",
        "I have 3 people in my team",
        "I manage 5 people"
      ];
      
      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(
          input,
          { user_name: nameRule },
          { 
            conversationId: `test-nonname-${input}`, 
            agentName: 'OnboardingAgent',
            enableLLMFallback: true 
          }
        );

        expect(results).toHaveLength(1);
        expect(results[0].successful).toBe(false);
      }
    });
  });

  describe('Role Extraction', () => {
    const roleRule: ExtractionRule = {
      type: 'string',
      required: true,
      description: 'User role'
    };

    it('should extract various role formats', async () => {
      const testCases = [
        { input: "I'm a software engineer", expected: "Software Engineer" },
        { input: "I work as a team lead", expected: "Team Lead" },
        { input: "My role is CTO", expected: "CTO" },
        { input: "I'm the VP of Engineering", expected: "VP of Engineering" },
        { input: "actually 'BHP' and I'm a CTO there", expected: "CTO" }
      ];
      
      for (const test of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(
          test.input,
          { user_role: roleRule },
          { 
            conversationId: `test-role-${test.expected}`, 
            agentName: 'OnboardingAgent',
            enableLLMFallback: true 
          }
        );

        expect(results).toHaveLength(1);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBe(test.expected);
      }
    });
  });

  describe('Primary Challenge Extraction', () => {
    const challengeRule: ExtractionRule = {
      type: 'string',
      required: true,
      description: 'Primary challenge'
    };

    it('should extract challenge descriptions', async () => {
      const testCases = [
        { 
          input: "Our main challenge is poor communication between teams", 
          expected: "poor communication between teams" 
        },
        { 
          input: "We're struggling with low team morale", 
          expected: "low team morale" 
        },
        { 
          input: "The biggest issue is unclear priorities", 
          expected: "unclear priorities" 
        }
      ];
      
      for (const test of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(
          test.input,
          { primary_challenge: challengeRule },
          { 
            conversationId: `test-challenge-${test.expected}`, 
            agentName: 'OnboardingAgent',
            enableLLMFallback: true 
          }
        );

        expect(results).toHaveLength(1);
        expect(results[0].successful).toBe(true);
        // Challenge extraction may vary slightly, just check it contains key words
        const extracted = results[0].extractedValue as string;
        expect(extracted.toLowerCase()).toContain(test.expected.split(' ')[0]);
      }
    });
  });

  describe('Multiple Field Extraction', () => {
    it('should extract multiple fields from one message', async () => {
      const rules = {
        user_name: { type: 'string' as const, required: true },
        user_role: { type: 'string' as const, required: true }
      };

      const results = await ExtractionProcessor.extractFromMessage(
        "Hi, I'm Sarah and I'm a Product Manager",
        rules,
        { 
          conversationId: 'test-multi', 
          agentName: 'OnboardingAgent',
          enableLLMFallback: true 
        }
      );

      expect(results).toHaveLength(2);
      
      const nameResult = results.find(r => r.fieldName === 'user_name');
      expect(nameResult?.successful).toBe(true);
      expect(nameResult?.extractedValue).toBe('Sarah');
      
      const roleResult = results.find(r => r.fieldName === 'user_role');
      expect(roleResult?.successful).toBe(true);
      expect(roleResult?.extractedValue).toBe('Product Manager');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', async () => {
      const results = await ExtractionProcessor.extractFromMessage(
        '',
        { team_size: { type: 'number', required: true } },
        { 
          conversationId: 'test-empty', 
          agentName: 'OnboardingAgent',
          enableLLMFallback: true 
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0].successful).toBe(false);
    });

    it('should handle whitespace-only messages', async () => {
      const results = await ExtractionProcessor.extractFromMessage(
        '   \n\t   ',
        { team_size: { type: 'number', required: true } },
        { 
          conversationId: 'test-whitespace', 
          agentName: 'OnboardingAgent',
          enableLLMFallback: true 
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0].successful).toBe(false);
    });

    it('should handle special team size phrases', async () => {
      const testCases = [
        { input: "it's just me", expected: 1 },
        { input: "I work alone", expected: 1 },
        { input: "solo", expected: 1 },
        { input: "no team yet", expected: 1 }
      ];

      for (const test of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(
          test.input,
          { team_size: { type: 'number', required: true } },
          { 
            conversationId: `test-special-${test.input}`, 
            agentName: 'OnboardingAgent',
            enableLLMFallback: true 
          }
        );

        expect(results).toHaveLength(1);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBe(test.expected);
      }
    });
  });
});