import { AgentConfigurationService } from '../agent-configuration';
import prisma from '@/lib/db';

// Type assertion for the mocked prisma
const prismaMock = prisma as any;

describe('AgentConfigurationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConfiguration', () => {
    it('should create a new configuration with incremented version', async () => {
      const existingConfig = {
        id: 'existing-id',
        agentName: 'OnboardingAgent',
        version: 3,
        active: true,
      };

      prismaMock.agentConfiguration.findFirst.mockResolvedValue(existingConfig);
      prismaMock.agentConfiguration.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.agentConfiguration.create.mockResolvedValue({
        id: 'new-id',
        agentName: 'OnboardingAgent',
        version: 4,
        prompts: { greeting: 'Hello!' },
        flowConfig: { states: ['start', 'end'] },
        extractionRules: { fields: ['name'] },
        active: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await AgentConfigurationService.createConfiguration({
        agentName: 'OnboardingAgent',
        prompts: { greeting: 'Hello!' },
        flowConfig: { states: ['start', 'end'] },
        extractionRules: { fields: ['name'] },
        createdBy: 'user-123',
      });

      expect(prismaMock.agentConfiguration.findFirst).toHaveBeenCalledWith({
        where: { agentName: 'OnboardingAgent' },
        orderBy: { version: 'desc' },
      });

      expect(prismaMock.agentConfiguration.updateMany).toHaveBeenCalledWith({
        where: { agentName: 'OnboardingAgent' },
        data: { active: false },
      });

      expect(prismaMock.agentConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 4,
          active: true,
        }),
      });

      expect(result.version).toBe(4);
      expect(result.active).toBe(true);
    });

    it('should create version 1 for new agent', async () => {
      prismaMock.agentConfiguration.findFirst.mockResolvedValue(null);
      prismaMock.agentConfiguration.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.agentConfiguration.create.mockResolvedValue({
        id: 'new-id',
        agentName: 'NewAgent',
        version: 1,
        active: true,
      });

      const result = await AgentConfigurationService.createConfiguration({
        agentName: 'NewAgent',
        prompts: {},
        flowConfig: {},
        extractionRules: {},
        createdBy: 'user-123',
      });

      expect(prismaMock.agentConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 1,
        }),
      });
    });
  });

  describe('getActiveConfiguration', () => {
    it('should return the active configuration', async () => {
      const activeConfig = {
        id: 'active-id',
        agentName: 'OnboardingAgent',
        version: 5,
        active: true,
      };

      prismaMock.agentConfiguration.findFirst.mockResolvedValue(activeConfig);

      const result = await AgentConfigurationService.getActiveConfiguration('OnboardingAgent');

      expect(prismaMock.agentConfiguration.findFirst).toHaveBeenCalledWith({
        where: {
          agentName: 'OnboardingAgent',
          active: true,
        },
      });
      expect(result).toEqual(activeConfig);
    });

    it('should return null if no active configuration', async () => {
      prismaMock.agentConfiguration.findFirst.mockResolvedValue(null);

      const result = await AgentConfigurationService.getActiveConfiguration('NonExistentAgent');

      expect(result).toBeNull();
    });
  });

  describe('updateConfiguration', () => {
    it('should create a new version with updated fields', async () => {
      const currentConfig = {
        id: 'current-id',
        agentName: 'OnboardingAgent',
        version: 2,
        prompts: { greeting: 'Hi!' },
        flowConfig: { states: ['start'] },
        extractionRules: { fields: ['name'] },
        active: true,
      };

      prismaMock.agentConfiguration.findFirst.mockResolvedValue(currentConfig);
      prismaMock.agentConfiguration.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.agentConfiguration.create.mockResolvedValue({
        ...currentConfig,
        id: 'new-id',
        version: 3,
        prompts: { greeting: 'Hello there!' },
      });

      const result = await AgentConfigurationService.updateConfiguration(
        'OnboardingAgent',
        { prompts: { greeting: 'Hello there!' } },
        'user-456'
      );

      expect(prismaMock.agentConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          prompts: { greeting: 'Hello there!' },
          flowConfig: { states: ['start'] }, // Preserved from current
          extractionRules: { fields: ['name'] }, // Preserved from current
          createdBy: 'user-456',
        }),
      });
    });

    it('should create new configuration if no active configuration exists', async () => {
      prismaMock.agentConfiguration.findFirst.mockResolvedValue(null);
      prismaMock.agentConfiguration.create.mockResolvedValue({
        id: 'new-id',
        agentName: 'NonExistentAgent',
        version: 1,
        flowConfig: {},
        extractionRules: {},
        active: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await AgentConfigurationService.updateConfiguration(
        'NonExistentAgent', 
        { flowConfig: { states: ['start'] } }, 
        'user-123'
      );

      expect(result.version).toBe(1);
      expect(result.agentName).toBe('NonExistentAgent');
    });
  });

  describe('rollbackConfiguration', () => {
    it('should activate a previous version', async () => {
      const targetConfig = {
        id: 'target-id',
        agentName: 'OnboardingAgent',
        version: 2,
        active: false,
      };

      prismaMock.agentConfiguration.findUnique.mockResolvedValue(targetConfig);
      prismaMock.agentConfiguration.updateMany.mockResolvedValue({ count: 3 });
      prismaMock.agentConfiguration.update.mockResolvedValue({
        ...targetConfig,
        active: true,
      });

      const result = await AgentConfigurationService.rollbackConfiguration('OnboardingAgent', 2);

      expect(prismaMock.agentConfiguration.updateMany).toHaveBeenCalledWith({
        where: { agentName: 'OnboardingAgent' },
        data: { active: false },
      });

      expect(prismaMock.agentConfiguration.update).toHaveBeenCalledWith({
        where: { id: 'target-id' },
        data: { active: true },
      });

      expect(result.active).toBe(true);
    });

    it('should throw error if target version not found', async () => {
      prismaMock.agentConfiguration.findUnique.mockResolvedValue(null);

      await expect(
        AgentConfigurationService.rollbackConfiguration('OnboardingAgent', 99)
      ).rejects.toThrow('Configuration version 99 not found for agent: OnboardingAgent');
    });
  });

  describe('compareVersions', () => {
    it('should return differences between two versions', async () => {
      const config1 = {
        id: '1',
        version: 1,
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-1',
        prompts: { greeting: 'Hi!' },
        flowConfig: { states: ['start', 'end'] },
        extractionRules: { fields: ['name'] },
      };

      const config2 = {
        id: '2',
        version: 2,
        createdAt: new Date('2024-01-02'),
        createdBy: 'user-2',
        prompts: { greeting: 'Hello!', farewell: 'Goodbye!' },
        flowConfig: { states: ['start', 'middle', 'end'] },
        extractionRules: { fields: ['name'] },
      };

      prismaMock.agentConfiguration.findUnique
        .mockResolvedValueOnce(config1)
        .mockResolvedValueOnce(config2);

      const result = await AgentConfigurationService.compareVersions('OnboardingAgent', 1, 2);

      expect(result.differences.prompts).toHaveProperty('greeting');
      expect(result.differences.prompts.greeting).toEqual({
        old: 'Hi!',
        new: 'Hello!',
      });
      expect(result.differences.prompts).toHaveProperty('farewell');
      expect(result.differences.flowConfig).toHaveProperty('states');
      expect(Object.keys(result.differences.extractionRules)).toHaveLength(0); // No changes
    });
  });

  describe('getAllAgentConfigurations', () => {
    it('should return summary of all agent configurations', async () => {
      const activeConfigs = [
        {
          id: '1',
          agentName: 'OnboardingAgent',
          version: 5,
          updatedAt: new Date('2024-01-05'),
          createdBy: 'user-1',
          active: true,
        },
        {
          id: '2',
          agentName: 'AssessmentAgent',
          version: 3,
          updatedAt: new Date('2024-01-03'),
          createdBy: 'user-2',
          active: true,
        },
      ];

      const groupByResult = [
        { agentName: 'OnboardingAgent', _max: { version: 5 }, _count: { _all: 5 } },
        { agentName: 'AssessmentAgent', _max: { version: 3 }, _count: { _all: 3 } },
      ];

      prismaMock.agentConfiguration.findMany.mockResolvedValue(activeConfigs);
      prismaMock.agentConfiguration.groupBy.mockResolvedValue(groupByResult);

      const result = await AgentConfigurationService.getAllAgentConfigurations();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        agentName: 'OnboardingAgent',
        activeVersion: 5,
        totalVersions: 5,
        lastUpdated: new Date('2024-01-05'),
        updatedBy: 'user-1',
      });
    });
  });

  describe('testConfiguration', () => {
    it('should return valid test result', async () => {
      const testConfig = {
        prompts: { greeting: 'Hello!' },
        flowConfig: { states: ['start'] },
        extractionRules: { fields: ['name'] },
      };

      const result = await AgentConfigurationService.testConfiguration('OnboardingAgent', testConfig);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.testResults.promptValidation.passed).toBe(true);
    });
  });

  describe('cloneConfiguration', () => {
    it('should clone configuration from one agent to another', async () => {
      const sourceConfig = {
        id: 'source-id',
        agentName: 'OnboardingAgent',
        version: 5,
        prompts: { greeting: 'Hello!' },
        flowConfig: { states: ['start'] },
        extractionRules: { fields: ['name'] },
        active: true,
      };

      prismaMock.agentConfiguration.findFirst.mockResolvedValueOnce(sourceConfig);
      prismaMock.agentConfiguration.findFirst.mockResolvedValueOnce(null); // No existing config for target
      prismaMock.agentConfiguration.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.agentConfiguration.create.mockResolvedValue({
        ...sourceConfig,
        id: 'new-id',
        agentName: 'NewAgent',
        version: 1,
        createdBy: 'user-123',
      });

      const result = await AgentConfigurationService.cloneConfiguration(
        'OnboardingAgent',
        'NewAgent',
        'user-123'
      );

      expect(prismaMock.agentConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agentName: 'NewAgent',
          version: 1,
          prompts: { greeting: 'Hello!' },
          flowConfig: { states: ['start'] },
          extractionRules: { fields: ['name'] },
          createdBy: 'user-123',
        }),
      });
    });

    it('should throw error if source agent has no active configuration', async () => {
      prismaMock.agentConfiguration.findFirst.mockResolvedValue(null);

      await expect(
        AgentConfigurationService.cloneConfiguration('NonExistentAgent', 'NewAgent', 'user-123')
      ).rejects.toThrow('No active configuration found for source agent: NonExistentAgent');
    });
  });
});