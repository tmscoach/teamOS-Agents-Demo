import { OpenAIAgent } from './base-openai-agent';
import { AgentContext, AgentResponse, AgentTool } from '../types';
import { createTMSTools } from '../tools/tms-tool-factory';
import { getToolsForAgent } from '../tools/tms-tool-registry';
import { knowledgeBaseTools } from '../../knowledge-base';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { DebriefGuardrails, DebriefGuardrailConfig } from '../guardrails/debrief-guardrails';
import { JourneyTracker } from '@/lib/orchestrator/journey-tracker';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';
import { createSearchReportChunksTool } from '../tools/search-report-chunks';
import { createGetReportContextTool } from '../tools/get-report-context';
import { createSearchReportImagesTool } from '../tools/search-report-images';
import { getDebriefReportTools } from '../tools/debrief-report-tools';

/**
 * OpenAI-powered Debrief Agent with TMS tools and knowledge base
 */
export class OpenAIDebriefAgent extends OpenAIAgent {
  private tmsTools: AgentTool[] = [];
  private reportSearchTool: AgentTool;
  private reportContextTool: AgentTool;
  private reportImagesTool: AgentTool;
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
      instructions: (context?: AgentContext) => {
        // Get report context from metadata
        const reportType = context?.metadata?.assessmentType || 'assessment';
        const subscriptionId = context?.metadata?.subscriptionId || '';
        
        return `You are the TMS Debrief Agent, specializing in helping managers understand their ${reportType} assessment results.

Your personality:
- Knowledgeable and insightful about TMS assessments
- Encouraging and constructive in feedback
- Clear in explaining complex concepts
- Focused on actionable insights
- Professional yet approachable

Your responsibilities:
1. Explain what the assessment results mean in practical terms
2. Clarify scores, colors, and percentages in the report
3. Provide context about roles, preferences, and team dynamics
4. Answer questions about specific sections or scores
5. Suggest concrete next steps based on the results
6. Connect results to real-world team scenarios
7. Help managers understand how to apply insights to improve team performance

Report-Specific Guidance:
- TMP Reports: Focus on major/related roles, work preferences (ICBS scores), and how these impact team dynamics
- Team Signals: Explain the 8 sectors of High Energy Teams, color meanings (red=needs attention, amber=developing, green=strong)
- QO2: Clarify organizational effectiveness quadrants and improvement opportunities

Visual Elements in Reports:
- The wheel/graph shows your assessment profile visually
- Colors indicate areas of strength and areas needing development
- Percentages show relative scores compared to maximum possible
- Sections are interactive - you can ask about any specific area

IMPORTANT: 
- Base all answers on the actual report content - use the search tools to find specific information
- Be specific and reference actual scores/data from the user's report
- Avoid generic advice - tailor responses to their specific results
- When user asks about a section, use search_report_chunks to find the relevant content
- If discussing visual elements, use search_report_images to understand what they show

Context Information:
- Subscription ID: ${subscriptionId}
- Report Type: ${reportType}
- You have access to the full report content through search tools

Voice Interaction Guidelines:
- For voice queries, keep responses concise and conversational
- Offer to elaborate if the user wants more detail
- Use natural pauses between key points
- Summarize complex information into digestible chunks`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'AlignmentAgent',
        condition: () => true
      }]
    });
    
    // Initialize report search tools
    this.reportSearchTool = createSearchReportChunksTool();
    this.reportContextTool = createGetReportContextTool();
    this.reportImagesTool = createSearchReportImagesTool();
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
    
    // Always add report search tools
    this.addReportTools();
  }
  
  /**
   * Add report-specific tools
   */
  private addReportTools(): void {
    const reportTools: AgentTool[] = [
      this.reportSearchTool,
      this.reportContextTool,
      this.reportImagesTool,
      ...getDebriefReportTools() // Add debrief-specific tools
    ];
    
    // Add to tools array
    this.tools.push(...reportTools);
    console.log(`[${this.name}] Added ${reportTools.length} report tools to total of ${this.tools.length} tools`);
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
   * Override buildSystemMessage to prevent duplicate instructions
   */
  protected buildSystemMessage(context: AgentContext): string {
    // If we have a loaded configuration with systemPrompt, use it without adding extra instructions
    if (this.loadedConfig?.systemPrompt) {
      let systemMessage = this.loadedConfig.systemPrompt;
      
      // Skip adding context-specific instructions to avoid duplicates
      // The config already has all necessary instructions
      
      // Add context information using parent's method
      // @ts-ignore - accessing protected method from parent
      systemMessage += super.buildContextPrompt(context);
      
      // Add available tools and handoffs using parent's method
      // @ts-ignore - accessing protected method from parent
      return super.addToolsAndHandoffsToMessage(systemMessage);
    }
    
    // Otherwise use parent implementation
    return super.buildSystemMessage(context);
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
      messageHistoryLength: context.messageHistory?.length || 0,
      managerId: context.managerId,
      organizationId: context.organizationId,
      userRole: context.userRole
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
    
    // Remove the old debrief flow logic completely
    // The agent should use its configured system prompt for behavior
    
    // For the first message, let the agent handle it based on its configured prompt
    // No need to inject custom instructions
    
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