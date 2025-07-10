import { AgentConfiguration } from '@/lib/generated/prisma';
import prisma from '@/lib/db';

export interface AgentConfigInput {
  agentName: string;
  systemPrompt?: string;
  prompts?: Record<string, string>; // Keep for backward compatibility
  flowConfig: Record<string, any>;
  extractionRules: Record<string, any>;
  guardrailConfig?: Record<string, any>;
  createdBy: string;
}

export class AgentConfigurationService {
  /**
   * Create a new agent configuration version
   */
  static async createConfiguration(data: AgentConfigInput): Promise<AgentConfiguration> {
    try {
      // Get the latest version for this agent
      const latestConfig = await prisma.agentConfiguration.findFirst({
        where: { agentName: data.agentName },
        orderBy: { version: 'desc' },
      });

      const newVersion = (latestConfig?.version || 0) + 1;

      // Deactivate all previous versions
      await prisma.agentConfiguration.updateMany({
        where: { agentName: data.agentName },
        data: { active: false },
      });

      // Create new configuration
      // Handle both new systemPrompt and legacy prompts format
      const promptData = data.systemPrompt 
        ? { system: data.systemPrompt } 
        : (data.prompts || {});
      
      try {
        return await prisma.agentConfiguration.create({
          data: {
            agentName: data.agentName,
            version: newVersion,
            prompts: promptData,
            flowConfig: data.flowConfig,
            extractionRules: data.extractionRules,
            guardrailConfig: data.guardrailConfig || {},
            active: true,
            createdBy: data.createdBy,
          },
        });
      } catch (error: any) {
        // If guardrailConfig column doesn't exist, try without it
        if (error.code === 'P2022' && error.message?.includes('guardrailConfig')) {
          console.warn('guardrailConfig column missing, creating without it');
          return await prisma.agentConfiguration.create({
            data: {
              agentName: data.agentName,
              version: newVersion,
              prompts: promptData,
              flowConfig: data.flowConfig,
              extractionRules: data.extractionRules,
              active: true,
              createdBy: data.createdBy,
            },
          });
        }
        throw error;
      }
    } catch (error: any) {
      // Re-throw the error with the original code for proper handling upstream
      throw error;
    }
  }

  /**
   * Get active configuration for an agent
   */
  static async getActiveConfiguration(agentName: string): Promise<AgentConfiguration | null> {
    try {
      const config = await prisma.agentConfiguration.findFirst({
        where: {
          agentName,
          active: true,
        },
      });
      
      // Add guardrailConfig if it doesn't exist
      if (config && !('guardrailConfig' in config)) {
        (config as any).guardrailConfig = {};
      }
      
      return config;
    } catch (error: any) {
      // Handle missing column error
      if (error.code === 'P2022' && error.message?.includes('guardrailConfig')) {
        console.warn('guardrailConfig column missing, using fallback query');
        
        // Query without guardrailConfig
        const result = await prisma.$queryRaw<AgentConfiguration[]>`
          SELECT id, "agentName", version, prompts, "flowConfig", "extractionRules", active, "createdBy", "createdAt", "updatedAt"
          FROM "AgentConfiguration"
          WHERE "agentName" = ${agentName} AND active = true
          LIMIT 1
        `;
        
        if (result.length > 0) {
          const config = result[0];
          (config as any).guardrailConfig = {};
          return config;
        }
      }
      
      throw error;
    }
  }

  /**
   * Get configuration history for an agent
   */
  static async getConfigurationHistory(agentName: string): Promise<AgentConfiguration[]> {
    try {
      return await prisma.agentConfiguration.findMany({
        where: { agentName },
        orderBy: { version: 'desc' },
      });
    } catch (error: any) {
      // Handle missing guardrailConfig column
      if (error?.code === 'P2022' && error.message?.includes('guardrailConfig')) {
        console.warn('guardrailConfig column not found, using fallback query for history');
        
        const result = await prisma.$queryRaw<AgentConfiguration[]>`
          SELECT id, "agentName", version, prompts, "flowConfig", "extractionRules", 
                 active, "createdBy", "createdAt", "updatedAt"
          FROM "AgentConfiguration"
          WHERE "agentName" = ${agentName}
          ORDER BY version DESC
        `;
        
        // Add empty guardrailConfig to each result
        return result.map(config => ({
          ...config,
          guardrailConfig: {}
        }));
      }
      
      throw error;
    }
  }

  /**
   * Get a specific version of configuration
   */
  static async getConfigurationVersion(agentName: string, version: number): Promise<AgentConfiguration | null> {
    return await prisma.agentConfiguration.findUnique({
      where: {
        agentName_version: {
          agentName,
          version,
        },
      },
    });
  }

  /**
   * Update configuration (creates new version)
   */
  static async updateConfiguration(
    agentName: string,
    updates: Partial<AgentConfigInput>,
    updatedBy: string
  ): Promise<AgentConfiguration> {
    const currentConfig = await this.getActiveConfiguration(agentName);
    
    if (!currentConfig) {
      // If no configuration exists, create the first version
      return await this.createConfiguration({
        agentName,
        systemPrompt: updates.systemPrompt,
        prompts: updates.prompts,
        flowConfig: updates.flowConfig || {},
        extractionRules: updates.extractionRules || {},
        guardrailConfig: updates.guardrailConfig || {},
        createdBy: updatedBy,
      });
    }

    return await this.createConfiguration({
      agentName,
      systemPrompt: updates.systemPrompt,
      prompts: updates.prompts || (currentConfig.prompts as Record<string, string>),
      flowConfig: updates.flowConfig || (currentConfig.flowConfig as Record<string, any>),
      extractionRules: updates.extractionRules || (currentConfig.extractionRules as Record<string, any>),
      guardrailConfig: updates.guardrailConfig || (currentConfig.guardrailConfig as Record<string, any>) || {},
      createdBy: updatedBy,
    });
  }

  /**
   * Rollback to a previous version
   */
  static async rollbackConfiguration(agentName: string, targetVersion: number): Promise<AgentConfiguration> {
    const targetConfig = await this.getConfigurationVersion(agentName, targetVersion);
    
    if (!targetConfig) {
      throw new Error(`Configuration version ${targetVersion} not found for agent: ${agentName}`);
    }

    // Deactivate all versions
    await prisma.agentConfiguration.updateMany({
      where: { agentName },
      data: { active: false },
    });

    // Activate target version
    return await prisma.agentConfiguration.update({
      where: {
        id: targetConfig.id,
      },
      data: { active: true },
    });
  }

  /**
   * Compare two configuration versions
   */
  static async compareVersions(agentName: string, version1: number, version2: number) {
    const [config1, config2] = await Promise.all([
      this.getConfigurationVersion(agentName, version1),
      this.getConfigurationVersion(agentName, version2),
    ]);

    if (!config1 || !config2) {
      throw new Error('One or both configuration versions not found');
    }

    return {
      version1: {
        version: config1.version,
        createdAt: config1.createdAt,
        createdBy: config1.createdBy,
      },
      version2: {
        version: config2.version,
        createdAt: config2.createdAt,
        createdBy: config2.createdBy,
      },
      differences: {
        prompts: this.diffObjects(
          config1.prompts as Record<string, string>,
          config2.prompts as Record<string, string>
        ),
        flowConfig: this.diffObjects(
          config1.flowConfig as Record<string, any>,
          config2.flowConfig as Record<string, any>
        ),
        extractionRules: this.diffObjects(
          config1.extractionRules as Record<string, any>,
          config2.extractionRules as Record<string, any>
        ),
        guardrailConfig: this.diffObjects(
          (config1.guardrailConfig || {}) as Record<string, any>,
          (config2.guardrailConfig || {}) as Record<string, any>
        ),
      },
    };
  }

  /**
   * Get all agent configurations
   */
  static async getAllAgentConfigurations() {
    try {
      // Ensure database connection
      await prisma.$connect();
      
      const configs = await prisma.agentConfiguration.findMany({
        where: { active: true },
        orderBy: { agentName: 'asc' },
      });

      const configsByAgent = await prisma.agentConfiguration.groupBy({
        by: ['agentName'],
        _max: {
          version: true,
        },
        _count: {
          _all: true,
        },
      });

      return configsByAgent.map(group => {
        const activeConfig = configs.find(c => c.agentName === group.agentName);
        return {
          agentName: group.agentName,
          activeVersion: activeConfig?.version || 0,
          totalVersions: group._count._all,
          lastUpdated: activeConfig?.updatedAt,
          updatedBy: activeConfig?.createdBy,
        };
      });
    } catch (error: any) {
      console.error('Error in getAllAgentConfigurations:', error);
      
      // Handle missing table
      if (error?.code === 'P2021' || (error?.message && error.message.includes('relation') && error.message.includes('does not exist'))) {
        console.warn('AgentConfiguration table does not exist, returning empty array');
        return [];
      }
      
      // Handle missing guardrailConfig column
      if (error?.code === 'P2022' && error.message?.includes('guardrailConfig')) {
        console.warn('guardrailConfig column not found, using fallback query');
        
        try {
          // Ensure connection before raw query
          await prisma.$connect();
          
          // Query without guardrailConfig
          const configs = await prisma.$queryRaw<any[]>`
            SELECT "agentName", MAX(version) as "activeVersion", COUNT(*) as "totalVersions", 
                   MAX("updatedAt") as "lastUpdated", MAX("createdBy") as "updatedBy"
            FROM "AgentConfiguration"
            WHERE active = true
            GROUP BY "agentName"
            ORDER BY "agentName" ASC
          `;
          
          return configs.map(config => ({
            agentName: config.agentName,
            activeVersion: config.activeVersion || 0,
            totalVersions: parseInt(config.totalVersions) || 0,
            lastUpdated: config.lastUpdated,
            updatedBy: config.updatedBy,
          }));
        } catch (rawError: any) {
          console.error('Raw query also failed:', rawError);
          // If even the raw query fails, return empty array
          return [];
        }
      }
      
      // Handle connection errors
      // P1001: Can't reach database server (common with Supabase pooler connections)
      // P1002: Database server was reached but timed out
      if (error?.code === 'P1001' || error?.code === 'P1002') {
        console.error('Database connection error in getAllAgentConfigurations:', {
          code: error.code,
          message: error.message,
          hint: 'This often occurs with Supabase pooler connections. Consider using direct connection for production.'
        });
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Test configuration changes
   */
  static async testConfiguration(agentName: string, testConfig: Partial<AgentConfigInput>) {
    // This would integrate with the actual agent to test the configuration
    // For now, we'll return a mock result
    return {
      valid: true,
      errors: [],
      warnings: [],
      testResults: {
        promptValidation: { passed: true, details: 'All prompts valid' },
        flowValidation: { passed: true, details: 'Flow configuration valid' },
        extractionValidation: { passed: true, details: 'Extraction rules valid' },
      },
    };
  }

  /**
   * Clone configuration from one agent to another
   */
  static async cloneConfiguration(
    sourceAgent: string,
    targetAgent: string,
    createdBy: string
  ): Promise<AgentConfiguration> {
    const sourceConfig = await this.getActiveConfiguration(sourceAgent);
    
    if (!sourceConfig) {
      throw new Error(`No active configuration found for source agent: ${sourceAgent}`);
    }

    return await this.createConfiguration({
      agentName: targetAgent,
      prompts: sourceConfig.prompts as Record<string, string>,
      flowConfig: sourceConfig.flowConfig as Record<string, any>,
      extractionRules: sourceConfig.extractionRules as Record<string, any>,
      guardrailConfig: (sourceConfig.guardrailConfig || {}) as Record<string, any>,
      createdBy,
    });
  }

  /**
   * Helper to diff two objects
   */
  private static diffObjects(obj1: Record<string, any>, obj2: Record<string, any>) {
    const diff: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    allKeys.forEach(key => {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diff[key] = {
          old: obj1[key],
          new: obj2[key],
        };
      }
    });

    return diff;
  }
}