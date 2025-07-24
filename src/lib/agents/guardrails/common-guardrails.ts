import { Guardrail, GuardrailResult, AgentContext } from '../types';

export interface CommonGuardrailConfig {
  enableProfanityCheck?: boolean;
  enableSafetyCheck?: boolean;
  maxMessageLength?: number;
}

export class CommonGuardrails {
  static readonly DEFAULT_MAX_MESSAGE_LENGTH = 2000;

  static createGuardrails(config?: CommonGuardrailConfig): Guardrail[] {
    const guardrails: Guardrail[] = [];

    // Add profanity check if not disabled
    if (config?.enableProfanityCheck !== false) {
      guardrails.push(this.createProfanityGuardrail());
    }

    // Add safety check if not disabled
    if (config?.enableSafetyCheck !== false) {
      guardrails.push(this.createSafetyGuardrail());
    }

    // Add message length check
    guardrails.push(this.createMessageLengthGuardrail(config?.maxMessageLength));

    return guardrails;
  }

  private static createProfanityGuardrail(): Guardrail {
    return {
      name: 'ProfanityCheck',
      description: 'Detects and prevents processing of messages with profanity',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        console.log('[ProfanityCheck] Checking input:', input);
        const lowerInput = input.toLowerCase();

        // Strong profanity patterns (results in immediate failure)
        const strongProfanityPatterns = [
          /\bf+u+c+k+/i,  // fuck and variations
          /\bs+h+i+t+/i,  // shit and variations
          /\ba+s+s+h+o+l+e+/i,  // asshole
          /\bb+i+t+c+h+/i,  // bitch
          /\bc+u+n+t+/i,  // cunt
          /\bd+i+c+k+/i,  // dick
          /\bp+i+s+s+/i,  // piss
          /\bc+o+c+k+/i,  // cock
          /\bb+a+s+t+a+r+d+/i,  // bastard
        ];

        for (const pattern of strongProfanityPatterns) {
          if (pattern.test(lowerInput)) {
            console.log('[ProfanityCheck] Profanity detected! Pattern matched:', pattern);
            return {
              passed: false,
              reason: 'Please keep the conversation professional and respectful.',
              metadata: {
                severity: 'high',
                category: 'profanity'
              }
            };
          }
        }

        // Mild profanity patterns (results in warning but still processes)
        const mildProfanityPatterns = [
          /\b(damn|hell|crap)\b/i,
          /\b(stupid|dumb|idiot)\b/i,
        ];

        let warningFound = false;
        for (const pattern of mildProfanityPatterns) {
          if (pattern.test(lowerInput)) {
            warningFound = true;
            break;
          }
        }

        if (warningFound) {
          return {
            passed: true,
            metadata: {
              warning: 'Please maintain a professional tone.',
              severity: 'low',
              category: 'mild_profanity'
            }
          };
        }

        return { passed: true };
      }
    };
  }

  private static createSafetyGuardrail(): Guardrail {
    return {
      name: 'SafetyCheck',
      description: 'Detects potentially harmful or aggressive content',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        const lowerInput = input.toLowerCase();

        // Aggressive or threatening patterns
        const aggressivePatterns = [
          /\b(kill|murder|hurt|harm|attack)\b.*\b(you|me|them|someone)\b/i,
          /\b(i|we|they)\s+(will|gonna|going to)\s+(kill|murder|hurt|harm|attack)\b/i,
          /\bthreaten/i,
          /\b(hate|despise)\s+(you|this|that)\b/i,
        ];

        for (const pattern of aggressivePatterns) {
          if (pattern.test(lowerInput)) {
            return {
              passed: false,
              reason: 'I cannot process messages containing threats or aggressive language. Please rephrase your message.',
              metadata: {
                severity: 'high',
                category: 'aggressive_content'
              }
            };
          }
        }

        // Check for ALL CAPS (shouting)
        const capsRatio = (input.match(/[A-Z]/g) || []).length / input.length;
        if (capsRatio > 0.7 && input.length > 10) {
          return {
            passed: false,
            reason: 'Please avoid using all caps as it can be perceived as shouting.',
            metadata: {
              capsRatio,
              severity: 'medium',
              category: 'caps_abuse'
            }
          };
        }

        return { passed: true };
      }
    };
  }

  private static createMessageLengthGuardrail(maxLength?: number): Guardrail {
    const max = maxLength || this.DEFAULT_MAX_MESSAGE_LENGTH;

    return {
      name: 'MessageLength',
      description: 'Ensures messages are within reasonable length',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        if (input.length > max) {
          return {
            passed: false,
            reason: `Your message is too long (${input.length} characters). Please keep messages under ${max} characters.`,
            metadata: {
              length: input.length,
              max,
              severity: 'medium'
            }
          };
        }

        return { passed: true };
      }
    };
  }
}