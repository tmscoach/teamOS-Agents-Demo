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
      tools: [], // TMS tools will be loaded dynamically
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
    this.tmsAuth = new TMSAuthService();
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
    if (response && !response.requiresHandoff) {
      const guidance = this.getProactiveGuidance(context);
      if (guidance) {
        response.content += `\n\n${guidance}`;
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
          tmsUserId: true
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
          tmsUserId: user.tmsUserId,
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
        return {
          content: "It looks like you've already completed the available assessments. Would you like to review your results or explore other team transformation tools?",
          metadata: {}
        };
      }
      
      return {
        content: `I can help you start an assessment! Here are your available options:

${availableAssessments.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Which assessment would you like to take? Just tell me the name or number.`,
        metadata: {
          awaitingSelection: true
        }
      };
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
      return {
        content: `You've already completed the ${selection.type} assessment. Would you like to review your results or try a different assessment?`,
        metadata: {}
      };
    }
    
    if (selection.type === 'TeamSignals' && !context.metadata?.teamSignalsEligible) {
      return {
        content: "Team Signals requires completing the TMP assessment first. Would you like to start with TMP instead?",
        metadata: {}
      };
    }
    
    // Create subscription
    return await this.createAssessmentSubscription(context);
  }

  private async createAssessmentSubscription(context: AgentContext): Promise<AgentResponse> {
    const selection = context.metadata?.selectedAssessment as AssessmentSelection;
    if (!selection) {
      return {
        content: "I need to know which assessment you'd like to take first. Please select TMP or Team Signals.",
        metadata: {}
      };
    }
    
    // Check if we have TMS user ID
    if (!context.metadata?.tmsUserId) {
      return {
        content: "I need to set up your TMS account first. Let me connect you with the right team member to help with that.",
        requiresHandoff: true,
        handoffTo: 'OnboardingAgent',
        metadata: {
          reason: 'missing_tms_account'
        }
      };
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
    
    // Response indicating we'll create the subscription
    return {
      content: `Great choice! I'll set up your ${selection.type} assessment now.

The ${selection.type} assessment will help you understand ${
  selection.type === 'TMP' 
    ? 'your work preferences and how you naturally contribute to your team'
    : 'what\'s working well in your team and where to focus improvement efforts'
}.

Let me create your assessment subscription...

[Use the tms_assign_subscription tool with userId: ${context.metadata.tmsUserId}, workflowId: ${workflowId}, and organizationId from context]`,
      metadata: {
        selectedAssessment: selection,
        nextAction: 'create_subscription'
      }
    };
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