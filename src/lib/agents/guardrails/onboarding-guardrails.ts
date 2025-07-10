import { Guardrail, GuardrailResult, AgentContext } from '../types';

export class OnboardingGuardrails {
  // Time constraints
  static readonly MAX_CONVERSATION_TIME = 45 * 60 * 1000; // 45 minutes
  static readonly MIN_CONVERSATION_TIME = 20 * 60 * 1000; // 20 minutes
  static readonly MAX_QUESTIONS_PER_TOPIC = 3;

  // Quality thresholds
  static readonly MIN_MESSAGE_LENGTH = 10;
  static readonly MAX_MESSAGE_LENGTH = 1000;

  static createGuardrails(): Guardrail[] {
    return [
      this.createTimeGuardrail(),
      this.createMessageLengthGuardrail(),
      this.createTopicRelevanceGuardrail(),
      this.createProgressGuardrail(),
      this.createProfessionalismGuardrail()
    ];
  }

  private static createTimeGuardrail(): Guardrail {
    return {
      name: 'ConversationTimeLimit',
      description: 'Ensures conversation stays within optimal time bounds',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        const metadata = context.metadata.onboarding;
        if (!metadata?.startTime) {
          return { passed: true };
        }

        const elapsed = Date.now() - new Date(metadata.startTime).getTime();
        
        if (elapsed > this.MAX_CONVERSATION_TIME) {
          return {
            passed: false,
            reason: 'Conversation has exceeded 45 minutes. Consider wrapping up and scheduling a follow-up.',
            metadata: { elapsed, limit: this.MAX_CONVERSATION_TIME }
          };
        }

        return { passed: true, metadata: { elapsed } };
      }
    };
  }

  private static createMessageLengthGuardrail(): Guardrail {
    return {
      name: 'MessageLength',
      description: 'Validates message length is appropriate',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        if (input.length < this.MIN_MESSAGE_LENGTH) {
          return {
            passed: false,
            reason: 'Message is too short. Please provide more detail.',
            metadata: { length: input.length, min: this.MIN_MESSAGE_LENGTH }
          };
        }

        if (input.length > this.MAX_MESSAGE_LENGTH) {
          return {
            passed: false,
            reason: 'Message is very long. Consider breaking it into smaller parts.',
            metadata: { length: input.length, max: this.MAX_MESSAGE_LENGTH }
          };
        }

        return { passed: true };
      }
    };
  }

  private static createTopicRelevanceGuardrail(): Guardrail {
    return {
      name: 'TopicRelevance',
      description: 'Ensures conversation stays focused on onboarding topics',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        const lowerInput = input.toLowerCase();
        
        // Skip relevance check for very first message (greeting)
        const messageCount = context.messageHistory.filter(m => m.role === 'user').length;
        if (messageCount === 0) {
          return { passed: true };
        }
        
        // Check for clearly off-topic patterns
        const offTopicPatterns = [
          // Entertainment/Pop culture
          /\b(michael jackson|taylor swift|movie|film|music|song|celebrity|singer|actor)\b/i,
          // General knowledge questions
          /\b(who is|what is|when was|where is|define|explain)\b.*\b(?!team|management|challenge|goal|transform)/i,
          // Sports/Games
          /\b(football|soccer|basketball|game|sport|play)\b/i,
          // Politics/News
          /\b(president|election|politics|news|war)\b/i,
          // Technical but unrelated
          /\b(python|javascript|code|programming|bitcoin|crypto)\b/i,
          // Support issues
          /technical support/i,
          /password reset/i,
          /billing question/i,
          /refund/i
        ];

        for (const pattern of offTopicPatterns) {
          if (pattern.test(input)) {
            return {
              passed: false,
              reason: 'I appreciate your question, but let\'s focus on your team transformation journey. Could you tell me about your team and what challenges you\'re facing?',
              metadata: { 
                detectedPattern: pattern.source,
                suggestion: 'redirect_to_onboarding',
                severity: 'medium'
              }
            };
          }
        }

        // Check for relevant keywords that indicate on-topic discussion
        const relevantKeywords = [
          'team', 'manage', 'leader', 'challenge', 'goal', 'transform', 
          'improve', 'culture', 'communication', 'performance', 'work',
          'employee', 'staff', 'department', 'company', 'organization',
          'problem', 'issue', 'help', 'better', 'change', 'growth'
        ];

        const hasRelevantContent = relevantKeywords.some(keyword => 
          lowerInput.includes(keyword)
        );

        // Check for personal/greeting words that are acceptable
        const personalKeywords = [
          'hello', 'hi', 'hey', 'name', 'nice', 'meet', 'thank', 'please',
          'yes', 'no', 'okay', 'sure', 'great', 'good'
        ];
        
        const isPersonalGreeting = personalKeywords.some(keyword => 
          lowerInput.includes(keyword)
        );

        // After initial exchanges, require relevance
        if (messageCount > 1 && !hasRelevantContent && !isPersonalGreeting && input.length > 20) {
          return {
            passed: false,
            reason: 'Let\'s keep our focus on your team transformation. What specific challenges is your team facing that brought you to TMS?',
            metadata: { 
              messageCount,
              inputLength: input.length,
              suggestion: 'guide_to_challenges',
              severity: 'low'
            }
          };
        }

        return { passed: true };
      }
    };
  }

  private static createProgressGuardrail(): Guardrail {
    return {
      name: 'ConversationProgress',
      description: 'Ensures conversation is making appropriate progress',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        const metadata = context.metadata.onboarding;
        if (!metadata) {
          return { passed: true };
        }

        const messageCount = context.messageHistory.filter(m => m.role === 'user').length;
        const stateTransitions = metadata.stateTransitions?.length || 0;

        // Check if stuck in same state too long
        if (messageCount > 5 && stateTransitions === 0) {
          return {
            passed: true,
            metadata: {
              warning: 'Conversation may be stalled. Consider moving to next topic.',
              messageCount,
              stateTransitions
            }
          };
        }

        // Check if moving too fast
        if (stateTransitions > messageCount / 2) {
          return {
            passed: true,
            metadata: {
              warning: 'Moving through states quickly. Ensure thorough information gathering.',
              messageCount,
              stateTransitions
            }
          };
        }

        return { passed: true };
      }
    };
  }

  private static createProfessionalismGuardrail(): Guardrail {
    return {
      name: 'Professionalism',
      description: 'Ensures conversation maintains professional standards',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        let warnings = [];
        let inappropriateLanguageFound = false;
        
        // Check for inappropriate language
        const inappropriatePatterns = [
          /\b(damn|hell|crap)\b/i, // Mild profanity
          /\b(stupid|dumb|idiot)\b/i, // Insults
          /\b(hate|suck|terrible)\b/i // Strong negative language
        ];

        for (const pattern of inappropriatePatterns) {
          if (pattern.test(input)) {
            inappropriateLanguageFound = true;
            warnings.push('Detected potentially negative language. Maintain supportive tone.');
            break; // We found inappropriate language, no need to check more patterns
          }
        }

        // Check for ALL CAPS (shouting) - This should ALWAYS be checked
        const capsRatio = (input.match(/[A-Z]/g) || []).length / input.length;
        if (capsRatio > 0.5 && input.length > 10) {
          return {
            passed: false,
            reason: 'Please avoid using all caps as it can be perceived as shouting.',
            metadata: { 
              capsRatio,
              inappropriateLanguage: inappropriateLanguageFound
            }
          };
        }

        // If we only found inappropriate language (no caps issue)
        if (inappropriateLanguageFound) {
          return {
            passed: true,
            metadata: {
              warning: warnings.join(' ')
            }
          };
        }

        return { passed: true };
      }
    };
  }

  // Helper method to check if required fields are being captured
  static checkRequiredFieldsProgress(metadata: any): {
    captured: string[];
    missing: string[];
    percentage: number;
  } {
    const required = [
      'team_size',
      'team_tenure',
      'primary_challenge',
      'success_metrics',
      'timeline_preference',
      'budget_range',
      'leader_commitment'
    ];

    const captured = required.filter(field => 
      metadata.capturedFields && metadata.capturedFields[field]
    );
    
    const missing = required.filter(field => 
      !metadata.capturedFields || !metadata.capturedFields[field]
    );

    return {
      captured,
      missing,
      percentage: (captured.length / required.length) * 100
    };
  }
}