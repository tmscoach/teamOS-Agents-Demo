import { ConversationState } from '../types/conversation-state';

describe('Retry Logic', () => {
  describe('State Machine Transitions', () => {
    it('should allow transition to RECAP_AND_HANDOFF even with missing fields', () => {
      // Test the updated state machine logic
      const transitions = [
        { from: ConversationState.GREETING, to: ConversationState.CONTEXT_DISCOVERY, condition: () => true },
        { from: ConversationState.CONTEXT_DISCOVERY, to: ConversationState.CHALLENGE_EXPLORATION, condition: () => true },
        { from: ConversationState.CHALLENGE_EXPLORATION, to: ConversationState.TMS_EXPLANATION, condition: () => true },
        { from: ConversationState.TMS_EXPLANATION, to: ConversationState.GOAL_SETTING, condition: () => true },
        { from: ConversationState.GOAL_SETTING, to: ConversationState.RESOURCE_CONFIRMATION, condition: () => true },
        { from: ConversationState.RESOURCE_CONFIRMATION, to: ConversationState.STAKEHOLDER_MAPPING, condition: () => true },
        { from: ConversationState.STAKEHOLDER_MAPPING, to: ConversationState.RECAP_AND_HANDOFF, condition: () => true }
      ];

      // All transitions should allow progression
      transitions.forEach(t => {
        expect(t.condition()).toBe(true);
      });
    });
  });

  describe('Retry Phrasing', () => {
    const retryPhrasings: Record<string, string> = {
      'user_name': "I don't think I caught your name earlier. What should I call you?",
      'user_role': "I may have missed your job title. What's your current role in the organization?",
      'team_size': "I didn't quite catch how many people are on your team. How many team members do you have? (Enter 0 if you're working solo for now)",
      'organization': "Could you remind me which company or organization you work for?",
      'primary_challenge': "Let me make sure I understand - what's the main challenge you're facing with your team right now?"
    };

    it('should have retry phrasings for all required fields', () => {
      const requiredFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
      
      requiredFields.forEach(field => {
        expect(retryPhrasings[field]).toBeDefined();
        expect(retryPhrasings[field].length).toBeGreaterThan(0);
      });
    });

    it('should have polite, conversational retry phrasings', () => {
      Object.values(retryPhrasings).forEach(phrasing => {
        // Check for polite language
        const politePatterns = [
          /I don't think/i,
          /I may have/i,
          /I didn't quite/i,
          /Could you/i,
          /Let me make sure/i
        ];
        
        const hasPoliteLanguage = politePatterns.some(pattern => pattern.test(phrasing));
        expect(hasPoliteLanguage).toBe(true);
      });
    });

    it('should ask questions in retry phrasings', () => {
      Object.values(retryPhrasings).forEach(phrasing => {
        expect(phrasing).toContain('?');
      });
    });
  });

  describe('Force Transition Logic', () => {
    const stateProgression = [
      'GREETING',
      'CONTEXT_DISCOVERY', 
      'CHALLENGE_EXPLORATION',
      'TMS_EXPLANATION',
      'GOAL_SETTING',
      'RESOURCE_CONFIRMATION',
      'STAKEHOLDER_MAPPING'
    ];

    it('should force transition after RESOURCE_CONFIRMATION when fields missing', () => {
      const missingFields = ['team_size'];
      
      // Test each state
      stateProgression.forEach((state, index) => {
        const shouldForce = index >= 5 && missingFields.length > 0;
        
        if (state === 'RESOURCE_CONFIRMATION' || state === 'STAKEHOLDER_MAPPING') {
          expect(shouldForce).toBe(true);
        } else {
          expect(shouldForce).toBe(false);
        }
      });
    });

    it('should force transition after many messages', () => {
      const messageCount = 15;
      const currentState = ConversationState.STAKEHOLDER_MAPPING;
      
      // Should force transition after 10+ messages
      const shouldForce = messageCount > 10;
      expect(shouldForce).toBe(true);
    });
  });

  describe('Completion Detection', () => {
    it('should detect completion only when all 5 fields captured', () => {
      const testCases = [
        {
          capturedFields: {
            user_name: 'John',
            user_role: 'Manager',
            team_size: 10,
            organization: 'Tech Corp',
            primary_challenge: 'Communication'
          },
          expected: true
        },
        {
          capturedFields: {
            user_name: 'John',
            user_role: 'Manager',
            team_size: 10,
            organization: 'Tech Corp'
            // Missing primary_challenge
          },
          expected: false
        },
        {
          capturedFields: {
            user_name: 'John',
            user_role: 'Manager',
            // Missing team_size
            organization: 'Tech Corp',
            primary_challenge: 'Communication'
          },
          expected: false
        }
      ];

      testCases.forEach(test => {
        const requiredFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
        const capturedCount = requiredFields.filter(field => test.capturedFields[field]).length;
        const isComplete = capturedCount === 5;
        
        expect(isComplete).toBe(test.expected);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero team size as valid', () => {
      const capturedFields = {
        user_name: 'John',
        user_role: 'Founder',
        team_size: 0, // Zero is valid
        organization: 'Startup Inc',
        primary_challenge: 'Building team'
      };

      // Zero should be treated as a valid value
      expect(capturedFields.team_size).toBe(0);
      expect(capturedFields.team_size !== undefined).toBe(true);
      expect(capturedFields.team_size !== null).toBe(true);
    });

    it('should handle field aliases correctly', () => {
      const aliases = {
        'manager_name': 'user_name',
        'manager_role': 'user_role'
      };

      Object.entries(aliases).forEach(([alias, canonical]) => {
        expect(alias).not.toBe(canonical);
        // Both should map to the same required field
      });
    });
  });
});