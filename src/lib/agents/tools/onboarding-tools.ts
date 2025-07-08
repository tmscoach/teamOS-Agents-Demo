import { AgentTool, AgentContext, ToolResult } from '../types';

export function createOnboardingTools(): AgentTool[] {
  return [
    {
      name: 'extractTeamInfo',
      description: 'Extract team and manager information from conversation',
      parameters: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The user message to extract information from'
          },
          context: {
            type: 'object',
            description: 'The conversation context'
          }
        },
        required: ['message']
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        const { message } = params;
        const extracted: Record<string, any> = {};

        // Extract team size
        const teamSizeMatch = message.match(/(\d+)\s*(?:people|members|employees|staff|direct reports)/i);
        if (teamSizeMatch) {
          extracted.team_size = parseInt(teamSizeMatch[1]);
        }

        // Extract tenure
        const tenureMatch = message.match(/(\d+)\s*(?:years?|months?|weeks?)/i);
        if (tenureMatch) {
          extracted.team_tenure = tenureMatch[0];
        }

        // Extract manager name
        const namePatterns = [
          /(?:I'm|I am|My name is|Call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
          /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i
        ];
        for (const pattern of namePatterns) {
          const match = message.match(pattern);
          if (match) {
            extracted.name = match[1];
            break;
          }
        }

        // Extract challenges
        const challengeKeywords = ['challenge', 'problem', 'issue', 'struggle', 'difficulty', 'concern'];
        const lowerMessage = message.toLowerCase();
        for (const keyword of challengeKeywords) {
          if (lowerMessage.includes(keyword)) {
            // Extract the sentence containing the challenge
            const sentences = message.split(/[.!?]+/);
            const challengeSentence = sentences.find((s: string) => s.toLowerCase().includes(keyword));
            if (challengeSentence) {
              extracted.primary_challenge = challengeSentence.trim();
            }
            break;
          }
        }

        // Extract budget mentions
        const budgetMatch = message.match(/\$?([\d,]+k?)\s*(?:budget|to spend|available)/i);
        if (budgetMatch) {
          extracted.budget_range = budgetMatch[0];
        }

        // Extract timeline
        const timelineMatch = message.match(/(?:within|in|over the next)\s+(\d+\s*(?:months?|quarters?|years?))/i);
        if (timelineMatch) {
          extracted.timeline_preference = timelineMatch[1];
        }

        // Extract commitment level
        if (message.match(/(?:fully|totally|completely|very)\s+(?:committed|dedicated|on board)/i)) {
          extracted.leader_commitment = 'high';
        } else if (message.match(/(?:somewhat|partially|moderately)\s+(?:committed|dedicated)/i)) {
          extracted.leader_commitment = 'medium';
        }

        return {
          success: true,
          output: extracted,
          metadata: {
            fieldsExtracted: Object.keys(extracted).length
          }
        };
      }
    },

    {
      name: 'validateRequiredFields',
      description: 'Check which required fields have been captured',
      parameters: {
        type: 'object',
        properties: {
          capturedFields: {
            type: 'object',
            description: 'Currently captured fields'
          },
          requiredFields: {
            type: 'array',
            description: 'List of required fields'
          }
        },
        required: ['capturedFields', 'requiredFields']
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        const { capturedFields, requiredFields } = params;
        const validation: Record<string, boolean> = {};
        const missing: string[] = [];

        for (const field of requiredFields) {
          const isPresent = !!capturedFields[field];
          validation[field] = isPresent;
          if (!isPresent) {
            missing.push(field);
          }
        }

        const completionPercentage = (Object.values(validation).filter(Boolean).length / requiredFields.length) * 100;

        return {
          success: true,
          output: {
            validation,
            missing,
            completionPercentage,
            isComplete: missing.length === 0
          }
        };
      }
    },

    {
      name: 'assessConversationQuality',
      description: 'Evaluate the quality of the onboarding conversation',
      parameters: {
        type: 'object',
        properties: {
          messageHistory: {
            type: 'array',
            description: 'Conversation message history'
          },
          capturedFields: {
            type: 'object',
            description: 'Fields captured during conversation'
          }
        },
        required: ['messageHistory']
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        const { messageHistory = [], capturedFields = {} } = params;
        
        // Calculate various quality metrics
        const userMessages = messageHistory.filter((m: any) => m.role === 'user');
        const avgMessageLength = userMessages.length > 0 
          ? userMessages.reduce((sum: number, m: any) => sum + m.content.length, 0) / userMessages.length
          : 0;

        // Rapport indicators
        const rapportIndicators = {
          sharesPersonalContext: userMessages.some((m: any) => 
            m.content.match(/(?:my team|we've been|I've been|our company)/i)
          ),
          asksQuestions: userMessages.some((m: any) => m.content.includes('?')),
          expressesEnthusiasm: userMessages.some((m: any) => 
            m.content.match(/(?:excited|looking forward|great|wonderful|perfect)/i)
          ),
          providesDetails: avgMessageLength > 50
        };

        // Calculate rapport score
        const rapportScore = Object.values(rapportIndicators).filter(Boolean).length * 25;

        // Determine confidence level
        let confidence: 'low' | 'medium' | 'high' = 'low';
        if (rapportScore >= 75 && Object.keys(capturedFields).length > 5) {
          confidence = 'high';
        } else if (rapportScore >= 50 || Object.keys(capturedFields).length > 3) {
          confidence = 'medium';
        }

        return {
          success: true,
          output: {
            rapportScore,
            confidence,
            rapportIndicators,
            metrics: {
              messageCount: userMessages.length,
              avgMessageLength,
              fieldsCaptured: Object.keys(capturedFields).length
            }
          }
        };
      }
    },

    {
      name: 'generateHandoffDocument',
      description: 'Generate a summary document for handoff to Assessment Agent',
      parameters: {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            description: 'Onboarding metadata'
          },
          context: {
            type: 'object',
            description: 'Agent context'
          }
        },
        required: ['metadata', 'context']
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        const { metadata } = params;
        const { capturedFields, qualityMetrics, stateTransitions } = metadata;

        // Generate structured handoff document
        const handoffDocument = {
          timestamp: new Date().toISOString(),
          conversationId: context.conversationId,
          managerId: context.managerId,
          teamId: context.teamId,
          
          managerProfile: {
            name: capturedFields.name || 'Not provided',
            teamSize: capturedFields.team_size,
            teamTenure: capturedFields.team_tenure,
            industry: capturedFields.industry || 'Not specified'
          },
          
          transformationContext: {
            primaryChallenge: capturedFields.primary_challenge,
            secondaryChallenges: capturedFields.secondary_challenges || [],
            successMetrics: capturedFields.success_metrics,
            goals: capturedFields.goals || []
          },
          
          resources: {
            budgetRange: capturedFields.budget_range,
            timeline: capturedFields.timeline_preference,
            leaderCommitment: capturedFields.leader_commitment,
            teamAvailability: capturedFields.team_availability || 'Not discussed'
          },
          
          stakeholders: {
            keyStakeholders: capturedFields.key_stakeholders || [],
            champions: capturedFields.champions || [],
            concerns: capturedFields.stakeholder_concerns || []
          },
          
          conversationMetrics: {
            duration: metadata.startTime ? 
              Math.round((Date.now() - new Date(metadata.startTime).getTime()) / 60000) : 0,
            statesCompleted: stateTransitions.length,
            completionPercentage: qualityMetrics.completionPercentage,
            rapportScore: qualityMetrics.rapportScore,
            managerConfidence: qualityMetrics.managerConfidence
          },
          
          recommendedNextSteps: [
            'Begin with Team Signals assessment to establish baseline',
            capturedFields.primary_challenge?.includes('communication') ? 
              'Consider TMP assessment for communication patterns' : null,
            capturedFields.team_size > 20 ? 
              'Plan for phased rollout with pilot group' : null
          ].filter(Boolean),
          
          notes: capturedFields.additional_notes || ''
        };

        return {
          success: true,
          output: handoffDocument,
          metadata: {
            documentGenerated: true
          }
        };
      }
    }
  ];
}