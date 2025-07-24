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
        const configPrompt = this.loadedConfig?.systemPrompt || 
          `You are the TMS Debrief Agent. Your role is to provide comprehensive debriefs for completed assessments.`;
        
        // Add TMP debrief instructions
        const tmpDebriefInstructions = `

## TMP Debrief Flow

When conducting a TMP debrief, follow these numbered steps:

1. Read through the user's completed TMP report and understand it. Use the TMS knowledge base for context on the Team Management Profile (TMP) report, terminology and research.

2. Retrieve the full TMP profile result using tms_generate_html_report or tms_debrief_report and store this as $PROFILE

3. From $PROFILE, display the following information:
   - Major Role:
   - 1st Related Role:
   - 2nd Related Role:  
   - Net Scores:
   - Key Points of Note:

4. Say: "The purpose of our session is to learn more about yourself, explore your personal team management profile, the implications for your job role, and use that information as a catalyst to review and fine-tune how you work. To get started, what are your main objectives from the debrief session today?"
   - Suggest 3 example objectives for a TMP debrief
   - Wait for user response and record as $OBJECTIVES

5. Ask: "From looking at your profile, what are your 3 highlights?"
   - Suggest examples from the 'Leadership Strengths' section of $PROFILE
   - Wait for user response and record as $HIGHLIGHTS

6. Ask: "What would be 2 suggestions that other people might follow to effectively communicate with you?"
   - Show examples from 'Areas for Self Assessment' section
   - Wait for user response and record as $COMMUNICATION

7. Ask: "What is 1 area that other people might follow to support you better?"
   - Wait for user response and record as $SUPPORT

8. Summarize by listing:
   - Objectives: $OBJECTIVES
   - Highlights: $HIGHLIGHTS
   - Communication Tips: $COMMUNICATION
   - Support Needs: $SUPPORT

9. Thank the user and note that this information will guide their journey in future.`;
        
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
    // Check if this is the start of a conversation
    if (!context.conversationId || context.messageCount === 0) {
      // Add instruction to check for available reports
      const checkReportsPrompt = `REMINDER: This is the start of a new conversation. 
You MUST immediately use tms_get_dashboard_subscriptions to check for completed assessments.
After checking, proactively offer to debrief any completed assessments you find.

User message: ${message}`;
      
      // Process with the modified message
      const response = await super.processMessage(checkReportsPrompt, context);
      
      return response;
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