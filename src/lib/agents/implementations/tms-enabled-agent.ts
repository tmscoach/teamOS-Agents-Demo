/**
 * TMS-Enabled Agent
 * Base class that supports dynamic TMS tool loading from configuration
 */

import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentConfig, AgentContext, AgentTool } from '../types';
import { createTMSTools } from '../tools/tms-tool-factory';
import { getToolsForAgent } from '../tools/tms-tool-registry';
import { AgentConfigLoader } from '../config/agent-config-loader';

export interface TMSEnabledAgentConfig extends Omit<AgentConfig, 'tools'> {
  tools?: AgentTool[];
  knowledgeEnabled?: boolean;
  tmsToolsEnabled?: boolean;
  loadFromConfig?: boolean;
}

/**
 * Agent that can dynamically load TMS tools based on configuration
 */
export class TMSEnabledAgent extends KnowledgeEnabledAgent {
  private tmsToolsEnabled: boolean;
  private loadFromConfig: boolean;
  private configuredTools: AgentTool[] = [];

  constructor(config: TMSEnabledAgentConfig) {
    // Store TMS settings before calling super
    const tmsToolsEnabled = config.tmsToolsEnabled !== false;
    const loadFromConfig = config.loadFromConfig !== false;
    
    // Call super without TMS tools initially
    super({
      ...config,
      tools: config.tools || []
    });

    this.tmsToolsEnabled = tmsToolsEnabled;
    this.loadFromConfig = loadFromConfig;

    // Load TMS tools if enabled and not loading from config
    if (tmsToolsEnabled && !loadFromConfig) {
      this.loadDefaultTMSTools();
    }
  }

  /**
   * Initialize agent with configuration from database
   */
  async initialize(): Promise<void> {
    if (!this.loadFromConfig) {
      return;
    }

    try {
      // Load configuration from database
      const config = await AgentConfigLoader.loadConfiguration(this.name);
      
      if (config?.toolsConfig && this.tmsToolsEnabled) {
        // Get enabled tools from configuration
        const enabledToolNames = Object.entries(config.toolsConfig)
          .filter(([_, enabled]) => enabled)
          .map(([toolName, _]) => toolName);

        // Create TMS tools
        if (enabledToolNames.length > 0) {
          const tmsTools = createTMSTools(enabledToolNames);
          this.configuredTools = tmsTools;
          
          // Merge with existing tools
          this.tools = [...this.tools, ...tmsTools];
          
          console.log(`[${this.name}] Loaded ${tmsTools.length} TMS tools from configuration`);
        }
      } else if (this.tmsToolsEnabled) {
        // Load default tools if no configuration exists
        this.loadDefaultTMSTools();
      }
    } catch (error) {
      console.error(`[${this.name}] Error loading tool configuration:`, error);
      // Fall back to default tools
      if (this.tmsToolsEnabled) {
        this.loadDefaultTMSTools();
      }
    }
  }

  /**
   * Load default TMS tools for this agent type
   */
  private loadDefaultTMSTools(): void {
    const defaultToolNames = getToolsForAgent(this.name);
    
    if (defaultToolNames.length > 0) {
      const tmsTools = createTMSTools(defaultToolNames);
      this.configuredTools = tmsTools;
      
      // Merge with existing tools
      this.tools = [...this.tools, ...tmsTools];
      
      console.log(`[${this.name}] Loaded ${tmsTools.length} default TMS tools`);
    }
  }

  /**
   * Get the list of configured TMS tools
   */
  getConfiguredTMSTools(): AgentTool[] {
    return this.configuredTools;
  }

  /**
   * Override to add TMS-specific context to instructions
   */
  protected getInstructions(context: AgentContext): string {
    const baseInstructions = super.getInstructions(context);
    
    if (!this.tmsToolsEnabled || this.configuredTools.length === 0) {
      return baseInstructions;
    }
    
    // Add TMS tool context
    const tmsContext = `

You have access to TMS Global integration tools. These tools allow you to:
${this.configuredTools.map(tool => `- ${tool.description}`).join('\n')}

When using TMS tools:
1. Ensure user authentication before accessing protected endpoints
2. Handle errors gracefully and provide helpful feedback
3. Format responses in a user-friendly manner
4. Maintain data security and privacy`;

    return baseInstructions + tmsContext;
  }
}