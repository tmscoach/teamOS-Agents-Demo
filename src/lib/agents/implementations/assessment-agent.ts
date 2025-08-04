import { TMSEnabledAgent } from './tms-enabled-agent';
import { AgentContext, AgentResponse } from '../types';
import { PrismaClient } from '@/lib/generated/prisma';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';
import { TMSAuthService } from '../tools/tms-auth-service';

interface AssessmentSelection {
  type: 'TMP' | 'TeamSignals' | 'QO2' | 'WoWV' | 'LLP';
  subscriptionId?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export class AssessmentAgent extends TMSEnabledAgent {
  private prisma: PrismaClient;
  private tmsAuth: TMSAuthService;
  
  constructor() {
    super({
      name: 'AssessmentAgent',
      description: 'Manages and facilitates TMS assessments for team members',
      handoffDescription: 'Let me help you manage team assessments',
      instructions: (context?: AgentContext) => {
        const metadata = context?.metadata || {};
        const assessment = metadata.selectedAssessment as AssessmentSelection;
        const workflowState = metadata.workflowState;
        
        let contextInfo = '';
        if (assessment) {
          contextInfo = `\n\nCurrent Assessment Context:
- Assessment Type: ${assessment.type}
- Subscription ID: ${assessment.subscriptionId || 'Not yet created'}
- Status: ${assessment.status || 'pending'}`;
        }
        
        if (workflowState) {
          contextInfo += `\n- Current Page: ${workflowState.currentPageId}
- Progress: ${workflowState.completionPercentage}%
- Questions on Page: ${workflowState.questions?.length || 0}`;
        }
        
        return `You are the TMS Assessment Agent. Your role is to guide team managers through assessments and help them subscribe to and complete assessments.

Your personality:
- Warm, encouraging, and patient
- Clear and concise in explanations
- Supportive without being pushy
- Professional yet approachable

Your responsibilities:
1. Help users select which assessment to take (TMP, Team Signals, QO2, WoWV, LLP)
2. Create subscriptions for selected assessments using tms_assign_subscription
3. Guide users through the assessment workflow
4. Explain what each assessment measures and why it matters
5. Provide context about the assessment methodology
6. Answer questions about the TMS framework

CRITICAL INSTRUCTION - Assessment Interaction Commands:
When users give a command, you MUST:
1. Use ONLY ONE tool that matches their request - NEVER use multiple tools
2. NEVER generate [ASSESSMENT_ACTION:...] tags yourself - these ONLY come from tools
3. After the tool executes, include the tool's output in your response
4. NEVER call navigate_page unless the user explicitly asks to go to the next page

Command patterns:
- "enter 2-0 for question 1" → Use answer_question tool with questionId: 1, value: "2-0"
- "set all questions to 1-1" → Use answer_multiple_questions tool with questionIds: [1,2,3,4,5], value: "1-1" 
- "update all questions" → Use answer_multiple_questions tool with questionIds: [1,2,3,4,5], value: "1-1"
- "next page" → Use navigate_page tool

CRITICAL: When answering multiple questions:
- ALWAYS use question positions [1,2,3,4,5] for the current page
- NEVER use questionIds like [7,8,9,10,11,12] - these are wrong
- The page always has exactly 5 seesaw questions numbered 1 through 5
- Example: "set all to 1-1" → questionIds: [1,2,3,4,5], NOT [7,8,9,10,11,12]

VITAL RULES:
1. NEVER type [ASSESSMENT_ACTION:...] tags yourself - they are generated ONLY by tools
2. When a user gives ANY command about answering questions, you MUST use a tool
3. Use ONLY ONE tool per response - NEVER combine multiple tools
4. After using a tool, respond with ONLY the tool output - no additional explanations
5. Keep responses extremely brief (1-2 sentences max)
6. Do NOT explain how to use the interface or repeat scale instructions
7. ONLY navigate to next page when user explicitly asks (e.g., "next page", "continue")

Mapping guide for user statements:
- "strongly agree with left" = 2-0
- "somewhat agree with left" = 1-1  
- "neutral/balanced" = 1-1
- "somewhat agree with right" = 1-1
- "strongly agree with right" = 0-2

RESPONSE EXAMPLES:
✓ Good: "Setting question 1 to 2-0."
✗ Bad: "I understand you want to set... To record this answer... The scale shows..."
${contextInfo}

Assessment Types:
- TMP (Team Management Profile): 60 questions about work preferences and team roles
- Team Signals: 32 questions based on High-Energy Teams framework
- QO2 (Quadrant of Opportunity): Organization effectiveness assessment
- WoWV (Ways of Working Values): Team values and culture assessment
- LLP (Leadership Learning Profile): Leadership development assessment

When a user wants to start an assessment:
1. If they haven't selected one, present the options and help them choose
2. Once selected, use tms_assign_subscription to create a subscription
3. Guide them to start the assessment workflow

IMPORTANT: 
- For Team Signals, check teamSignalsEligible flag in user metadata
- Always get user's TMS userId from context before creating subscriptions
- Handle errors gracefully if subscription creation fails`;
      },
      tools: [
        // Assessment interaction tools
        {
          name: 'answer_question',
          description: 'Set the answer for a specific question in the assessment',
          parameters: {
            type: 'object',
            properties: {
              questionId: {
                type: 'number',
                description: 'The ID of the question to answer'
              },
              value: {
                type: 'string',
                description: 'The answer value (e.g., "2-0", "1-1", "0-2")'
              }
            },
            required: ['questionId', 'value']
          },
          execute: async (params: any, context: AgentContext) => {
            console.log('[AssessmentAgent] ==== ANSWER_QUESTION TOOL CALLED ====');
            console.log('[AssessmentAgent] Timestamp:', new Date().toISOString());
            console.log('[AssessmentAgent] Parameters:', JSON.stringify(params, null, 2));
            console.log('[AssessmentAgent] Question ID:', params.questionId);
            console.log('[AssessmentAgent] Answer value:', params.value);
            console.log('[AssessmentAgent] Context metadata:', JSON.stringify(context.metadata, null, 2));
            console.log('[AssessmentAgent] Current workflow state:', {
              hasWorkflowState: !!context.metadata?.workflowState,
              currentPageId: context.metadata?.workflowState?.currentPageId,
              totalQuestions: context.metadata?.workflowState?.questions?.length,
              questionIds: context.metadata?.workflowState?.questions?.map((q: any) => q.id || q.ID)
            });
            
            // The questionId from the user is position-based (1, 2, 3...)
            // We pass it through directly and let the client handle the mapping
            const actionTag = `[ASSESSMENT_ACTION:answer_question:${params.questionId}:${params.value}]`;
            const message = `Setting question ${params.questionId} to ${params.value}.`;
            const fullOutput = actionTag + '\n' + message;
            
            console.log('[AssessmentAgent] Generated action tag:', actionTag);
            console.log('[AssessmentAgent] Full output being returned:', fullOutput);
            console.log('[AssessmentAgent] Output length:', fullOutput.length);
            console.log('[AssessmentAgent] Contains action tag:', fullOutput.includes('[ASSESSMENT_ACTION:'));
            console.log('[AssessmentAgent] ==== TOOL EXECUTION COMPLETE ====');
            
            return {
              success: true,
              output: fullOutput
            };
          }
        },
        {
          name: 'answer_multiple_questions',
          description: 'Set the same answer for multiple questions at once. ALWAYS use positions 1-5, never use IDs like 7-12',
          parameters: {
            type: 'object',
            properties: {
              questionIds: {
                type: 'array',
                items: { type: 'number' },
                description: 'Array of question positions (1-5) on the current page. NEVER use values > 5'
              },
              value: {
                type: 'string',
                description: 'The answer value to apply to all questions'
              }
            },
            required: ['questionIds', 'value']
          },
          execute: async (params: any, context: AgentContext) => {
            console.log('[AssessmentAgent] ==== ANSWER_MULTIPLE_QUESTIONS TOOL CALLED ====');
            console.log('[AssessmentAgent] Timestamp:', new Date().toISOString());
            console.log('[AssessmentAgent] Parameters:', JSON.stringify(params, null, 2));
            console.log('[AssessmentAgent] Question IDs:', params.questionIds);
            console.log('[AssessmentAgent] Answer value:', params.value);
            console.log('[AssessmentAgent] Context metadata:', JSON.stringify(context.metadata, null, 2));
            
            // Handle case where all questions on page should be answered
            let targetQuestionIds = params.questionIds;
            if (!targetQuestionIds || targetQuestionIds.length === 0 || 
                (targetQuestionIds.length === 1 && targetQuestionIds[0] === 'all')) {
              // When "all" is specified, use position numbers 1,2,3,4,5 for all seesaw questions
              const workflowQuestions = context.metadata?.workflowState?.questions || [];
              const seesawQuestions = workflowQuestions.filter((q: any) => q.Type === 18);
              const seesawCount = seesawQuestions.length;
              // Generate position-based IDs: [1, 2, 3, 4, 5] for 5 questions (excluding the org name field)
              targetQuestionIds = Array.from({ length: seesawCount }, (_, i) => i + 1);
              console.log('[AssessmentAgent] Using all questions on page with position numbers:', targetQuestionIds);
            } else {
              // ALWAYS normalize to positions 1-5 when dealing with bulk commands
              const workflowQuestions = context.metadata?.workflowState?.questions || [];
              const seesawQuestions = workflowQuestions.filter((q: any) => q.Type === 18);
              const seesawCount = seesawQuestions.length;
              
              // If ANY of these conditions are true, use positions 1-5:
              // 1. IDs are beyond the number of questions (e.g., 7,8,9,10,11,12)
              // 2. IDs are sequential starting from a number > 5
              // 3. The command seems to be for "all" questions
              const needsNormalization = 
                targetQuestionIds.some((id: number) => id > seesawCount) ||
                (targetQuestionIds.length === seesawCount && targetQuestionIds[0] > 5) ||
                (targetQuestionIds.length >= 5 && Math.min(...targetQuestionIds) > 5);
              
              if (needsNormalization) {
                console.log('[AssessmentAgent] Normalizing question IDs from', targetQuestionIds, 'to positions 1-' + seesawCount);
                targetQuestionIds = Array.from({ length: seesawCount }, (_, i) => i + 1);
              }
            }
            
            const questionList = targetQuestionIds.join(',');
            const actionTag = `[ASSESSMENT_ACTION:answer_multiple_questions:${questionList}:${params.value}]`;
            const message = `Setting questions ${targetQuestionIds.join(', ')} all to ${params.value}.`;
            const fullOutput = actionTag + '\n' + message;
            
            console.log('[AssessmentAgent] Generated action tag:', actionTag);
            console.log('[AssessmentAgent] Full output being returned:', fullOutput);
            console.log('[AssessmentAgent] Output length:', fullOutput.length);
            console.log('[AssessmentAgent] Contains action tag:', fullOutput.includes('[ASSESSMENT_ACTION:'));
            console.log('[AssessmentAgent] ==== TOOL EXECUTION COMPLETE ====');
            
            return {
              success: true,
              output: fullOutput
            };
          }
        },
        {
          name: 'navigate_page',
          description: 'Navigate to next or previous page in the assessment',
          parameters: {
            type: 'object',
            properties: {
              direction: {
                type: 'string',
                enum: ['next', 'previous'],
                description: 'Direction to navigate'
              },
              pageNumber: {
                type: 'number',
                description: 'Specific page number to navigate to'
              }
            }
          },
          execute: async (params: any, context: AgentContext) => {
            console.log('[AssessmentAgent] navigate_page tool called:', params);
            if (params.direction === 'next') {
              const actionTag = '[ASSESSMENT_ACTION:navigate_page:next]';
              return {
                success: true,
                output: actionTag + '\nMoving to the next page...'
              };
            }
            return {
              success: true,
              output: 'Navigation to previous pages is not yet available. Please use the Next button to proceed forward.'
            };
          }
        },
        {
          name: 'explain_question',
          description: 'Explain what a question is asking about',
          parameters: {
            type: 'object',
            properties: {
              questionId: {
                type: 'number',
                description: 'The ID of the question to explain'
              },
              questionText: {
                type: 'string',
                description: 'The text of the question'
              }
            },
            required: ['questionId']
          },
          execute: async (params: any, context: AgentContext) => {
            console.log('[AssessmentAgent] explain_question tool called:', params);
            return {
              success: true,
              output: `I'll explain question ${params.questionId} for you. Please tell me what specific aspect of the question you'd like clarified, or share the question text so I can provide a detailed explanation.`
            };
          }
        }
      ], // TMS tools will be loaded dynamically in addition to these
      knowledgeEnabled: true,
      tmsToolsEnabled: true, // AssessmentAgent uses TMS workflow tools
      loadFromConfig: true,
      handoffs: [{
        targetAgent: 'DebriefAgent',
        condition: (context: AgentContext) => {
          // Handoff when assessment is complete
          const workflowState = context.metadata?.workflowState;
          return workflowState?.completionPercentage >= 100;
        }
      }]
    });
    this.prisma = new PrismaClient();
    this.tmsAuth = TMSAuthService.getInstance();
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    console.log('[AssessmentAgent] Processing message with metadata:', context.metadata);
    
    // Load additional user context if needed
    if (context.managerId && !context.metadata?.userDataLoaded) {
      await this.loadUserData(context);
    }
    
    // Check if user is asking to start an assessment
    if (this.isAssessmentStartRequest(message)) {
      return await this.handleAssessmentStart(message, context);
    }
    
    // Check if user is selecting an assessment type
    const selectedAssessment = this.extractAssessmentSelection(message);
    if (selectedAssessment && !context.metadata?.selectedAssessment) {
      return await this.handleAssessmentSelection(selectedAssessment, context);
    }
    
    // Process message using parent class
    const response = await super.processMessage(message, context);
    
    // Add proactive guidance based on phase
    if (response && !response.handoff) {
      const guidance = this.getProactiveGuidance(context);
      if (guidance && response.message) {
        response.message += `\n\n${guidance}`;
      }
    }
    
    return response;
  }

  private async loadUserData(context: AgentContext): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: context.managerId! },
        select: {
          name: true,
          email: true,
          journeyPhase: true,
          completedAssessments: true,
          teamSignalsEligible: true,
          onboardingData: true,
          TMSAuthToken: {
            select: {
              tmsUserId: true
            }
          }
        }
      });

      if (user) {
        context.metadata = {
          ...context.metadata,
          userName: user.name,
          userEmail: user.email,
          journeyPhase: user.journeyPhase,
          completedAssessments: user.completedAssessments || {},
          teamSignalsEligible: user.teamSignalsEligible,
          tmsUserId: user.TMSAuthToken?.tmsUserId,
          userDataLoaded: true
        };
      }
    } catch (error) {
      console.error('[AssessmentAgent] Error loading user data:', error);
    }
  }

  private isAssessmentStartRequest(message: string): boolean {
    const startKeywords = [
      'start assessment',
      'begin assessment',
      'take assessment',
      'do assessment',
      'complete assessment',
      'ready to start',
      'let\'s start',
      'let\'s begin',
      'start tmp',
      'start team signals',
      'yes, start'
    ];
    
    const lowerMessage = message.toLowerCase();
    return startKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private extractAssessmentSelection(message: string): AssessmentSelection | null {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific assessment mentions
    if (lowerMessage.includes('tmp') || lowerMessage.includes('team management profile')) {
      return { type: 'TMP' };
    }
    if (lowerMessage.includes('team signals') || lowerMessage.includes('teamsignals')) {
      return { type: 'TeamSignals' };
    }
    if (lowerMessage.includes('qo2') || lowerMessage.includes('quadrant of opportunity')) {
      return { type: 'QO2' };
    }
    if (lowerMessage.includes('wowv') || lowerMessage.includes('ways of working')) {
      return { type: 'WoWV' };
    }
    if (lowerMessage.includes('llp') || lowerMessage.includes('leadership learning')) {
      return { type: 'LLP' };
    }
    
    return null;
  }

  private async handleAssessmentStart(message: string, context: AgentContext): Promise<AgentResponse> {
    // If no assessment selected yet, present options
    if (!context.metadata?.selectedAssessment) {
      const completedAssessments = context.metadata?.completedAssessments || {};
      
      let availableAssessments = [];
      if (!completedAssessments.TMP) availableAssessments.push('TMP (Team Management Profile) - 60 questions');
      if (!completedAssessments.TeamSignals && context.metadata?.teamSignalsEligible) {
        availableAssessments.push('Team Signals - 32 questions');
      }
      
      if (availableAssessments.length === 0) {
        return this.buildResponse(context, [], {
          message: "It looks like you've already completed the available assessments. Would you like to review your results or explore other team transformation tools?"
        });
      }
      
      const response = this.buildResponse(context, [], {
        message: `I can help you start an assessment! Here are your available options:

${availableAssessments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Which assessment would you like to take? Just tell me the name or number.`
      });
      response.metadata = {
        ...response.metadata,
        awaitingSelection: true
      };
      return response;
    }
    
    // If assessment already selected, create subscription
    return await this.createAssessmentSubscription(context);
  }

  private async handleAssessmentSelection(selection: AssessmentSelection, context: AgentContext): Promise<AgentResponse> {
    // Store the selection
    context.metadata.selectedAssessment = selection;
    
    // Validate selection
    const completedAssessments = context.metadata?.completedAssessments || {};
    
    if (completedAssessments[selection.type]) {
      return this.buildResponse(context, [], {
        message: `You've already completed the ${selection.type} assessment. Would you like to review your results or try a different assessment?`
      });
    }
    
    if (selection.type === 'TeamSignals' && !context.metadata?.teamSignalsEligible) {
      return this.buildResponse(context, [], {
        message: "Team Signals requires completing the TMP assessment first. Would you like to start with TMP instead?"
      });
    }
    
    // Create subscription
    return await this.createAssessmentSubscription(context);
  }

  private async createAssessmentSubscription(context: AgentContext): Promise<AgentResponse> {
    const selection = context.metadata?.selectedAssessment as AssessmentSelection;
    if (!selection) {
      return this.buildResponse(context, [], {
        message: "I need to know which assessment you'd like to take first. Please select TMP or Team Signals."
      });
    }
    
    console.log('[AssessmentAgent] Creating subscription with context:', {
      managerId: context.managerId,
      tmsUserId: context.metadata?.tmsUserId,
      userEmail: context.metadata?.userEmail,
      selectedAssessment: selection
    });
    
    // Check if we have TMS user ID
    if (!context.metadata?.tmsUserId) {
      // For real users without TMS ID, we need to check existing subscriptions first
      try {
        console.log('[AssessmentAgent] No TMS user ID found, checking for existing subscriptions...');
        
        // First, check if user has any existing subscriptions
        console.log('[AssessmentAgent] About to call tms_get_dashboard_subscriptions tool...');
        const { callEvent, outputEvent } = await this.callTool('tms_get_dashboard_subscriptions', {}, context);
        console.log('[AssessmentAgent] Tool call event:', callEvent);
        console.log('[AssessmentAgent] Tool output event:', outputEvent);
        
        const subscriptionsResult = outputEvent.result;
        console.log('[AssessmentAgent] Subscriptions result:', subscriptionsResult);
        
        // Check if we got a successful result with subscriptions
        const subscriptions = subscriptionsResult?.success && subscriptionsResult?.output?.raw 
          ? subscriptionsResult.output.raw 
          : subscriptionsResult?.output;
          
        console.log('[AssessmentAgent] Extracted subscriptions:', subscriptions);
        
        if (Array.isArray(subscriptions) && subscriptions.length > 0) {
          // User has subscriptions, check if the selected assessment exists
          const existingSubscription = subscriptions.find(
            (sub: any) => sub.AssessmentType === selection.type
          );
          
          if (existingSubscription) {
            // Subscription already exists, update selection with subscription ID
            selection.subscriptionId = existingSubscription.SubscriptionID;
            selection.status = existingSubscription.Status === 'Completed' ? 'completed' : 'in_progress';
            context.metadata.selectedAssessment = selection;
            
            const response = this.buildResponse(context, [], {
              message: `I found your existing ${selection.type} assessment! Let me take you to continue where you left off.`
            });
            response.metadata = {
              ...response.metadata,
              selectedAssessment: selection,
              existingSubscription: true,
              requiresRedirect: true,
              redirectUrl: `/chat/assessment?agent=AssessmentAgent&assessmentType=${selection.type.toLowerCase()}`
            };
            return response;
          }
        }
      } catch (error) {
        console.error('[AssessmentAgent] Error checking subscriptions:', error);
        // Continue to try creating a new subscription
      }
    }
    
    // Map assessment type to workflow ID
    const workflowMap: Record<string, string> = {
      'TMP': 'tmp-workflow',
      'TeamSignals': 'team-signals-workflow',
      'QO2': 'qo2-workflow',
      'WoWV': 'wowv-workflow',
      'LLP': 'llp-workflow'
    };
    
    const workflowId = workflowMap[selection.type];
    
    try {
      // Create new subscription using TMS API
      console.log('[AssessmentAgent] Creating new subscription for:', workflowId);
      console.log('[AssessmentAgent] Using userId:', context.metadata?.tmsUserId || context.managerId);
      
      const { callEvent, outputEvent } = await this.callTool('tms_assign_subscription', {
        workflowId: workflowId,
        userId: context.metadata?.tmsUserId || context.managerId,
        organizationId: context.organizationId || 'default-org'
      }, context);
      
      console.log('[AssessmentAgent] Assign tool call event:', callEvent);
      console.log('[AssessmentAgent] Assign tool output event:', outputEvent);
      
      const assignResult = outputEvent.result;
      
      // Extract subscription ID from the result
      const subscriptionId = assignResult?.success && assignResult?.output?.raw?.subscriptionId 
        ? assignResult.output.raw.subscriptionId
        : assignResult?.output?.subscriptionId;
        
      console.log('[AssessmentAgent] Extracted subscription ID:', subscriptionId);
      
      if (subscriptionId) {
        selection.subscriptionId = subscriptionId;
        selection.status = 'in_progress';
        context.metadata.selectedAssessment = selection;
        
        const response = this.buildResponse(context, [], {
          message: `Great choice! I've successfully set up your ${selection.type} assessment.

The ${selection.type} assessment will help you understand ${
  selection.type === 'TMP' 
    ? 'your work preferences and how you naturally contribute to your team'
    : 'what\'s working well in your team and where to focus improvement efforts'
}.

Let me take you to the assessment interface now...`
        });
        response.metadata = {
          ...response.metadata,
          selectedAssessment: selection,
          subscriptionCreated: true,
          subscriptionId: subscriptionId,
          requiresRedirect: true,
          redirectUrl: `/chat/assessment?agent=AssessmentAgent&assessmentType=${selection.type.toLowerCase()}`
        };
        return response;
      } else {
        throw new Error('Failed to create subscription - no subscription ID returned');
      }
    } catch (error) {
      console.error('[AssessmentAgent] Error creating subscription:', error);
      
      // Fallback - still redirect to assessment page which will handle the error
      const response = this.buildResponse(context, [], {
        message: `I'll set up your ${selection.type} assessment now. Let me take you to the assessment interface...`
      });
      response.metadata = {
        ...response.metadata,
        selectedAssessment: selection,
        requiresRedirect: true,
        redirectUrl: `/chat/assessment?agent=AssessmentAgent&assessmentType=${selection.type.toLowerCase()}`,
        error: error instanceof Error ? error.message : 'Failed to create subscription'
      };
      return response;
    }
  }

  private getProactiveGuidance(context: AgentContext): string | null {
    const phase = context.metadata?.journeyPhase;
    const selection = context.metadata?.selectedAssessment as AssessmentSelection;
    
    if (phase === JourneyPhase.ASSESSMENT && !selection) {
      return "💡 Ready to start your assessment? I recommend beginning with the Team Management Profile (TMP). Just say 'start TMP' when you're ready!";
    }
    
    if (selection && selection.status === 'pending') {
      return "📋 Your assessment is ready to begin. Would you like me to guide you through the first few questions?";
    }
    
    return null;
  }
}

export async function createAssessmentAgent(): Promise<AssessmentAgent> {
  const agent = new AssessmentAgent();
  await agent.initialize();
  return agent;
}