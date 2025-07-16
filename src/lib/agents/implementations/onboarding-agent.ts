import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, Message, AgentResponse, ToolCall, AgentTool } from '../types';
import { createOnboardingTools } from '../tools/onboarding-tools';
import { OnboardingGuardrails, GuardrailConfig } from '../guardrails/onboarding-guardrails';
import { OnboardingStateMachine } from './onboarding-state-machine';
import { OnboardingQualityCalculator, QualityMetrics } from './onboarding-quality-metrics';
import { ConversationState } from '../types/conversation-state';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { ConfigurableFlowEngine, FlowConfiguration } from '../graph';
import { ExtractionProcessor, ExtractionRule } from '../extraction/extraction-processor';
import { UserRole } from '@/lib/orchestrator/journey-phases';

// Re-export for backward compatibility
export { ConversationState };

export interface OnboardingMetadata {
  state: ConversationState;
  startTime: Date;
  capturedFields: Record<string, any>;
  requiredFieldsStatus: Record<string, boolean>;
  userRole?: UserRole;
  isComplete?: boolean;
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
  private guardrailConfig?: GuardrailConfig;
  
  // Required fields are now determined dynamically from extraction rules
  // This ensures consistency with the configured extraction rules in /admin/agents/config

  private static readonly STATE_INSTRUCTIONS: Record<ConversationState, { manager: string; teamMember: string }> = {
    [ConversationState.GREETING]: {
      manager: `
        Welcome the manager warmly and introduce yourself as their TMS transformation guide.
        Express enthusiasm about helping them transform their team.
        Ask for their name and what brings them to TMS today.
      `,
      teamMember: `
        Welcome the team member warmly and introduce yourself as their TMS guide.
        Express enthusiasm about helping them understand their work style better.
        Ask for their name and mention their manager invited them to complete assessments.
      `
    },
    [ConversationState.CONTEXT_DISCOVERY]: {
      manager: `
        Learn about their team context:
        - Team size and structure
        - How long they've been managing this team
        - Industry/department context
        - Recent changes or transitions
        Ask open-ended questions to understand their situation.
      `,
      teamMember: `
        Learn about their role and work context:
        - Current role and responsibilities
        - How long they've been in this role
        - What they enjoy most about their work
        - Any current challenges they face
        Keep it conversational and supportive.
      `
    },
    [ConversationState.CHALLENGE_EXPLORATION]: {
      manager: `
        Explore their primary challenges:
        - What specific issues are they facing?
        - How are these challenges impacting the team?
        - What have they tried so far?
        Use the knowledge base to relate their challenges to TMS solutions.
      `,
      teamMember: `
        Explore their work preferences:
        - How they prefer to work (independently vs collaboratively)
        - Communication style preferences
        - What motivates them at work
        - Areas where they'd like to grow
        Make them feel heard and valued.
      `
    },
    [ConversationState.TMS_EXPLANATION]: {
      manager: `
        Explain how TMS can help based on their specific challenges.
        Use the knowledge base to:
        - Share relevant success stories
        - Explain appropriate assessment tools
        - Describe the transformation journey
        Keep explanations relevant and concise.
      `,
      teamMember: `
        Explain the TMP assessment:
        - It helps understand their unique work personality
        - No right or wrong answers
        - Results will help the team work better together
        - Completely confidential
        Build excitement about discovering their profile.
      `
    },
    [ConversationState.GOAL_SETTING]: {
      manager: `
        Help them set SMART goals:
        - What specific outcomes do they want?
        - What does success look like?
        - What's their timeline?
        - How will they measure progress?
      `,
      teamMember: `
        For team members, skip this state and move to recap.
        Team members don't need to set transformation goals.
      `
    },
    [ConversationState.RESOURCE_CONFIRMATION]: {
      manager: `
        Discuss practical considerations:
        - Budget range for transformation
        - Time commitment from leader and team
        - Any constraints or considerations
        - Support from upper management
      `,
      teamMember: `
        For team members, skip this state.
        Resource discussions are only for managers.
      `
    },
    [ConversationState.STAKEHOLDER_MAPPING]: {
      manager: `
        Identify key stakeholders:
        - Who needs to be involved?
        - Who are the champions and skeptics?
        - How will they communicate the process?
        - What support systems exist?
      `,
      teamMember: `
        For team members, skip this state.
        Stakeholder mapping is only for managers.
      `
    },
    [ConversationState.RECAP_AND_HANDOFF]: {
      manager: `
        Summarize what you've learned:
        - Recap their team context and challenges
        - Confirm their goals and timeline
        - Review next steps (TMP assessment first)
        - Prepare handoff to Assessment Agent
        Ensure they feel confident about moving forward.
      `,
      teamMember: `
        Summarize and prepare for assessment:
        - Thank them for sharing about their role
        - Explain next step is the TMP assessment
        - Reassure them it's enjoyable and insightful
        - Prepare handoff to Assessment Agent
        Make them excited to discover their profile.
      `
    }
  };

  constructor() {
    const tools = createOnboardingTools();
    // Initially create guardrails with default config
    // Will be updated when configuration is loaded
    const guardrails = OnboardingGuardrails.createGuardrails();
    
    super({
      name: 'OnboardingAgent',
      description: 'Guides managers through initial TMS platform setup with personalized onboarding',
      handoffDescription: 'Start your TMS journey with a personalized onboarding conversation',
      instructions: (context: AgentContext) => {
        // This is now used as a fallback - the loaded configuration's systemPrompt takes precedence
        const metadata = context.metadata as OnboardingMetadata;
        const state = metadata?.state || ConversationState.GREETING;
        const userRole = metadata?.userRole || UserRole.MANAGER;
        const roleInstructions = OnboardingAgent.STATE_INSTRUCTIONS[state];
        const baseInstructions = userRole === UserRole.MANAGER ? 
          roleInstructions.manager : roleInstructions.teamMember;
        
        return `You are the TMS Onboarding Agent. Your role is to guide ${userRole === UserRole.MANAGER ? 'managers' : 'team members'} through their initial platform setup.

Current conversation state: ${state}
User role: ${userRole}

${baseInstructions}

Remember to:
- Be warm, professional, and encouraging
- Use the knowledge base to provide accurate TMS information
- Extract and validate required information naturally
- Monitor conversation quality and confidence
- Progress through states based on conversation flow
- Adapt your approach based on whether you're talking to a manager or team member

Required fields are determined by extraction rules configuration.`;
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
  
  protected async loadConfiguration() {
    // First call the parent class's loadConfiguration to set loadedConfig
    await super.loadConfiguration();
    
    // Then do OnboardingAgent-specific configuration loading
    try {
      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      if (config && config.prompts) {
        this.configuredPrompts = config.prompts;
      }
      
      // Load guardrail configuration and update guardrails
      if (config && config.guardrailConfig) {
        this.guardrailConfig = config.guardrailConfig as GuardrailConfig;
        // Update the input guardrails with the new configuration
        this.inputGuardrails = OnboardingGuardrails.createGuardrails(this.guardrailConfig);
        console.log('Loaded guardrail configuration for OnboardingAgent:', this.guardrailConfig);
      }
      
      // Load flow configuration if available
      if (config && config.flowConfig && this.flowEngine) {
        await this.flowEngine.loadConfiguration(config.flowConfig as FlowConfiguration);
        this.useGraphFlow = true;
        console.log('Loaded flow configuration for OnboardingAgent');
      }
      
      // Check knowledge configuration
      if (config && config.knowledgeConfig) {
        const knowledgeEnabled = config.knowledgeConfig.enabled === true;
        this.knowledgeEnabled = knowledgeEnabled;
        
        // Update tools based on knowledge configuration
        if (!knowledgeEnabled) {
          // Remove knowledge base tools from the tools array
          const { knowledgeBaseTools } = await import('../../knowledge-base');
          const knowledgeToolNames = knowledgeBaseTools.map(t => t.name);
          this.tools = this.tools.filter(tool => !knowledgeToolNames.includes(tool.name));
          console.log('Knowledge base disabled for OnboardingAgent');
        } else {
          console.log('Knowledge base enabled for OnboardingAgent');
        }
      }
    } catch (error) {
      console.error('Failed to load OnboardingAgent-specific configuration:', error);
      // Continue with default prompts
    }
  }

  /**
   * Override buildContextPrompt to include captured fields information
   * This ensures the LLM is aware of what information has already been extracted
   */
  protected buildContextPrompt(context: AgentContext): string {
    let prompt = super.buildContextPrompt(context);
    
    // Add captured fields to context
    const metadata = context.metadata.onboarding as OnboardingMetadata;
    
    // Debug logging
    console.log(`[OnboardingAgent.buildContextPrompt] Current state: ${metadata?.state}, isComplete: ${metadata?.isComplete}`);
    if (metadata?.requiredFieldsStatus) {
      console.log(`[OnboardingAgent.buildContextPrompt] Required fields status:`, JSON.stringify(metadata.requiredFieldsStatus));
    }
    
    // Check if we have missing required fields
    const missingFields = metadata?.requiredFieldsStatus ? 
      Object.entries(metadata.requiredFieldsStatus)
        .filter(([_, captured]) => !captured)
        .map(([field, _]) => field) : [];
    
    // If we're in RECAP_AND_HANDOFF state but still missing fields, handle retry
    if (metadata?.state === ConversationState.RECAP_AND_HANDOFF && missingFields.length > 0) {
      console.log(`[OnboardingAgent] RETRY LOGIC ACTIVATED - Will ask for: ${missingFields[0]}`);
      prompt += '\n\n⚠️ MISSING REQUIRED INFORMATION\n';
      prompt += 'You are almost done with onboarding, but some required information is missing.\n';
      prompt += '\nYour response should:\n';
      prompt += '1. Apologize politely for needing to ask again\n';
      prompt += '2. Explain that you need just a bit more information to complete their profile\n';
      prompt += '3. Ask for the FIRST missing field from the list below using the alternative phrasing\n';
      prompt += '4. Ask ONLY ONE question at a time\n\n';
      
      // Provide alternative phrasings for missing fields
      const retryPhrasings: Record<string, string> = {
        'user_name': "I don't think I caught your name earlier. What should I call you?",
        'user_role': "I may have missed your job title. What's your current role in the organization?",
        'team_size': "I didn't quite catch how many people are on your team. How many team members do you have? (Enter 0 if you're working solo for now)",
        'organization': "Could you remind me which company or organization you work for?",
        'primary_challenge': "Let me make sure I understand - what's the main challenge you're facing with your team right now?"
      };
      
      prompt += 'Missing fields and how to ask:\n';
      missingFields.forEach(field => {
        const phrasing = retryPhrasings[field] || `Please provide your ${field.replace(/_/g, ' ')}`;
        prompt += `- ${field}: "${phrasing}"\n`;
      });
      
      prompt += '\nIMPORTANT: Only ask for the FIRST missing field. Be warm and conversational.\n';
      return prompt;
    }
    
    // Check if onboarding is complete (all fields captured)
    if (metadata?.isComplete) {
      prompt += '\n\n🎉 ONBOARDING COMPLETE! All required information has been captured.\n';
      prompt += '\nCaptured information:\n';
      for (const [field, value] of Object.entries(metadata.capturedFields)) {
        const displayName = field.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        prompt += `- ${displayName}: ${value}\n`;
      }
      prompt += '\nYour response should:\n';
      prompt += '1. Acknowledge that you have all the information needed\n';
      prompt += '2. Briefly summarize what you\'ve learned about them and their team\n';
      prompt += '3. Express excitement about helping them transform their team\n';
      prompt += '4. Let them know they\'re ready to begin their transformation journey\n';
      prompt += '5. End with: "Let\'s begin building something amazing together."\n';
      prompt += '\nDO NOT ask any more questions. Keep the response positive and forward-looking.\n';
      return prompt;
    }
    
    if (metadata?.capturedFields && Object.keys(metadata.capturedFields).length > 0) {
      prompt += '\n\nAlready captured information:\n';
      for (const [field, value] of Object.entries(metadata.capturedFields)) {
        // Format field name for display with special handling for common fields
        let displayName = field;
        
        // Map field names to user-friendly display names
        const fieldDisplayMap: Record<string, string> = {
          'user_name': 'Name',
          'manager_name': 'Name',
          'user_role': 'Role',
          'manager_role': 'Role',
          'team_size': 'Team Size',
          'primary_challenge': 'Primary Challenge',
          'team_tenure': 'Team Tenure',
          'budget_range': 'Budget Range',
          'leader_commitment': 'Leader Commitment',
          'success_metrics': 'Success Metrics',
          'timeline_preference': 'Timeline Preference',
          'key_stakeholders': 'Key Stakeholders'
        };
        
        displayName = fieldDisplayMap[field] || field.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        prompt += `- ${displayName}: ${value}\n`;
      }
      prompt += '\nIMPORTANT: Do not ask for information that has already been captured above. ';
      prompt += 'Focus your questions on gathering only the missing required information.\n';
    }
    
    // Add missing required fields
    if (metadata?.requiredFieldsStatus) {
      const missingFields = Object.entries(metadata.requiredFieldsStatus)
        .filter(([_, captured]) => !captured)
        .map(([field, _]) => field);
      
      if (missingFields.length > 0) {
        prompt += '\nStill need to capture:\n';
        missingFields.forEach(field => {
          // Use the same field display map for consistency
          const fieldDisplayMap: Record<string, string> = {
            'user_name': 'Name',
            'manager_name': 'Name',
            'user_role': 'Role',
            'manager_role': 'Role',
            'team_size': 'Team Size',
            'primary_challenge': 'Primary Challenge',
            'team_tenure': 'Team Tenure',
            'budget_range': 'Budget Range',
            'leader_commitment': 'Leader Commitment',
            'success_metrics': 'Success Metrics',
            'timeline_preference': 'Timeline Preference',
            'key_stakeholders': 'Key Stakeholders'
          };
          
          const displayName = fieldDisplayMap[field] || field.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          prompt += `- ${displayName}\n`;
        });
      }
    }
    
    return prompt;
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
      id: `msg-${Date.now()}`,
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
      context.metadata.onboarding = await this.initializeMetadata();
    }

    const metadata = context.metadata.onboarding as OnboardingMetadata;

    // Process the message and extract information
    const extractedData = await this.extractInformation(message, context);
    await this.updateCapturedFields(metadata, extractedData);

    // Update conversation state based on progress
    const newState = await this.determineNextState(metadata, context);
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

    // Check if response is asking about a field with suggested values
    const suggestedValues = await this.getSuggestedValuesForCurrentContext(message, response.message || '', metadata);
    if (suggestedValues) {
      response.metadata = {
        ...response.metadata,
        suggestedValues
      };
    }

    return response;
  }

  private async initializeMetadata(): Promise<OnboardingMetadata> {
    // Determine user role from context or default to manager
    const userRole = await this.getUserRole();
    
    // Get required fields from extraction rules based on role
    const requiredFields = await this.getRequiredFields(userRole);
    const requiredFieldsStatus: Record<string, boolean> = {};
    requiredFields.forEach(field => {
      requiredFieldsStatus[field] = false;
    });

    // Reset state machine to initial state
    this.stateMachine.setState(ConversationState.GREETING);
    
    return {
      state: ConversationState.GREETING,
      startTime: new Date(),
      capturedFields: {},
      requiredFieldsStatus,
      userRole,
      qualityMetrics: {
        rapportScore: 0,
        managerConfidence: 'low',
        completionPercentage: 0
      },
      stateTransitions: []
    };
  }
  
  private async getUserRole(): Promise<UserRole> {
    // Try to get user role from the database via context
    // This would be set when a team member is invited by their manager
    // For now, default to MANAGER
    // TODO: Implement proper role detection based on user context
    return UserRole.MANAGER;
  }

  /**
   * Helper method to get required fields from extraction rules
   */
  private async getRequiredFields(userRole?: UserRole): Promise<string[]> {
    try {
      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      let extractionRules: Record<string, ExtractionRule> = {};
      
      if (config && config.extractionRules) {
        extractionRules = config.extractionRules as Record<string, ExtractionRule>;
      } else {
        // Fall back to default extraction rules
        extractionRules = AgentConfigLoader.getDefaultExtractionRules('OnboardingAgent') as Record<string, ExtractionRule>;
      }

      // Filter fields based on user role
      const roleBasedFields = this.filterFieldsByRole(extractionRules, userRole || UserRole.MANAGER);
      
      // Return field names where required is true
      return Object.entries(roleBasedFields)
        .filter(([_, rule]) => rule.required === true)
        .map(([fieldName, _]) => fieldName);
    } catch (error) {
      console.error('Error getting required fields:', error);
      // Fall back to default extraction rules on error
      try {
        const defaultRules = AgentConfigLoader.getDefaultExtractionRules('OnboardingAgent') as Record<string, ExtractionRule>;
        const roleBasedFields = this.filterFieldsByRole(defaultRules, userRole || UserRole.MANAGER);
        return Object.entries(roleBasedFields)
          .filter(([_, rule]) => rule.required === true)
          .map(([fieldName, _]) => fieldName);
      } catch (fallbackError) {
        console.error('Error getting default extraction rules:', fallbackError);
        return [];
      }
    }
  }
  
  private filterFieldsByRole(
    rules: Record<string, ExtractionRule>, 
    userRole: UserRole
  ): Record<string, ExtractionRule> {
    // For managers, we should only include manager-specific fields
    // Filter out duplicate fields (e.g., if both user_name and manager_name exist)
    const filtered: Record<string, ExtractionRule> = {};
    
    for (const [fieldName, rule] of Object.entries(rules)) {
      // Skip duplicate manager_name if user_name is already present
      if (fieldName === 'manager_name' && rules['user_name']) {
        continue;
      }
      // Skip duplicate manager_role if user_role is already present
      if (fieldName === 'manager_role' && rules['user_role']) {
        continue;
      }
      filtered[fieldName] = rule;
    }
    
    return filtered;
  }

  private async extractInformation(message: string, context: AgentContext): Promise<Record<string, any>> {
    try {
      // Load extraction rules from configuration
      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      let extractionRules: Record<string, ExtractionRule> = {};
      
      if (config && config.extractionRules) {
        extractionRules = config.extractionRules as Record<string, ExtractionRule>;
      } else {
        // Fall back to default extraction rules
        extractionRules = AgentConfigLoader.getDefaultExtractionRules('OnboardingAgent') as Record<string, ExtractionRule>;
      }

      // Get previously captured fields to avoid re-extracting
      const metadata = context.metadata?.onboarding as OnboardingMetadata;
      const previouslyCaptured = metadata?.capturedFields || {};

      // Filter rules to only fields not yet captured
      const fieldsToExtract: Record<string, ExtractionRule> = {};
      for (const [fieldName, rule] of Object.entries(extractionRules)) {
        // Only try to extract fields we haven't captured yet
        if (!previouslyCaptured[fieldName]) {
          fieldsToExtract[fieldName] = rule;
        }
      }

      // Use ExtractionProcessor to extract and track
      const enableLLM = true; // Always use LLM extraction for consistency with streaming route
      console.log(`[OnboardingAgent] LLM extraction enabled: ${enableLLM}`);
      
      const extractionContext = {
        conversationId: context.conversationId,
        agentName: 'OnboardingAgent',
        teamId: context.teamId,
        managerId: context.managerId,
        enableLLMFallback: enableLLM
      };

      const { extracted, results } = await ExtractionProcessor.extractAndTrack(
        message,
        fieldsToExtract,
        extractionContext
      );

      // Filter out any unsuccessful extractions to avoid overwriting with null
      const successfulExtractions: Record<string, any> = {};
      for (const [field, value] of Object.entries(extracted)) {
        if (value !== null && value !== undefined && value !== '') {
          successfulExtractions[field] = value;
        }
      }

      // Update metadata with extraction results count (backward compatibility)
      context.metadata.extractionsTracked = results.length;

      console.log(`[OnboardingAgent] Extracted from message: ${JSON.stringify(successfulExtractions)}`);
      
      return successfulExtractions;
    } catch (error: any) {
      console.error('Error extracting information:', error);
      // Return empty object on error to prevent conversation crash
      return {};
    }
  }

  private async updateCapturedFields(metadata: OnboardingMetadata, extractedData: Record<string, any>) {
    // Handle field aliases - normalize to consistent names
    const normalizedData: Record<string, any> = {};
    for (const [field, value] of Object.entries(extractedData)) {
      // Normalize manager_name to user_name
      if (field === 'manager_name' && !extractedData['user_name']) {
        normalizedData['user_name'] = value;
      }
      // Normalize manager_role to user_role
      else if (field === 'manager_role' && !extractedData['user_role']) {
        normalizedData['user_role'] = value;
      }
      else {
        normalizedData[field] = value;
      }
    }
    
    // Update captured fields with normalized data
    Object.assign(metadata.capturedFields, normalizedData);

    // Get required fields from extraction rules based on user role
    const requiredFields = await this.getRequiredFields(metadata.userRole);

    // Update required fields status - check both field name and any aliases
    requiredFields.forEach(field => {
      if (field === 'user_name' && (metadata.capturedFields['user_name'] || metadata.capturedFields['manager_name'])) {
        metadata.requiredFieldsStatus[field] = true;
      } else if (field === 'user_role' && (metadata.capturedFields['user_role'] || metadata.capturedFields['manager_role'])) {
        metadata.requiredFieldsStatus[field] = true;
      } else if (metadata.capturedFields[field]) {
        metadata.requiredFieldsStatus[field] = true;
      }
    });

    // Update completion percentage
    const completedFields = Object.values(metadata.requiredFieldsStatus).filter(Boolean).length;
    const totalRequiredFields = requiredFields.length;
    metadata.qualityMetrics.completionPercentage = 
      totalRequiredFields > 0 ? (completedFields / totalRequiredFields) * 100 : 0;
    
    // Check if all required fields are now captured
    if (completedFields === totalRequiredFields && totalRequiredFields > 0) {
      metadata.isComplete = true;
    }
  }

  private async determineNextState(metadata: OnboardingMetadata, context: AgentContext): Promise<ConversationState> {
    // Update state machine with current state
    this.stateMachine.setState(metadata.state);
    
    // Map captured fields to conversation data format
    const conversationData = this.mapToConversationData(metadata.capturedFields);
    
    // Get missing required fields
    const missingFields = await this.getMissingRequiredFields(metadata.capturedFields, metadata.userRole);
    
    // If all required fields are captured and we're not in RECAP_AND_HANDOFF, force transition
    if (missingFields.length === 0 && metadata.state !== ConversationState.RECAP_AND_HANDOFF) {
      const requiredFields = await this.getRequiredFields(metadata.userRole);
      if (requiredFields.length > 0) {
        console.log('[OnboardingAgent] All required fields captured, forcing transition to RECAP_AND_HANDOFF');
        this.stateMachine.setState(ConversationState.RECAP_AND_HANDOFF);
        return ConversationState.RECAP_AND_HANDOFF;
      }
    }
    
    // Check if we should force progression based on missing fields
    if (missingFields.length > 0 && metadata.state === ConversationState.GREETING) {
      // Force move to basic info collection
      this.stateMachine.setState(ConversationState.CONTEXT_DISCOVERY);
      return ConversationState.CONTEXT_DISCOVERY;
    }
    
    // Special handling: If we're in STAKEHOLDER_MAPPING and have been here for a while,
    // allow transition to RECAP_AND_HANDOFF even with missing fields so retry logic can trigger
    if (metadata.state === ConversationState.STAKEHOLDER_MAPPING) {
      const messageCount = context.messageHistory.filter(m => m.role === 'user').length;
      if (messageCount > 10) { // After reasonable conversation length
        console.log(`[OnboardingAgent] Forcing transition to RECAP_AND_HANDOFF after ${messageCount} messages to trigger retry logic`);
        this.stateMachine.setState(ConversationState.RECAP_AND_HANDOFF);
        return ConversationState.RECAP_AND_HANDOFF;
      }
    }
    
    // Attempt state transition normally
    if (this.stateMachine.attemptTransition(conversationData)) {
      const newState = this.stateMachine.getState();
      console.log(`[OnboardingAgent] State transition: ${metadata.state} → ${newState}`);
      return newState;
    }
    
    // If no transition possible but we've gone through many states, force RECAP_AND_HANDOFF
    // This ensures the retry logic can eventually trigger
    const stateProgression = ['GREETING', 'CONTEXT_DISCOVERY', 'CHALLENGE_EXPLORATION', 'TMS_EXPLANATION', 
                              'GOAL_SETTING', 'RESOURCE_CONFIRMATION', 'STAKEHOLDER_MAPPING'];
    const currentIndex = stateProgression.indexOf(metadata.state);
    if (currentIndex >= 5 && missingFields.length > 0) { // If we're past RESOURCE_CONFIRMATION
      console.log(`[OnboardingAgent] Forcing RECAP_AND_HANDOFF to allow retry logic (missing: ${missingFields.join(', ')})`);
      this.stateMachine.setState(ConversationState.RECAP_AND_HANDOFF);
      return ConversationState.RECAP_AND_HANDOFF;
    }
    
    return metadata.state;
  }
  
  private async getMissingRequiredFields(capturedFields: Record<string, any>, userRole?: UserRole): Promise<string[]> {
    const requiredFields = await this.getRequiredFields(userRole);
    return requiredFields.filter(field => !capturedFields[field]);
  }
  
  private mapToConversationData(capturedFields: Record<string, any>): any {
    return {
      managerName: capturedFields.user_name || capturedFields.manager_name || capturedFields.name,
      managerRole: capturedFields.user_role || capturedFields.manager_role,
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
    // First check if all required fields are captured
    const allFieldsCaptured = metadata.requiredFieldsStatus ? 
      Object.values(metadata.requiredFieldsStatus).every(status => status === true) : false;
    
    if (!allFieldsCaptured) {
      console.log('[OnboardingAgent] Not ready for handoff - missing required fields');
      return false;
    }
    
    const conversationData = this.mapToConversationData(metadata.capturedFields);
    const metrics: QualityMetrics = {
      completionPercentage: metadata.qualityMetrics.completionPercentage,
      rapportScore: metadata.qualityMetrics.rapportScore,
      managerConfidenceLevel: metadata.qualityMetrics.managerConfidence === 'high' ? 80 : 
                             metadata.qualityMetrics.managerConfidence === 'medium' ? 50 : 20
    };
    
    return this.qualityCalculator.isReadyForHandoff(conversationData, metrics) && 
           metadata.state === ConversationState.RECAP_AND_HANDOFF &&
           metadata.isComplete === true;
  }

  private async getSuggestedValuesForCurrentContext(
    userMessage: string,
    agentResponse: string,
    metadata: OnboardingMetadata
  ): Promise<{ field: string; values: string[]; helpText?: string } | null> {
    try {
      // Check if user seems uncertain (common patterns)
      const uncertaintyPatterns = [
        /\b(dunno|don't\s+know|not\s+sure|unsure|maybe|umm+|uhh+|idk)\b/i,
        /\b(no\s+idea|no\s+clue|hard\s+to\s+say|difficult\s+to)\b/i,
        /\b(need\s+to\s+think|let\s+me\s+think|good\s+question)\b/i,
        /^(hmm+|err+|uh+)\.?$/i,
        /\?+$/  // Ends with question marks
      ];
      
      const userIsUncertain = uncertaintyPatterns.some(pattern => pattern.test(userMessage));
      
      // Get extraction rules to check for suggested values
      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      if (!config || !config.extractionRules) {
        return null;
      }
      
      const extractionRules = config.extractionRules as Record<string, ExtractionRule>;
      
      // Analyze agent response to determine which field is being asked about
      const fieldPatterns: Record<string, RegExp[]> = {
        manager_role: [
          /what.*role|what.*position|what.*title|your\s+role|job\s+title/i,
          /role.*company|position.*organization/i
        ],
        primary_challenge: [
          /challenge|problem|issue|struggle|difficulty|concern/i,
          /what.*facing|what.*dealing|what.*struggling/i
        ],
        team_size: [
          /how\s+many.*team|size.*team|people.*manage|team.*members/i
        ],
        organization: [
          /company|organization|where.*work|employer/i
        ]
      };
      
      // Find which field the agent is asking about
      let currentField: string | null = null;
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (patterns.some(pattern => pattern.test(agentResponse))) {
          currentField = field;
          break;
        }
      }
      
      // If we found a field being asked about, check if it has suggested values
      if (currentField && extractionRules[currentField]) {
        const rule = extractionRules[currentField];
        
        // Show suggestions if the field has suggested values configured
        // This allows proactive suggestion display when asking about fields with suggestions
        if (rule.suggestedValues && rule.suggestedValues.length > 0) {
          return {
            field: currentField,
            values: rule.suggestedValues,
            helpText: rule.description
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting suggested values:', error);
      return null;
    }
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