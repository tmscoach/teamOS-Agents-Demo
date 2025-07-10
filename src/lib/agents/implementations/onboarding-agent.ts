import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, Message, AgentResponse, ToolCall, AgentTool } from '../types';
import { createOnboardingTools } from '../tools/onboarding-tools';
import { OnboardingGuardrails } from '../guardrails/onboarding-guardrails';
import { OnboardingStateMachine } from './onboarding-state-machine';
import { OnboardingQualityCalculator, QualityMetrics } from './onboarding-quality-metrics';
import { ConversationState } from '../types/conversation-state';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { ConfigurableFlowEngine, FlowConfiguration } from '../graph';

// Re-export for backward compatibility
export { ConversationState };

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
  private stateMachine: OnboardingStateMachine;
  private qualityCalculator: OnboardingQualityCalculator;
  private configuredPrompts: Record<string, string> | null = null;
  private flowEngine?: ConfigurableFlowEngine;
  private useGraphFlow: boolean = false;
  
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
        // Use the configured system prompt if available
        if (this.configuredPrompts && this.configuredPrompts.system) {
          return this.configuredPrompts.system;
        }
        
        // Fallback to default structured prompt
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
    
    this.stateMachine = new OnboardingStateMachine();
    this.qualityCalculator = new OnboardingQualityCalculator();
    
    // Initialize flow engine if enabled
    if (process.env.USE_GRAPH_FLOW === 'true') {
      this.initializeFlowEngine();
    }
    
    // Load configuration on initialization
    this.loadConfiguration().catch(err => {
      console.error('Failed to load initial configuration:', err);
    });
  }
  
  private async loadConfiguration() {
    try {
      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      if (config && config.prompts) {
        this.configuredPrompts = config.prompts;
        console.log('Loaded OnboardingAgent configuration version:', config.version);
      }
      
      // Load flow configuration if available
      if (config && config.flowConfig && this.flowEngine) {
        await this.flowEngine.loadConfiguration(config.flowConfig as FlowConfiguration);
        this.useGraphFlow = true;
        console.log('Loaded flow configuration for OnboardingAgent');
      }
    } catch (error) {
      console.error('Failed to load OnboardingAgent configuration:', error);
      // Continue with default prompts
    }
  }
  
  private initializeFlowEngine() {
    // Create agent map for flow engine
    const agentMap = new Map();
    agentMap.set('OnboardingAgent', this);
    
    this.flowEngine = new ConfigurableFlowEngine(this, agentMap);
  }
  
  private mapStateToPromptKey(state: ConversationState): string {
    const mapping: Record<ConversationState, string> = {
      [ConversationState.GREETING]: 'greeting',
      [ConversationState.CONTEXT_DISCOVERY]: 'context_discovery',
      [ConversationState.CHALLENGE_EXPLORATION]: 'challenge_exploration',
      [ConversationState.TMS_EXPLANATION]: 'tms_explanation',
      [ConversationState.GOAL_SETTING]: 'goal_setting',
      [ConversationState.RESOURCE_CONFIRMATION]: 'resource_confirmation',
      [ConversationState.STAKEHOLDER_MAPPING]: 'stakeholder_mapping',
      [ConversationState.RECAP_AND_HANDOFF]: 'recap_and_handoff'
    };
    return mapping[state] || 'default';
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Ensure configuration is loaded
    if (!this.configuredPrompts) {
      await this.loadConfiguration();
    }
    
    // If flow engine is enabled and configured, use it
    if (this.useGraphFlow && this.flowEngine) {
      return this.processMessageWithFlow(message, context);
    }
    
    // Otherwise, use traditional state machine approach
    return this.processMessageWithStateMachine(message, context);
  }
  
  private async processMessageWithFlow(message: string, context: AgentContext): Promise<AgentResponse> {
    const messageObj: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    const response = await this.flowEngine!.processMessage(messageObj, context, {
      resumeFromCheckpoint: context.metadata.resumeFromCheckpoint || false
    });
    
    // Extract flow state for metadata
    const flowState = this.flowEngine!.getCurrentState();
    if (flowState) {
      context.metadata.onboarding = {
        ...context.metadata.onboarding,
        currentFlowState: flowState.state,
        collectedData: flowState.collectedData,
        timeInState: flowState.timeInState
      };
    }
    
    return response;
  }
  
  private async processMessageWithStateMachine(message: string, context: AgentContext): Promise<AgentResponse> {
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

    // Reset state machine to initial state
    this.stateMachine.setState(ConversationState.GREETING);
    
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
    // Update state machine with current state
    this.stateMachine.setState(metadata.state);
    
    // Map captured fields to conversation data format
    const conversationData = this.mapToConversationData(metadata.capturedFields);
    
    // Attempt state transition
    if (this.stateMachine.attemptTransition(conversationData)) {
      return this.stateMachine.getState();
    }
    
    return metadata.state;
  }
  
  private mapToConversationData(capturedFields: Record<string, any>): any {
    return {
      managerName: capturedFields.name,
      teamSize: capturedFields.team_size,
      teamStructure: capturedFields.team_tenure,
      primaryChallenge: capturedFields.primary_challenge,
      tmsUnderstanding: capturedFields.tms_understanding,
      goals: capturedFields.success_metrics ? [capturedFields.success_metrics] : [],
      resources: capturedFields.budget_range && capturedFields.leader_commitment ? {
        budget: capturedFields.budget_range,
        commitment: capturedFields.leader_commitment
      } : undefined,
      stakeholders: capturedFields.key_stakeholders || [],
      timeline: capturedFields.timeline_preference
    };
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
    const conversationData = this.mapToConversationData(metadata.capturedFields);
    const metrics = this.qualityCalculator.calculateMetrics(conversationData, context.messageHistory);
    
    metadata.qualityMetrics.rapportScore = metrics.rapportScore;
    metadata.qualityMetrics.completionPercentage = metrics.completionPercentage;
    
    // Map confidence level to string
    if (metrics.managerConfidenceLevel >= 70) {
      metadata.qualityMetrics.managerConfidence = 'high';
    } else if (metrics.managerConfidenceLevel >= 40) {
      metadata.qualityMetrics.managerConfidence = 'medium';
    } else {
      metadata.qualityMetrics.managerConfidence = 'low';
    }
  }

  private isReadyForHandoff(metadata: OnboardingMetadata): boolean {
    const conversationData = this.mapToConversationData(metadata.capturedFields);
    const metrics: QualityMetrics = {
      completionPercentage: metadata.qualityMetrics.completionPercentage,
      rapportScore: metadata.qualityMetrics.rapportScore,
      managerConfidenceLevel: metadata.qualityMetrics.managerConfidence === 'high' ? 80 : 
                             metadata.qualityMetrics.managerConfidence === 'medium' ? 50 : 20
    };
    
    return this.qualityCalculator.isReadyForHandoff(conversationData, metrics) && 
           metadata.state === ConversationState.RECAP_AND_HANDOFF;
  }

  private async generateHandoffDocument(metadata: OnboardingMetadata, context: AgentContext): Promise<any> {
    const tool = this.tools.find((t: AgentTool) => t.name === 'generateHandoffDocument');
    if (tool) {
      const result = await tool.execute({ metadata, context }, context);
      return result.output;
    }
    return null;
  }
  
  /**
   * Get extraction rules for the flow engine
   */
  getExtractionRules(): Record<string, any> {
    return {
      manager_name: {
        type: 'string',
        patterns: ['my name is', "I'm", 'call me'],
        required: true,
        description: "Manager's preferred name"
      },
      team_size: {
        type: 'number',
        patterns: ['team of', 'manage', 'people', 'direct reports'],
        required: true,
        description: 'Number of team members'
      },
      team_tenure: {
        type: 'string',
        patterns: ['been managing', 'years', 'months', 'new to'],
        required: true,
        description: 'How long managing this team'
      },
      primary_challenge: {
        type: 'string',
        patterns: ['challenge', 'problem', 'issue', 'struggling with'],
        required: true,
        description: 'Main team challenge'
      },
      success_metrics: {
        type: 'array',
        patterns: ['success looks like', 'goals', 'objectives'],
        required: true,
        description: 'Definition of success'
      },
      timeline_preference: {
        type: 'string',
        patterns: ['timeline', 'timeframe', 'by when'],
        required: true,
        description: 'Preferred timeline'
      },
      budget_range: {
        type: 'string',
        patterns: ['budget', 'invest', 'spend', 'cost'],
        required: true,
        description: 'Budget range'
      },
      leader_commitment: {
        type: 'string',
        patterns: ['commit', 'dedicate', 'time', 'availability'],
        required: true,
        description: 'Leader time commitment'
      }
    };
  }
}

export function createOnboardingAgent(): OnboardingAgent {
  return new OnboardingAgent();
}