import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OrganizationDataService } from '../organization-data-service';
import { OrganizationContext } from '@/src/lib/auth/organization';
import { PrismaClient } from '@/lib/generated/prisma';

// Mock Prisma
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    assessment: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    assessmentResult: {
      findMany: jest.fn(),
    },
  })),
}));

describe('OrganizationDataService', () => {
  let service: OrganizationDataService;
  let mockPrisma: any;
  let managerContext: OrganizationContext;
  let memberContext: OrganizationContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    service = new OrganizationDataService();
    // @ts-ignore - accessing private property for testing
    service.prisma = mockPrisma;

    managerContext = {
      userId: 'manager-123',
      organizationId: 'org-123',
      userRole: 'MANAGER',
      teamIds: ['team-1', 'team-2'],
    };

    memberContext = {
      userId: 'member-456',
      organizationId: 'org-123',
      userRole: 'TEAM_MEMBER',
      teamIds: ['team-1'],
    };
  });

  describe('getOrganizationOverview', () => {
    it('should return organization overview for managers', async () => {
      // Mock data
      mockPrisma.team.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Engineering', organizationId: 'org-123' },
        { id: 'team-2', name: 'Marketing', organizationId: 'org-123' },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', teamId: 'team-1' },
        { id: 'user-2', teamId: 'team-1' },
        { id: 'user-3', teamId: 'team-2' },
      ]);
      mockPrisma.assessment.findMany.mockResolvedValue([
        { id: 'assess-1', status: 'IN_PROGRESS' },
        { id: 'assess-2', status: 'COMPLETED' },
      ]);

      const result = await service.getOrganizationOverview(managerContext);

      expect(result).toEqual({
        organizationId: 'org-123',
        totalTeams: 2,
        totalMembers: 3,
        activeAssessments: 1,
        pendingInvitations: 0,
        completionRate: 0.5,
        lastActivityDate: expect.any(Date),
      });

      expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
      });
    });

    it('should return limited data for team members', async () => {
      mockPrisma.team.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Engineering', organizationId: 'org-123' },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', teamId: 'team-1' },
        { id: 'user-2', teamId: 'team-1' },
      ]);

      const result = await service.getOrganizationOverview(memberContext);

      expect(result.totalTeams).toBe(1);
      expect(result.totalMembers).toBe(2);
      expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          id: { in: ['team-1'] },
        },
      });
    });

    it('should throw error when no organization context', async () => {
      const invalidContext: OrganizationContext = {
        userId: 'user-123',
        organizationId: null as any,
        userRole: 'MANAGER',
        teamIds: [],
      };

      await expect(service.getOrganizationOverview(invalidContext))
        .rejects.toThrow('Organization context required');
    });
  });

  describe('getTeamList', () => {
    it('should return all teams for managers', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Engineering',
          organizationId: 'org-123',
          createdAt: new Date(),
          manager: { name: 'John Doe' },
          _count: { members: 5 },
        },
        {
          id: 'team-2',
          name: 'Marketing',
          organizationId: 'org-123',
          createdAt: new Date(),
          manager: { name: 'Jane Smith' },
          _count: { members: 3 },
        },
      ];

      mockPrisma.team.findMany.mockResolvedValue(mockTeams);

      const result = await service.getTeamList(managerContext);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'team-1',
        name: 'Engineering',
        memberCount: 5,
        managerName: 'John Doe',
      });
    });

    it('should return only accessible teams for members', async () => {
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Engineering',
          organizationId: 'org-123',
          createdAt: new Date(),
          manager: { name: 'John Doe' },
          _count: { members: 5 },
        },
      ];

      mockPrisma.team.findMany.mockResolvedValue(mockTeams);

      const result = await service.getTeamList(memberContext);

      expect(result).toHaveLength(1);
      expect(mockPrisma.team.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          id: { in: ['team-1'] },
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getAssessmentStatus', () => {
    it('should return assessment status grouped by type', async () => {
      mockPrisma.assessment.findMany.mockResolvedValue([
        { id: 'a1', type: 'TMP', status: 'COMPLETED', teamId: 'team-1' },
        { id: 'a2', type: 'TMP', status: 'IN_PROGRESS', teamId: 'team-1' },
        { id: 'a3', type: 'QO2', status: 'COMPLETED', teamId: 'team-2' },
      ]);

      mockPrisma.team.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Engineering' },
        { id: 'team-2', name: 'Marketing' },
      ]);

      const result = await service.getAssessmentStatus(managerContext);

      expect(result.totalAssessments).toBe(3);
      expect(result.byType.TMP).toEqual({
        total: 2,
        completed: 1,
        inProgress: 1,
        notStarted: 0,
      });
      expect(result.byType.QO2).toEqual({
        total: 1,
        completed: 1,
        inProgress: 0,
        notStarted: 0,
      });
    });

    it('should filter by assessment type when specified', async () => {
      mockPrisma.assessment.findMany.mockResolvedValue([
        { id: 'a1', type: 'TMP', status: 'COMPLETED', teamId: 'team-1' },
        { id: 'a2', type: 'TMP', status: 'IN_PROGRESS', teamId: 'team-1' },
      ]);

      const result = await service.getAssessmentStatus(managerContext, {
        assessmentType: 'TMP',
      });

      expect(mockPrisma.assessment.findMany).toHaveBeenCalledWith({
        where: {
          team: { organizationId: 'org-123' },
          type: 'TMP',
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getUserJourneyProgress', () => {
    it('should return journey progress for specified user', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        journeyPhase: 'ASSESSMENT',
        journeyStatus: 'ACTIVE',
        completedAssessments: { TMP: true },
        lastActivity: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserJourneyProgress(
        managerContext,
        'user-123'
      );

      expect(result).toMatchObject({
        userId: 'user-123',
        userName: 'John Doe',
        currentPhase: 'ASSESSMENT',
        currentStatus: 'ACTIVE',
        completedSteps: ['ONBOARDING'],
      });
    });

    it('should return current user progress when no userId specified', async () => {
      const mockUser = {
        id: 'member-456',
        name: 'Jane Smith',
        journeyPhase: 'CONTINUOUS_ENGAGEMENT',
        journeyStatus: 'ACTIVE',
        completedAssessments: { TMP: true, QO2: true },
        lastActivity: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserJourneyProgress(memberContext);

      expect(result?.userId).toBe('member-456');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'member-456' },
      });
    });

    it('should return null for inaccessible users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'other-user',
        teamId: 'team-999', // Different team
      });

      const result = await service.getUserJourneyProgress(
        memberContext,
        'other-user'
      );

      expect(result).toBeNull();
    });
  });

  describe('getMemberList', () => {
    it('should return all organization members for managers', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'TEAM_MEMBER',
          lastActivity: new Date(),
          team: { id: 'team-1', name: 'Engineering' },
          completedAssessments: { TMP: true },
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'TEAM_MEMBER',
          lastActivity: new Date(),
          team: { id: 'team-2', name: 'Marketing' },
          completedAssessments: {},
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getMemberList(managerContext);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'user-1',
        name: 'John Doe',
        teamName: 'Engineering',
        assessmentStatus: {
          TMP: 'completed',
          QO2: 'not_started',
          WOW: 'not_started',
          LLP: 'not_started',
        },
      });
    });

    it('should filter by team when specified', async () => {
      await service.getMemberList(managerContext, 'team-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'TEAM_MEMBER',
          organizationId: 'org-123',
          teamId: 'team-1',
        },
        include: expect.any(Object),
      });
    });

    it('should respect team access for team members', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'TEAM_MEMBER',
          lastActivity: new Date(),
          team: { id: 'team-1', name: 'Engineering' },
          completedAssessments: {},
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getMemberList(memberContext);

      expect(result).toHaveLength(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'TEAM_MEMBER',
          organizationId: 'org-123',
          teamId: { in: ['team-1'] },
        },
        include: expect.any(Object),
      });
    });
  });
});