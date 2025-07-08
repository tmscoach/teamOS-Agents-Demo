import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, Message, AgentResponse, ToolCall, AgentTool } from '../types';
import { createOnboardingTools } from '../tools/onboarding-tools';
import { OnboardingGuardrails } from '../guardrails/onboarding-guardrails';

export enum ConversationState {
  GREETING = "greeting",
  CONTEXT_DISCOVERY = "context_discovery",
  CHALLENGE_EXPLORATION = "challenge_exploration",
  TMS_EXPLANATION = "tms_explanation",
  GOAL_SETTING = "goal_setting",
  RESOURCE_CONFIRMATION = "resource_confirmation",
  STAKEHOLDER_MAPPING = "stakeholder_mapping",
  RECAP_AND_HANDOFF = "recap_and_handoff"
}

export interface OnboardingMetadata {
  state: ConversationState;
  startTime: Date;
  capturedFields: Record<string, any>;
  requiredFieldsStatus: Record<string, boolean>;
  qualityMetrics: {
    rapportScore: number;
    managerConfidence: 'low' | 'medium' | 'high';
    completionPercentage: number;
  };
  stateTransitions: Array<{
    from: ConversationState;
    to: ConversationState;
    timestamp: Date;
    reason?: string;
  }>;
}

export class OnboardingAgent extends KnowledgeEnabledAgent {
  private static readonly REQUIRED_FIELDS = [
    "team_size",
    "team_tenure",
    "primary_challenge",
    "success_metrics",
    "timeline_preference",
    "budget_range",
    "leader_commitment"
  ];

  private static readonly STATE_INSTRUCTIONS: Record<ConversationState, string> = {
    [ConversationState.GREETING]: `
      Welcome the manager warmly and introduce yourself as their TMS transformation guide.
      Express enthusiasm about helping them transform their team.
      Ask for their name and what brings them to TMS today.
    `,
    [ConversationState.CONTEXT_DISCOVERY]: `
      Learn about their team context:
      - Team size and structure
      - How long they've been managing this team
      - Industry/department context
      - Recent changes or transitions
      Ask open-ended questions to understand their situation.
    `,
    [ConversationState.CHALLENGE_EXPLORATION]: `
      Explore their primary challenges:
      - What specific issues are they facing?
      - How are these challenges impacting the team?
      - What have they tried so far?
      Use the knowledge base to relate their challenges to TMS solutions.
    `,
    [ConversationState.TMS_EXPLANATION]: `
      Explain how TMS can help based on their specific challenges.
      Use the knowledge base to:
      - Share relevant success stories
      - Explain appropriate assessment tools
      - Describe the transformation journey
      Keep explanations relevant and concise.
    `,
    [ConversationState.GOAL_SETTING]: `
      Help them set SMART goals:
      - What specific outcomes do they want?
      - What does success look like?
      - What's their timeline?
      - How will they measure progress?
    `,
    [ConversationState.RESOURCE_CONFIRMATION]: `
      Discuss practical considerations:
      - Budget range for transformation
      - Time commitment from leader and team
      - Any constraints or considerations
      - Support from upper management
    `,
    [ConversationState.STAKEHOLDER_MAPPING]: `
      Identify key stakeholders:
      - Who needs to be involved?
      - Who are the champions and skeptics?
      - How will they communicate the process?
      - What support systems exist?
    `,
    [ConversationState.RECAP_AND_HANDOFF]: `
      Summarize what you've learned:
      - Recap their team context and challenges
      - Confirm their goals and timeline
      - Review next steps
      - Prepare handoff to Assessment Agent
      Ensure they feel confident about moving forward.
    `
  };

  constructor() {
    const tools = createOnboardingTools();
    const guardrails = OnboardingGuardrails.createGuardrails();

    super({
      name: 'OnboardingAgent',
      description: 'Guides managers through initial TMS platform setup with personalized onboarding',
      handoffDescription: 'Start your TMS journey with a personalized onboarding conversation',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as OnboardingMetadata;
        const state = metadata?.state || ConversationState.GREETING;
        const baseInstructions = OnboardingAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Onboarding Agent. Your role is to guide new managers through their initial platform setup.

Current conversation state: ${state}

${baseInstructions}

Remember to:
- Be warm, professional, and encouraging
- Use the knowledge base to provide accurate TMS information
- Extract and validate required information naturally
- Monitor conversation quality and manager confidence
- Progress through states based on conversation flow

Required fields to capture: ${OnboardingAgent.REQUIRED_FIELDS.join(', ')}`;
      },
      tools,
      handoffs: [{
        targetAgent: 'AssessmentAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as OnboardingMetadata;
          return metadata?.state === ConversationState.RECAP_AND_HANDOFF &&
                 this.isReadyForHandoff(metadata);
        }
      }],
      inputGuardrails: guardrails
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.onboarding) {
      context.metadata.onboarding = this.initializeMetadata();
    }

    const metadata = context.metadata.onboarding as OnboardingMetadata;

    // Process the message and extract information
    const extractedData = await this.extractInformation(message, context);
    this.updateCapturedFields(metadata, extractedData);

    // Update conversation state based on progress
    const newState = this.determineNextState(metadata, context);
    if (newState !== metadata.state) {
      this.transitionState(metadata, newState);
    }

    // Generate response using parent class
    const response = await super.processMessage(message, context);

    // Add quality metrics
    this.updateQualityMetrics(metadata, context);

    // Check if ready for handoff
    if (this.isReadyForHandoff(metadata)) {
      response.handoff = {
        targetAgent: 'AssessmentAgent',
        reason: 'Onboarding completed successfully'
      };

      // Add handoff document generation
      const handoffDoc = await this.generateHandoffDocument(metadata, context);
      context.metadata.handoffDocument = handoffDoc;
    }

    return response;
  }

  private initializeMetadata(): OnboardingMetadata {
    const requiredFieldsStatus: Record<string, boolean> = {};
    OnboardingAgent.REQUIRED_FIELDS.forEach(field => {
      requiredFieldsStatus[field] = false;
    });

    return {
      state: ConversationState.GREETING,
      startTime: new Date(),
      capturedFields: {},
      requiredFieldsStatus,
      qualityMetrics: {
        rapportScore: 0,
        managerConfidence: 'low',
        completionPercentage: 0
      },
      stateTransitions: []
    };
  }

  private async extractInformation(message: string, context: AgentContext): Promise<Record<string, any>> {
    // Use the extractTeamInfo tool
    const toolCall: ToolCall = {
      id: `extract-${Date.now()}`,
      name: 'extractTeamInfo',
      parameters: { message, context }
    };

    const tool = this.tools.find((t: AgentTool) => t.name === 'extractTeamInfo');
    if (tool) {
      const result = await tool.execute(toolCall.parameters, context);
      return result.output || {};
    }

    return {};
  }

  private updateCapturedFields(metadata: OnboardingMetadata, extractedData: Record<string, any>) {
    // Update captured fields
    Object.assign(metadata.capturedFields, extractedData);

    // Update required fields status
    OnboardingAgent.REQUIRED_FIELDS.forEach(field => {
      if (metadata.capturedFields[field]) {
        metadata.requiredFieldsStatus[field] = true;
      }
    });

    // Update completion percentage
    const completedFields = Object.values(metadata.requiredFieldsStatus).filter(Boolean).length;
    metadata.qualityMetrics.completionPercentage = 
      (completedFields / OnboardingAgent.REQUIRED_FIELDS.length) * 100;
  }

  private determineNextState(metadata: OnboardingMetadata, context: AgentContext): ConversationState {
    const { state, capturedFields } = metadata;
    const messageCount = context.messageHistory.filter(m => m.role === 'user').length;

    // State transition logic
    switch (state) {
      case ConversationState.GREETING:
        if (capturedFields.name || messageCount > 1) {
          return ConversationState.CONTEXT_DISCOVERY;
        }
        break;
      case ConversationState.CONTEXT_DISCOVERY:
        if (capturedFields.team_size && capturedFields.team_tenure) {
          return ConversationState.CHALLENGE_EXPLORATION;
        }
        break;
      case ConversationState.CHALLENGE_EXPLORATION:
        if (capturedFields.primary_challenge) {
          return ConversationState.TMS_EXPLANATION;
        }
        break;
      case ConversationState.TMS_EXPLANATION:
        if (messageCount > 6) { // After explanation and Q&A
          return ConversationState.GOAL_SETTING;
        }
        break;
      case ConversationState.GOAL_SETTING:
        if (capturedFields.success_metrics) {
          return ConversationState.RESOURCE_CONFIRMATION;
        }
        break;
      case ConversationState.RESOURCE_CONFIRMATION:
        if (capturedFields.budget_range && capturedFields.leader_commitment) {
          return ConversationState.STAKEHOLDER_MAPPING;
        }
        break;
      case ConversationState.STAKEHOLDER_MAPPING:
        if (capturedFields.key_stakeholders || messageCount > 12) {
          return ConversationState.RECAP_AND_HANDOFF;
        }
        break;
    }

    return state;
  }

  private transitionState(metadata: OnboardingMetadata, newState: ConversationState) {
    metadata.stateTransitions.push({
      from: metadata.state,
      to: newState,
      timestamp: new Date()
    });
    metadata.state = newState;
  }

  private updateQualityMetrics(metadata: OnboardingMetadata, context: AgentContext) {
    const messageCount = context.messageHistory.filter(m => m.role === 'user').length;
    const avgMessageLength = context.messageHistory
      .filter(m => m.role === 'user')
      .reduce((sum, m) => sum + m.content.length, 0) / messageCount;

    // Simple rapport scoring based on engagement
    metadata.qualityMetrics.rapportScore = Math.min(100, messageCount * 5 + avgMessageLength / 10);

    // Manager confidence based on progress and engagement
    if (metadata.qualityMetrics.completionPercentage > 70 && metadata.qualityMetrics.rapportScore > 60) {
      metadata.qualityMetrics.managerConfidence = 'high';
    } else if (metadata.qualityMetrics.completionPercentage > 40 || metadata.qualityMetrics.rapportScore > 40) {
      metadata.qualityMetrics.managerConfidence = 'medium';
    }
  }

  private isReadyForHandoff(metadata: OnboardingMetadata): boolean {
    const requiredFieldsComplete = Object.values(metadata.requiredFieldsStatus)
      .filter(Boolean).length >= OnboardingAgent.REQUIRED_FIELDS.length * 0.8; // 80% complete
    
    return metadata.state === ConversationState.RECAP_AND_HANDOFF && requiredFieldsComplete;
  }

  private async generateHandoffDocument(metadata: OnboardingMetadata, context: AgentContext): Promise<any> {
    const tool = this.tools.find((t: AgentTool) => t.name === 'generateHandoffDocument');
    if (tool) {
      const result = await tool.execute({ metadata, context }, context);
      return result.output;
    }
    return null;
  }
}

export function createOnboardingAgent(): OnboardingAgent {
  return new OnboardingAgent();
}