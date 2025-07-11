import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';
import { AgentConfiguration } from '@/lib/generated/prisma';
import { DEFAULT_AGENT_CONFIGS, AgentDefaultConfig } from './default-agent-configs';

export interface LoadedAgentConfig {
  systemPrompt: string;
  prompts?: Record<string, string>; // Keep for backward compatibility
  flowConfig: Record<string, any>;
  extractionRules: Record<string, any>;
  guardrailConfig?: Record<string, any>;
  version: number;
}

export class AgentConfigLoader {
  private static configCache = new Map<string, LoadedAgentConfig>();
  private static lastFetchTime = new Map<string, number>();
  private static readonly CACHE_DURATION = 60000; // 1 minute cache

  /**
   * Load configuration for an agent, with caching
   */
  static async loadConfiguration(agentName: string): Promise<LoadedAgentConfig | null> {
    // Check cache first
    const cached = this.configCache.get(agentName);
    const lastFetch = this.lastFetchTime.get(agentName) || 0;
    const now = Date.now();

    if (cached && (now - lastFetch) < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Fetch from database
      const config = await AgentConfigurationService.getActiveConfiguration(agentName);
      
      if (config) {
        // Handle both new format (systemPrompt) and old format (prompts)
        let systemPrompt = '';
        
        // Check if config has systemPrompt directly
        if ('systemPrompt' in config && config.systemPrompt) {
          systemPrompt = config.systemPrompt as string;
        } 
        // Fall back to prompts.system if available
        else if (config.prompts && typeof config.prompts === 'object') {
          const prompts = config.prompts as Record<string, string>;
          systemPrompt = prompts.system || '';
        }
        
        const loadedConfig: LoadedAgentConfig = {
          systemPrompt,
          prompts: config.prompts as Record<string, string> | undefined,
          flowConfig: config.flowConfig as Record<string, any>,
          extractionRules: config.extractionRules as Record<string, any>,
          guardrailConfig: config.guardrailConfig as Record<string, any> | undefined,
          version: config.version
        };

        // Update cache
        this.configCache.set(agentName, loadedConfig);
        this.lastFetchTime.set(agentName, now);

        return loadedConfig;
      }

      return null;
    } catch (error: any) {
      // Only log actual errors, not "no config found" cases
      if (error?.code === 'P1001' || error?.code === 'P1002') {
        console.warn(`Database connection issue loading config for ${agentName}:`, {
          code: error.code,
          message: error.message?.split('\n')[0], // Just the first line
        });
      } else if (error?.message && !error.message.includes('No active configuration found')) {
        console.warn(`Failed to load configuration for ${agentName}:`, {
          message: error?.message,
          code: error?.code
        });
      }
      
      // Return null instead of throwing to allow fallback to defaults
      return null;
    }
  }

  /**
   * Clear cache for a specific agent or all agents
   */
  static clearCache(agentName?: string) {
    if (agentName) {
      this.configCache.delete(agentName);
      this.lastFetchTime.delete(agentName);
    } else {
      this.configCache.clear();
      this.lastFetchTime.clear();
    }
  }

  /**
   * Get default system prompt for an agent (fallback when no config exists)
   */
  static getDefaultSystemPrompt(agentName: string): string {
    const config = DEFAULT_AGENT_CONFIGS[agentName];
    if (config && config.prompts?.system) {
      return config.prompts.system;
    }

    // Fallback for unknown agents
    return `You are the ${agentName} for the TMS transformation platform.`;
  }
  
  /**
   * Get default prompts for an agent (legacy support)
   */
  static getDefaultPrompts(agentName: string): Record<string, string> {
    const config = DEFAULT_AGENT_CONFIGS[agentName];
    if (config) {
      return config.prompts;
    }

    // Fallback for unknown agents
    return {
      system: `You are the ${agentName} for the TMS transformation platform.`,
      default: `I'm the ${agentName}, here to assist with your team transformation.`
    };
  }

  /**
   * Get default flow configuration for an agent
   */
  static getDefaultFlowConfig(agentName: string): Record<string, any> {
    const config = DEFAULT_AGENT_CONFIGS[agentName];
    return config?.flowConfig || {
      states: ['default'],
      transitions: { default: [] }
    };
  }

  /**
   * Get default extraction rules for an agent
   */
  static getDefaultExtractionRules(agentName: string): Record<string, any> {
    const config = DEFAULT_AGENT_CONFIGS[agentName];
    return config?.extractionRules || {};
  }

  /**
   * Get complete default configuration for an agent
   */
  static getDefaultConfig(agentName: string): AgentDefaultConfig {
    return DEFAULT_AGENT_CONFIGS[agentName] || {
      prompts: this.getDefaultPrompts(agentName),
      flowConfig: this.getDefaultFlowConfig(agentName),
      extractionRules: this.getDefaultExtractionRules(agentName),
      guardrailConfig: {}
    };
  }
}