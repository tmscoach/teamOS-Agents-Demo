import { OpenAIAgent } from './base-openai-agent';
import { AgentContext, AgentResponse, AgentTool } from '../types';
import { createTMSTools } from '../tools/tms-tool-factory';
import { getToolsForAgent } from '../tools/tms-tool-registry';
import { knowledgeBaseTools } from '../../knowledge-base';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { DebriefGuardrails, DebriefGuardrailConfig } from '../guardrails/debrief-guardrails';
import { JourneyTracker } from '@/lib/orchestrator/journey-tracker';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';

/**
 * OpenAI-powered Debrief Agent with TMS tools and knowledge base
 */
export class OpenAIDebriefAgent extends OpenAIAgent {
  private tmsTools: AgentTool[] = [];
  private guardrailConfig: DebriefGuardrailConfig = {
    enableProfanityCheck: true,
    enableSafetyCheck: true,
    enableReportAccessCheck: true,
    maxQuestionsPerSession: 30
  };
  
  constructor() {
    console.log(`[OpenAIDebriefAgent] Constructor called - custom implementation`);
    // Create guardrails
    const guardrails = DebriefGuardrails.createGuardrails();
    console.log(`[DebriefAgent] Created ${guardrails.length} guardrails:`, guardrails.map(g => g.name));
    
    super({
      name: 'DebriefAgent',
      description: 'Provides assessment debriefs and generates reports for completed assessments',
      handoffDescription: 'Let me provide insights from your completed assessment',
      inputGuardrails: guardrails,
      instructions: () => {
        // Get system prompt from config
        let configPrompt = this.loadedConfig?.systemPrompt || 
          `You are the TMS Debrief Agent. Your role is to provide comprehensive debriefs for completed assessments.`;
        
        // CRITICAL: Remove the auto-check instruction from config to prevent duplicate checks
        configPrompt = configPrompt.replace(
          /IMMEDIATELY use tms_get_dashboard_subscriptions to check for completed assessments/g,
          'Wait for specific instructions about when to check for assessments'
        );
        
        // Add TMP debrief instructions
        const tmpDebriefInstructions = `

## TMP Debrief Flow - Optimized for Conversational Experience

When conducting a TMP debrief, focus on creating a natural conversation:

1. **Start Immediately with Objectives** (DO NOT load full report first)
   - After user confirms debrief, immediately ask: "Great! The purpose of our session is to learn more about yourself, explore your personal team management profile, and use that information as a catalyst to review and fine-tune how you work. To get started, what are your main objectives from the debrief session today?"
   - Suggest 3 example objectives if helpful
   - Record response as $OBJECTIVES

2. **Progressive Information Loading**
   - Only use tms_debrief_report when you need specific information to answer questions
   - Load profile details (roles, scores) only when discussing them specifically
   - Keep the conversation flowing naturally without long pauses for data loading

3. **Gather Key Insights** (in order):
   - Highlights: "What are your 3 highlights from looking at your profile?"
   - Communication: "What would be 2 suggestions that other people might follow to effectively communicate with you?"
   - Support: "What is 1 area that other people might follow to support you better?"

4. **Use Report Data Intelligently**
   - When user mentions specific aspects, then load that data
   - Example: If user asks about their Major Role, then query: "Show me the Major Role and Related Roles from the TMP report"
   - Don't pre-load everything - let the conversation guide what data you need

5. **Summary and Wrap-up**
   - Summarize the captured objectives, highlights, communication tips, and support needs
   - Thank the user and note how this information will guide their journey

Remember: The goal is a <5 second response time after user confirms. Prioritize conversation flow over data completeness.`;
        
        return configPrompt + tmpDebriefInstructions;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'AlignmentAgent',
        condition: () => true
      }]
    });
  }

  /**
   * Initialize agent with TMS tools and knowledge base
   */
  async initialize(): Promise<void> {
    // Load configuration
    await this.ensureConfigLoaded();
    
    // Update guardrails if configuration provides them
    if (this.loadedConfig?.guardrailConfig) {
      this.guardrailConfig = { ...this.guardrailConfig, ...this.loadedConfig.guardrailConfig };
      this.inputGuardrails = DebriefGuardrails.createGuardrails(this.guardrailConfig);
      console.log(`[${this.name}] Updated guardrails from configuration`);
    }
    
    // Load TMS tools
    await this.loadTMSTools();
    
    // Add knowledge base tools if enabled
    if (this.loadedConfig?.knowledgeConfig?.enabled !== false) {
      this.tools.push(...knowledgeBaseTools);
      console.log(`Knowledge base enabled for ${this.name}`);
    }
  }

  /**
   * Load TMS tools from registry
   */
  private async loadTMSTools(): Promise<void> {
    try {
      // Get configured tools from registry
      const configuredToolNames = getToolsForAgent(this.name);
      
      // Load tools from configuration if available
      if (this.loadedConfig?.toolsConfig) {
        // Handle different formats of toolsConfig
        const toolsConfig = this.loadedConfig.toolsConfig as any;
        
        // If tmsTools is an array, use it
        if (Array.isArray(toolsConfig.tmsTools)) {
          configuredToolNames.push(...toolsConfig.tmsTools);
        }
        // If enabledTools exists (from the new format), use those
        else if (Array.isArray(toolsConfig.enabledTools)) {
          configuredToolNames.push(...toolsConfig.enabledTools);
        }
        // If it's an object with boolean flags, extract enabled tools
        else if (typeof toolsConfig === 'object') {
          const enabledTools = Object.entries(toolsConfig)
            .filter(([key, value]) => value === true && key !== 'enabledTools')
            .map(([key]) => key);
          configuredToolNames.push(...enabledTools);
        }
      }
      
      // Create TMS tool instances
      const tmsTools = await createTMSTools(configuredToolNames);
      this.tmsTools = tmsTools;
      
      // Add to agent's tool list
      this.tools.push(...tmsTools);
      
      console.log(`[${this.name}] Loaded ${tmsTools.length} TMS tools`);
    } catch (error) {
      console.error(`[${this.name}] Failed to load TMS tools:`, error);
    }
  }

  /**
   * Override processMessage to check for available reports and handle debrief completion
   */
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    console.log(`[${this.name}] Processing message:`, {
      message,
      conversationId: context.conversationId,
      messageCount: context.messageCount,
      messageHistoryLength: context.messageHistory?.length || 0
    });
    
    // Debug message history
    if (context.messageHistory) {
      console.log(`[${this.name}] Message history:`, 
        context.messageHistory.map((msg, idx) => ({
          index: idx,
          role: msg.role,
          contentPreview: msg.content?.substring(0, 100) + '...'
        }))
      );
    }
    
    // Check if this is a confirmation message after we've already offered a debrief
    const isConfirmation = context.messageCount > 0 && (
      message.toLowerCase().includes('yes') || 
      message.toLowerCase().includes('please') ||
      message.toLowerCase().includes('start') ||
      message.toLowerCase().includes('let\'s') ||
      message.toLowerCase().includes('sure') ||
      message.toLowerCase().includes('go ahead')
    );
    
    // Check if the previous message history indicates we've already checked subscriptions
    const hasAlreadyCheckedSubscriptions = context.messageHistory?.some(msg => 
      msg.content && (
        msg.content.includes('I see you have completed') ||
        msg.content.includes('Team Management Profile (TMP) assessment')
      )
    );
    
    console.log(`[${this.name}] Confirmation check:`, {
      isConfirmation,
      hasAlreadyCheckedSubscriptions,
      willSkipToObjectives: isConfirmation && hasAlreadyCheckedSubscriptions
    });
    
    // If user is confirming and we've already checked subscriptions, skip to objectives
    if (isConfirmation && hasAlreadyCheckedSubscriptions) {
      const skipToObjectivesPrompt = `The user has confirmed they want to start the TMP debrief. 
DO NOT check subscriptions again - we already know they have a completed TMP assessment.
Go directly to the debrief flow starting with: "Great! The purpose of our session is to learn more about yourself, explore your personal team management profile, and use that information as a catalyst to review and fine-tune how you work. To get started, what are your main objectives from the debrief session today?"

DO NOT use tms_get_dashboard_subscriptions.
DO NOT load the full report yet. Only load report data when needed to answer specific questions.

User message: ${message}`;
      
      console.log(`[${this.name}] User confirmed debrief, skipping to objectives`);
      
      return super.processMessage(skipToObjectivesPrompt, context);
    }
    
    // Check if this is the start of a conversation
    if (!context.conversationId || context.messageCount === 0 || message.includes('[User joined')) {
      // Add instruction to check for available reports
      const checkReportsPrompt = `REMINDER: This is the start of a new conversation. 
You MUST immediately use tms_get_dashboard_subscriptions to check for completed assessments.
After checking, proactively offer to debrief any completed assessments you find.

User message: ${message}`;
      
      console.log(`[${this.name}] First message - checking for subscriptions`);
      
      return super.processMessage(checkReportsPrompt, context);
    }
    
    // Normal processing
    const response = await super.processMessage(message, context);
    
    // Check if debrief was completed based on extracted variables
    if (response.metadata?.extractedVariables?.debrief_completed === true) {
      await this.handleDebriefCompletion(context, response);
    }
    
    return response;
  }
  
  /**
   * Handle debrief completion and update journey tracker
   */
  private async handleDebriefCompletion(
    context: AgentContext,
    response: AgentResponse
  ): Promise<void> {
    try {
      const journeyTracker = new JourneyTracker(context.managerId);
      const extractedVars = response.metadata?.extractedVariables || {};
      
      // Determine assessment type
      const assessmentType = extractedVars.assessment_type || 'unknown';
      
      // Mark debrief as viewed with extracted variables
      await journeyTracker.markDebriefViewed(`${assessmentType}_debrief`, {
        subscriptionId: extractedVars.subscriptionId,
        objectives: extractedVars.objectives,
        highlights: extractedVars.highlights,
        communication: extractedVars.communication,
        support: extractedVars.support,
        culture_type: extractedVars.culture_type,
        team_strengths: extractedVars.team_strengths,
        priority_actions: extractedVars.priority_actions,
        completedAt: new Date()
      });
      
      // Check if user should move to continuous engagement phase
      const journey = await journeyTracker.getCurrentJourney();
      const requiredDebriefs = ['tmp_debrief']; // TMP is required
      
      const hasCompletedRequiredDebriefs = requiredDebriefs.every(
        debrief => journey.viewedDebriefs[debrief]
      );
      
      if (hasCompletedRequiredDebriefs && journey.currentPhase === JourneyPhase.DEBRIEF) {
        // Update journey phase to continuous engagement
        await journeyTracker.updateJourneyProgress('debrief_complete', {
          phase: JourneyPhase.CONTINUOUS_ENGAGEMENT,
          timestamp: new Date()
        });
        
        console.log(`[${this.name}] Updated journey phase to CONTINUOUS_ENGAGEMENT for user ${context.managerId}`);
      }
      
      console.log(`[${this.name}] Marked ${assessmentType} debrief as complete for user ${context.managerId}`);
    } catch (error) {
      console.error(`[${this.name}] Failed to update journey tracker:`, error);
      // Don't throw - this shouldn't break the debrief flow
    }
  }
}

export async function createOpenAIDebriefAgent(): Promise<OpenAIDebriefAgent> {
  const agent = new OpenAIDebriefAgent();
  await agent.initialize();
  return agent;
}