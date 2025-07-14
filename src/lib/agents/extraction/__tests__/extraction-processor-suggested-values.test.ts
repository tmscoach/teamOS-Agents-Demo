import { ExtractionProcessor, ExtractionRule } from '../extraction-processor';

// Mock OpenAI for LLM extraction
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                manager_role: 'CTO'
              })
            }
          }]
        })
      }
    }
  }));
});

describe('ExtractionProcessor - Suggested Values', () => {
  const mockContext = {
    conversationId: 'test-conv-123',
    agentName: 'OnboardingAgent',
    teamId: 'team-123',
    managerId: 'manager-123'
  };

  describe('Extraction rules with suggested values', () => {
    it('should preserve suggested values in extraction rules', () => {
      const rules: Record<string, ExtractionRule> = {
        primary_challenge: {
          type: 'string',
          description: 'Main team challenge',
          required: true,
          patterns: ['challenge', 'problem', 'issue'],
          suggestedValues: [
            'Communication and collaboration issues',
            'Low team morale or engagement',
            'Unclear goals and priorities',
            'Performance and productivity concerns'
          ]
        }
      };

      // Verify the rule structure includes suggested values
      expect(rules.primary_challenge.suggestedValues).toBeDefined();
      expect(rules.primary_challenge.suggestedValues).toHaveLength(4);
      expect(rules.primary_challenge.suggestedValues![0]).toBe('Communication and collaboration issues');
    });

    it('should handle extraction rules without suggested values', () => {
      const rules: Record<string, ExtractionRule> = {
        team_size: {
          type: 'number',
          description: 'Number of team members',
          required: true,
          patterns: ['(\\d+)\\s*(?:people|members|employees)']
        }
      };

      expect(rules.team_size.suggestedValues).toBeUndefined();
    });

    it('should extract values normally regardless of suggested values presence', async () => {
      const rules: Record<string, ExtractionRule> = {
        primary_challenge: {
          type: 'string',
          required: true,
          patterns: ['(?:challenge|problem|issue)\\s+(?:is|are)\\s+(.+)'],
          suggestedValues: ['Communication issues', 'Low morale']
        }
      };

      const message = 'Our main challenge is communication breakdowns between teams';
      const result = await ExtractionProcessor.extractAndTrack(message, rules, mockContext);

      expect(result.extracted.primary_challenge).toBe('communication breakdowns between teams');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].successful).toBe(true);
    });
  });

  describe('Integration with extraction flow', () => {
    it('should not affect LLM extraction when suggested values are present', async () => {
      const originalEnv = process.env.ENABLE_LLM_EXTRACTION_FALLBACK;
      process.env.ENABLE_LLM_EXTRACTION_FALLBACK = 'true';

      const rules: Record<string, ExtractionRule> = {
        manager_role: {
          type: 'string',
          required: true,
          preferLLM: true,
          suggestedValues: ['CTO', 'VP Engineering', 'Engineering Manager', 'Team Lead']
        }
      };

      const message = "I'm the CTO at TechCorp";
      const result = await ExtractionProcessor.extractAndTrack(
        message, 
        rules, 
        { ...mockContext, enableLLMFallback: true }
      );

      // The extraction should work normally
      expect(result.extracted.manager_role).toBeTruthy();

      process.env.ENABLE_LLM_EXTRACTION_FALLBACK = originalEnv;
    });

    it('should handle empty suggested values array', () => {
      const rules: Record<string, ExtractionRule> = {
        team_size: {
          type: 'number',
          required: true,
          suggestedValues: []
        }
      };

      expect(rules.team_size.suggestedValues).toEqual([]);
    });
  });
});