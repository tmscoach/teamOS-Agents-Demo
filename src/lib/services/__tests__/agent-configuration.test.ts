import { AgentConfigurationService } from '../agent-configuration';
import { PrismaClient } from '@/lib/generated/prisma';

// Mock Prisma Client
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    agentConfiguration: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
  })),
}));

describe('AgentConfigurationService', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('createConfiguration', () => {
    it('should create a new configuration with incremented version', async () => {
      const existingConfig = {
        id: 'existing-id',
        agentName: 'OnboardingAgent',
        version: 3,
        active: true,
      };

      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(existingConfig);
      mockPrisma.agentConfiguration.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.agentConfiguration.create.mockResolvedValue({
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

      expect(mockPrisma.agentConfiguration.findFirst).toHaveBeenCalledWith({
        where: { agentName: 'OnboardingAgent' },
        orderBy: { version: 'desc' },
      });

      expect(mockPrisma.agentConfiguration.updateMany).toHaveBeenCalledWith({
        where: { agentName: 'OnboardingAgent' },
        data: { active: false },
      });

      expect(mockPrisma.agentConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 4,
          active: true,
        }),
      });

      expect(result.version).toBe(4);
      expect(result.active).toBe(true);
    });

    it('should create version 1 for new agent', async () => {
      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(null);
      mockPrisma.agentConfiguration.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.agentConfiguration.create.mockResolvedValue({
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

      expect(mockPrisma.agentConfiguration.create).toHaveBeenCalledWith({
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

      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(activeConfig);

      const result = await AgentConfigurationService.getActiveConfiguration('OnboardingAgent');

      expect(mockPrisma.agentConfiguration.findFirst).toHaveBeenCalledWith({
        where: {
          agentName: 'OnboardingAgent',
          active: true,
        },
      });
      expect(result).toEqual(activeConfig);
    });

    it('should return null if no active configuration', async () => {
      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(null);

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

      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(currentConfig);
      mockPrisma.agentConfiguration.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.agentConfiguration.create.mockResolvedValue({
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

      expect(mockPrisma.agentConfiguration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          prompts: { greeting: 'Hello there!' },
          flowConfig: { states: ['start'] }, // Preserved from current
          extractionRules: { fields: ['name'] }, // Preserved from current
          createdBy: 'user-456',
        }),
      });
    });

    it('should throw error if no active configuration exists', async () => {
      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(null);

      await expect(
        AgentConfigurationService.updateConfiguration('NonExistentAgent', {}, 'user-123')
      ).rejects.toThrow('No active configuration found for agent: NonExistentAgent');
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

      mockPrisma.agentConfiguration.findUnique.mockResolvedValue(targetConfig);
      mockPrisma.agentConfiguration.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.agentConfiguration.update.mockResolvedValue({
        ...targetConfig,
        active: true,
      });

      const result = await AgentConfigurationService.rollbackConfiguration('OnboardingAgent', 2);

      expect(mockPrisma.agentConfiguration.updateMany).toHaveBeenCalledWith({
        where: { agentName: 'OnboardingAgent' },
        data: { active: false },
      });

      expect(mockPrisma.agentConfiguration.update).toHaveBeenCalledWith({
        where: { id: 'target-id' },
        data: { active: true },
      });

      expect(result.active).toBe(true);
    });

    it('should throw error if target version not found', async () => {
      mockPrisma.agentConfiguration.findUnique.mockResolvedValue(null);

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

      mockPrisma.agentConfiguration.findUnique
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

      mockPrisma.agentConfiguration.findMany.mockResolvedValue(activeConfigs);
      mockPrisma.agentConfiguration.groupBy.mockResolvedValue(groupByResult);

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

      mockPrisma.agentConfiguration.findFirst.mockResolvedValueOnce(sourceConfig);
      mockPrisma.agentConfiguration.findFirst.mockResolvedValueOnce(null); // No existing config for target
      mockPrisma.agentConfiguration.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.agentConfiguration.create.mockResolvedValue({
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

      expect(mockPrisma.agentConfiguration.create).toHaveBeenCalledWith({
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
      mockPrisma.agentConfiguration.findFirst.mockResolvedValue(null);

      await expect(
        AgentConfigurationService.cloneConfiguration('NonExistentAgent', 'NewAgent', 'user-123')
      ).rejects.toThrow('No active configuration found for source agent: NonExistentAgent');
    });
  });
});