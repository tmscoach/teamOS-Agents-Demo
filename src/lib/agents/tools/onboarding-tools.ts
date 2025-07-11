import { AgentTool, AgentContext, ToolResult } from '../types';
import { VariableExtractionService, VariableExtractionInput } from '../../services/variable-extraction';

// Helper function to create extraction tracking function
function createExtractionTracker(context: AgentContext) {
  const extractionResults: VariableExtractionInput[] = [];
  
  const trackExtraction = (
    fieldName: string,
    pattern: RegExp | string,
    match: RegExpMatchArray | null,
    extractedValue?: any
  ) => {
    const attempted = true;
    const successful = !!match;
    const confidence = successful ? calculateConfidence(match!, pattern.toString()) : 0;

    extractionResults.push({
      conversationId: context.conversationId,
      agentName: 'OnboardingAgent',
      fieldName,
      attempted,
      successful,
      extractedValue: extractedValue ? String(extractedValue) : undefined,
      confidence
    });
  };

  // Helper function to calculate confidence based on match quality
  const calculateConfidence = (match: RegExpMatchArray, pattern: string): number => {
    // Base confidence of 0.6 for any match
    let confidence = 0.6;
    
    // Boost confidence for exact pattern matches
    if (match[0].length === match.input!.length) {
      confidence += 0.2;
    }
    
    // Boost confidence for matches with multiple captured groups
    if (match.length > 2) {
      confidence += 0.1;
    }
    
    // Boost confidence if match is near the beginning of the message
    if (match.index! < 20) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  };

  return { trackExtraction, extractionResults };
}

// Helper function to determine if tracking should be enabled
function shouldTrackExtractions(conversationId: string): boolean {
  // Skip tracking in test environment
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  
  // Skip tracking for test conversation IDs (legacy support)
  if (conversationId.startsWith('test-')) {
    return false;
  }
  
  // Check for explicit tracking disable flag
  if (process.env.DISABLE_EXTRACTION_TRACKING === 'true') {
    return false;
  }
  
  return true;
}

// Helper function to persist extraction results to database
async function persistExtractionResults(
  extractionResults: VariableExtractionInput[], 
  context: AgentContext
): Promise<{ success: boolean; error?: Error }> {
  try {
    // Only track if conditions are met
    if (extractionResults.length > 0 && context.conversationId && shouldTrackExtractions(context.conversationId)) {
      const count = await VariableExtractionService.trackExtractionBatch(extractionResults);
      return { success: true };
    }
    return { success: true }; // No tracking needed
  } catch (error) {
    // Log errors with context
    const errorMessage = `Failed to track extractions for conversation ${context.conversationId}`;
    
    if (process.env.NODE_ENV !== 'test') {
      console.error(errorMessage, error);
    }
    
    // Return error details for monitoring
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

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
        
        // Create extraction tracker
        const { trackExtraction, extractionResults } = createExtractionTracker(context);

        // Extract team size
        const teamSizePattern = /(\d+)\s*(?:people|members|employees|staff|direct reports)/i;
        const teamSizeMatch = message.match(teamSizePattern);
        if (teamSizeMatch) {
          extracted.team_size = parseInt(teamSizeMatch[1]);
        }
        trackExtraction('team_size', teamSizePattern, teamSizeMatch, extracted.team_size);

        // Extract tenure
        const tenurePattern = /(\d+)\s*(?:years?|months?|weeks?)/i;
        const tenureMatch = message.match(tenurePattern);
        if (tenureMatch) {
          extracted.team_tenure = tenureMatch[0];
        }
        trackExtraction('team_tenure', tenurePattern, tenureMatch, extracted.team_tenure);

        // Extract manager name
        const namePatterns = [
          /(?:I'm|I am|My name is|Call me)\s+(?:definitely\s+|really\s+|actually\s+)?([A-Z][a-z]+)(?:\s+([A-Z][a-z]+)(?=\s+(?:from|at|with|,|and)|$))?/i,
          /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i,
          /^My name is\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+)(?=\s+(?:from|at|with|,|and)|$))?/i
        ];
        let nameMatch: RegExpMatchArray | null = null;
        let matchedPattern: RegExp | null = null;
        for (const pattern of namePatterns) {
          const match = message.match(pattern);
          if (match) {
            // Handle patterns with optional last name capture
            if (pattern === namePatterns[0] || pattern === namePatterns[2]) {
              extracted.name = match[1] + (match[2] ? ' ' + match[2] : '');
            } else {
              extracted.name = match[1];
            }
            nameMatch = match;
            matchedPattern = pattern;
            break;
          }
        }
        trackExtraction('manager_name', matchedPattern || namePatterns[0], nameMatch, extracted.name);
        
        // Extract organization/company
        const orgPatterns = [
          /(?:work (?:at|for)|from)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z]?[A-Za-z0-9]+)*?)(?:\s|,|\.|$)/i,
          /(?:at|with)\s+(?!my|the|a|an|our|your|their|his|her|its)([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*?)(?:\s|,|\.|$)/i,
          /(?:company|organization|org)\s+(?:is|called)?\s*([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)*?)(?:\s|,|\.|$)/i
        ];
        let orgMatch: RegExpMatchArray | null = null;
        let orgPattern: RegExp | null = null;
        for (const pattern of orgPatterns) {
          const match = message.match(pattern);
          if (match) {
            extracted.organization = match[1].trim();
            orgMatch = match;
            orgPattern = pattern;
            break;
          }
        }
        trackExtraction('organization', orgPattern || orgPatterns[0], orgMatch, extracted.organization);

        // Extract challenges
        const challengeKeywords = ['challenge', 'problem', 'issue', 'struggle', 'difficulty', 'concern'];
        const lowerMessage = message.toLowerCase();
        let challengeMatch: RegExpMatchArray | null = null;
        
        // Create a pattern that captures the whole sentence containing a challenge keyword
        const challengePattern = new RegExp(`([^.!?]*\\b(?:${challengeKeywords.join('|')})\\b[^.!?]*)`, 'i');
        challengeMatch = message.match(challengePattern);
        
        if (challengeMatch) {
          extracted.primary_challenge = challengeMatch[1].trim();
        }
        
        trackExtraction('primary_challenge', challengePattern, challengeMatch, extracted.primary_challenge);

        // Extract budget mentions
        const budgetPattern = /\$?([\d,]+k?)\s*(?:budget|to spend|available)/i;
        const budgetMatch = message.match(budgetPattern);
        if (budgetMatch) {
          extracted.budget_range = budgetMatch[0];
        }
        trackExtraction('budget_range', budgetPattern, budgetMatch, extracted.budget_range);

        // Extract timeline
        const timelinePattern = /(?:within|in|over the next)\s+(\d+\s*(?:months?|quarters?|years?))/i;
        const timelineMatch = message.match(timelinePattern);
        if (timelineMatch) {
          extracted.timeline_preference = timelineMatch[1];
        }
        trackExtraction('timeline_preference', timelinePattern, timelineMatch, extracted.timeline_preference);

        // Extract commitment level
        const highCommitmentPattern = /(?:fully|totally|completely|very)\s+(?:committed|dedicated|on board)/i;
        const mediumCommitmentPattern = /(?:somewhat|partially|moderately)\s+(?:committed|dedicated)/i;
        let commitmentMatch = null;
        let commitmentPattern = highCommitmentPattern;
        
        if (message.match(highCommitmentPattern)) {
          extracted.leader_commitment = 'high';
          commitmentMatch = message.match(highCommitmentPattern);
        } else if (message.match(mediumCommitmentPattern)) {
          extracted.leader_commitment = 'medium';
          commitmentMatch = message.match(mediumCommitmentPattern);
          commitmentPattern = mediumCommitmentPattern;
        }
        trackExtraction('leader_commitment', commitmentPattern, commitmentMatch, extracted.leader_commitment);

        // Extract success metrics/goals
        const successMetricsPattern = /(?:success|goal|objective|metric|measure)\s*(?:is|would be|means)\s*(.+?)(?:\.|$)/i;
        const successMetricsMatch = message.match(successMetricsPattern);
        if (successMetricsMatch) {
          extracted.success_metrics = successMetricsMatch[1].trim();
        }
        trackExtraction('success_metrics', successMetricsPattern, successMetricsMatch, extracted.success_metrics);

        // Track all extractions to database
        const trackingResult = await persistExtractionResults(extractionResults, context);

        return {
          success: true,
          output: extracted,
          metadata: {
            fieldsExtracted: Object.keys(extracted).length,
            extractionsTracked: extractionResults.length,
            trackingSuccess: trackingResult.success,
            trackingError: trackingResult.error?.message
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
            description: 'List of required fields',
            items: {
              type: 'string'
            }
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
            description: 'Conversation message history',
            items: {
              type: 'object'
            }
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