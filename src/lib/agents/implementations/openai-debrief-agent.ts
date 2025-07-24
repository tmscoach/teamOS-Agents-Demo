import { OpenAIAgent } from './base-openai-agent';
import { AgentContext, AgentResponse, AgentTool } from '../types';
import { createTMSTools } from '../tools/tms-tool-factory';
import { getToolsForAgent } from '../tools/tms-tool-registry';
import { knowledgeBaseTools } from '../../knowledge-base';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { DebriefGuardrails, DebriefGuardrailConfig } from '../guardrails/debrief-guardrails';

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
      instructions: () => `You are the TMS Debrief Agent. Your role is to provide comprehensive debriefs for completed assessments and generate reports.

Your responsibilities include:
- Retrieving and presenting assessment results
- Generating insights from assessment data
- Creating customized reports based on templates
- Explaining scores and recommendations
- Guiding next steps based on results

When a user asks about their report:
1. First check if they have provided a subscription ID
2. If not, ask them for their subscription ID or team details
3. Use the tms_debrief_report tool to retrieve and analyze their report
4. If the subscription is not found, guide them to generate a report first

For testing purposes, you can suggest using subscription ID "21988" which has sample Team Signals report data.

When generating reports with tms_generate_html_report:
- Use templateId "1" for default template
- The tool expects numeric template IDs (1, 2, 3, etc.), not assessment type names

Remember to:
- Present results in an understandable way
- Focus on actionable insights
- Maintain confidentiality of assessment data
- Offer constructive feedback
- Suggest appropriate next steps`,
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
}

export async function createOpenAIDebriefAgent(): Promise<OpenAIDebriefAgent> {
  const agent = new OpenAIDebriefAgent();
  await agent.initialize();
  return agent;
}