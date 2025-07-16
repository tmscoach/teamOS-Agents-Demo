import { AgentConfigLoader } from '../agent-config-loader';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';

// Mock the configuration service
jest.mock('@/src/lib/services/agent-configuration');

describe('AgentConfigLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    AgentConfigLoader.clearCache();
    jest.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load configuration from database when available', async () => {
      const mockDbConfig = {
        prompts: { system: 'DB system prompt' },
        flowConfig: { states: ['greeting'] },
        extractionRules: {
          user_name: { type: 'string', required: true },
          team_size: { type: 'number', required: true }
        },
        version: 1
      };

      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(mockDbConfig);

      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      expect(config).toEqual(mockDbConfig);
      expect(AgentConfigurationService.getActiveConfiguration).toHaveBeenCalledWith('OnboardingAgent');
    });

    it('should fall back to default config when database returns null', async () => {
      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(null);

      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      expect(config).toBeNull();
    });

    it('should cache configurations', async () => {
      const mockConfig = {
        prompts: { system: 'Cached prompt' },
        extractionRules: {}
      };

      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(mockConfig);

      // First call - should hit database
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      expect(AgentConfigurationService.getActiveConfiguration).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      expect(AgentConfigurationService.getActiveConfiguration).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache after TTL expires', async () => {
      const mockConfig = { prompts: {}, extractionRules: {} };
      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(mockConfig);

      // First call
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      // Mock time passing (> 5 minutes)
      const originalTime = Date.now;
      Date.now = jest.fn(() => originalTime() + 6 * 60 * 1000);

      // Second call after TTL
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      expect(AgentConfigurationService.getActiveConfiguration).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalTime;
    });
  });

  describe('Default Configuration Fallback', () => {
    it('should provide default extraction rules for OnboardingAgent', () => {
      const rules = AgentConfigLoader.getDefaultExtractionRules('OnboardingAgent');
      
      expect(rules).toBeDefined();
      expect(rules.user_name).toBeDefined();
      expect(rules.user_role).toBeDefined();
      expect(rules.team_size).toBeDefined();
      expect(rules.organization).toBeDefined();
      expect(rules.primary_challenge).toBeDefined();
    });

    it('should provide default prompts for OnboardingAgent', () => {
      const prompts = AgentConfigLoader.getDefaultPrompts('OnboardingAgent');
      
      expect(prompts).toBeDefined();
      expect(prompts.system).toBeDefined();
      expect(prompts.greeting).toBeDefined();
      expect(prompts.context_discovery).toBeDefined();
    });

    it('should provide default flow config for OnboardingAgent', () => {
      const flowConfig = AgentConfigLoader.getDefaultFlowConfig('OnboardingAgent');
      
      expect(flowConfig).toBeDefined();
      expect(flowConfig.states).toBeDefined();
      expect(flowConfig.transitions).toBeDefined();
      expect(flowConfig.requiredFields).toBeDefined();
      expect(flowConfig.requiredFields).toContain('user_name');
      expect(flowConfig.requiredFields).toContain('team_size');
    });

    it('should return empty objects for unknown agents', () => {
      const rules = AgentConfigLoader.getDefaultExtractionRules('UnknownAgent');
      const prompts = AgentConfigLoader.getDefaultPrompts('UnknownAgent');
      const flowConfig = AgentConfigLoader.getDefaultFlowConfig('UnknownAgent');
      
      expect(rules).toEqual({});
      expect(prompts).toEqual({});
      expect(flowConfig).toEqual({});
    });
  });

  describe('Cache Management', () => {
    it('should clear cache for specific agent', async () => {
      const mockConfig = { prompts: {}, extractionRules: {} };
      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(mockConfig);

      // Load and cache
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      // Clear specific agent cache
      AgentConfigLoader.clearCache('OnboardingAgent');
      
      // Should hit database again
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      expect(AgentConfigurationService.getActiveConfiguration).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache when no agent specified', async () => {
      const mockConfig = { prompts: {}, extractionRules: {} };
      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(mockConfig);

      // Load multiple agents
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      await AgentConfigLoader.loadConfiguration('AssessmentAgent');
      
      // Clear all cache
      AgentConfigLoader.clearCache();
      
      // Both should hit database again
      await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      await AgentConfigLoader.loadConfiguration('AssessmentAgent');
      
      expect(AgentConfigurationService.getActiveConfiguration).toHaveBeenCalledTimes(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      (dbError as any).code = 'P1001';
      
      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockRejectedValue(dbError);

      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      expect(config).toBeNull();
    });

    it('should handle missing configuration gracefully', async () => {
      const error = new Error('No active configuration found');
      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockRejectedValue(error);

      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      expect(config).toBeNull();
    });
  });

  describe('Complete Configuration', () => {
    it('should load complete configuration with all sections', async () => {
      const mockCompleteConfig = {
        prompts: {
          system: 'System prompt',
          greeting: 'Greeting prompt'
        },
        flowConfig: {
          states: ['greeting', 'context_discovery'],
          transitions: { greeting: ['context_discovery'] },
          requiredFields: ['user_name', 'team_size']
        },
        extractionRules: {
          user_name: { type: 'string', required: true },
          team_size: { type: 'number', required: true }
        },
        guardrailConfig: {
          maxMessageLength: 1000
        },
        knowledgeConfig: {
          enabled: true
        },
        version: 1
      };

      (AgentConfigurationService.getActiveConfiguration as jest.Mock).mockResolvedValue(mockCompleteConfig);

      const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
      
      expect(config).toEqual(mockCompleteConfig);
      expect(config?.prompts).toBeDefined();
      expect(config?.flowConfig).toBeDefined();
      expect(config?.extractionRules).toBeDefined();
      expect(config?.guardrailConfig).toBeDefined();
      expect(config?.knowledgeConfig).toBeDefined();
    });
  });
});