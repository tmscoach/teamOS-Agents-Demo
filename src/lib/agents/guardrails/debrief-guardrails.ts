import { Guardrail, GuardrailResult, AgentContext } from '../types';
import { CommonGuardrails, CommonGuardrailConfig } from './common-guardrails';

export interface DebriefGuardrailConfig extends CommonGuardrailConfig {
  maxQuestionsPerSession?: number;
  enableReportAccessCheck?: boolean;
}

export class DebriefGuardrails {
  static readonly DEFAULT_MAX_QUESTIONS_PER_SESSION = 20;

  static createGuardrails(config?: DebriefGuardrailConfig): Guardrail[] {
    // Start with common guardrails
    const guardrails = CommonGuardrails.createGuardrails(config);

    // Add debrief-specific guardrails
    guardrails.push(this.createSessionLimitGuardrail(config));

    if (config?.enableReportAccessCheck !== false) {
      guardrails.push(this.createReportAccessGuardrail());
    }

    return guardrails;
  }

  private static createSessionLimitGuardrail(config?: DebriefGuardrailConfig): Guardrail {
    const maxQuestions = config?.maxQuestionsPerSession || this.DEFAULT_MAX_QUESTIONS_PER_SESSION;

    return {
      name: 'SessionLimit',
      description: 'Ensures debrief sessions stay within reasonable bounds',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        const metadata = context.metadata;
        const questionCount = metadata?.debriefQuestionCount || 0;

        if (questionCount >= maxQuestions) {
          return {
            passed: false,
            reason: `You've reached the maximum number of questions for this session (${maxQuestions}). Please schedule a follow-up session if you need more assistance.`,
            metadata: {
              questionCount,
              maxQuestions,
              severity: 'medium'
            }
          };
        }

        // Increment question count for next check
        if (metadata) {
          metadata.debriefQuestionCount = questionCount + 1;
        }

        return { 
          passed: true,
          metadata: {
            questionCount: questionCount + 1,
            remaining: maxQuestions - questionCount - 1
          }
        };
      }
    };
  }

  private static createReportAccessGuardrail(): Guardrail {
    return {
      name: 'ReportAccess',
      description: 'Ensures users only access their own reports',
      validate: async (input: string, context: AgentContext): Promise<GuardrailResult> => {
        // Check if user is trying to access someone else's report
        const lowerInput = input.toLowerCase();
        
        // Pattern to detect attempts to access other users' data
        const unauthorizedPatterns = [
          /show\s+me\s+(?:someone\s+else's|another\s+user's|other\s+team's)/i,
          /access\s+(?:all|other)\s+reports/i,
          /subscription\s+(?:id|ids)\s+for\s+(?:all|other)\s+(?:users|teams)/i,
        ];

        for (const pattern of unauthorizedPatterns) {
          if (pattern.test(lowerInput)) {
            return {
              passed: false,
              reason: 'You can only access reports for your own team. Please provide your subscription ID or team details.',
              metadata: {
                severity: 'high',
                category: 'unauthorized_access_attempt'
              }
            };
          }
        }

        return { passed: true };
      }
    };
  }
}