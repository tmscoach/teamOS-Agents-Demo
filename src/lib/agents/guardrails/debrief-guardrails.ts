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

        // Extract subscription ID from input to verify ownership
        const subscriptionMatch = input.match(/subscription\s*(?:id\s*)?[:\s]*(\d+)/i);
        if (subscriptionMatch) {
          const subscriptionId = subscriptionMatch[1];
          
          try {
            // Verify user has access to this subscription
            // In mock mode, check against the mock data store
            if (process.env.NEXT_PUBLIC_USE_MOCK_TMS_API === 'true') {
              const { mockDataStore } = await import('@/lib/mock-tms-api/mock-data-store');
              const subscription = mockDataStore.getSubscription(subscriptionId);
              
              if (subscription) {
                // Check if user owns the subscription
                if (subscription.userId !== context.managerId) {
                  // Check if user is part of the same organization
                  const user = mockDataStore.getUser(context.managerId);
                  const subscriptionOwner = mockDataStore.getUser(subscription.userId);
                  
                  if (!user || !subscriptionOwner || user.organizationId !== subscriptionOwner.organizationId) {
                    // Log unauthorized access attempt
                    console.warn(`[ReportAccess] Unauthorized access attempt: User ${context.managerId} tried to access subscription ${subscriptionId} owned by ${subscription.userId}`);
                    
                    return {
                      passed: false,
                      reason: 'This subscription belongs to another user. You can only access reports for your own assessments or those of your team members.',
                      metadata: {
                        subscriptionId,
                        severity: 'high',
                        category: 'unauthorized_subscription_access',
                        attemptedUserId: context.managerId,
                        actualOwnerId: subscription.userId
                      }
                    };
                  }
                }
              }
            } else {
              // In production, verify against real database
              // This would need proper implementation based on your subscription model
              const { default: prisma } = await import('@/lib/db');
              
              // Check if user has access through their team
              const user = await prisma.user.findUnique({
                where: { id: context.managerId },
                include: {
                  Team_User_teamIdToTeam: {
                    include: {
                      User_User_teamIdToTeam: {
                        select: { id: true }
                      }
                    }
                  }
                }
              });
              
              if (!user) {
                return {
                  passed: false,
                  reason: 'Unable to verify your identity. Please log in again.',
                  metadata: {
                    severity: 'high',
                    category: 'user_not_found'
                  }
                };
              }
              
              // TODO: Implement actual subscription ownership check
              // For now, we'll audit log the access attempt
              console.info(`[ReportAccess] User ${context.managerId} accessing subscription ${subscriptionId}`);
            }
          } catch (error) {
            console.error('[ReportAccess] Error checking subscription access:', error);
            // Fail closed - deny access if we can't verify
            return {
              passed: false,
              reason: 'Unable to verify subscription access. Please try again later.',
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error',
                severity: 'medium',
                category: 'verification_error'
              }
            };
          }
        }

        return { passed: true };
      }
    };
  }
}