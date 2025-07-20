import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createDataQueryTools } from '../data-query-tools';
import { AgentContext } from '../../types';
import { organizationDataService } from '../../services/organization-data-service';

// Mock the organization data service
jest.mock('../../services/organization-data-service', () => ({
  organizationDataService: {
    getOrganizationOverview: jest.fn(),
    getAssessmentStatus: jest.fn(),
    getUserJourneyProgress: jest.fn(),
    getMemberList: jest.fn(),
    getInvitationStatus: jest.fn(),
  },
}));

describe('Data Query Tools', () => {
  let tools: ReturnType<typeof createDataQueryTools>;
  let mockContext: AgentContext;

  beforeEach(() => {
    jest.clearAllMocks();
    tools = createDataQueryTools();
    
    mockContext = {
      conversationId: 'conv-123',
      teamId: 'team-1',
      managerId: 'manager-123',
      organizationId: 'org-123',
      organizationRole: 'org:admin',
      userRole: 'MANAGER',
      currentAgent: 'OrchestratorAgent',
      transformationPhase: 'ASSESSMENT',
      messageHistory: [],
      metadata: {},
    };
  });

  describe('get_organization_overview tool', () => {
    const overviewTool = () => tools.find(t => t.name === 'get_organization_overview')!;

    it('should return formatted organization overview', async () => {
      const mockOverview = {
        organizationId: 'org-123',
        totalTeams: 3,
        totalMembers: 15,
        activeAssessments: 2,
        pendingInvitations: 5,
        completionRate: 0.75,
        lastActivityDate: new Date('2025-01-20'),
      };

      (organizationDataService.getOrganizationOverview as jest.Mock).mockResolvedValue(mockOverview);

      const result = await overviewTool().execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({
        raw: mockOverview,
        summary: {
          teams: 3,
          members: 15,
          activeAssessments: 2,
          pendingInvitations: 5,
          completionPercentage: 75,
        },
        naturalLanguage: 'The organization has 3 teams with 15 members. There are currently 2 active assessments with a 75% completion rate.',
      });
      expect(result.metadata).toEqual({
        source: 'LOCAL_DB',
        accessLevel: 'MANAGER',
      });
    });

    it('should handle missing organization context', async () => {
      const noOrgContext = { ...mockContext, organizationId: null };

      const result = await overviewTool().execute({}, noOrgContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No organization context available');
    });

    it('should handle service errors gracefully', async () => {
      (organizationDataService.getOrganizationOverview as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await overviewTool().execute({}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('get_team_assessment_status tool', () => {
    const assessmentTool = () => tools.find(t => t.name === 'get_team_assessment_status')!;

    it('should return formatted assessment status', async () => {
      const mockStatus = {
        totalAssessments: 10,
        byType: {
          TMP: { total: 4, completed: 3, inProgress: 1, notStarted: 0 },
          QO2: { total: 3, completed: 2, inProgress: 0, notStarted: 1 },
          WOW: { total: 3, completed: 0, inProgress: 2, notStarted: 1 },
        },
        byTeam: {
          'team-1': { teamName: 'Engineering', total: 5, completed: 3, inProgress: 2 },
          'team-2': { teamName: 'Marketing', total: 5, completed: 2, inProgress: 1 },
        },
      };

      (organizationDataService.getAssessmentStatus as jest.Mock).mockResolvedValue(mockStatus);

      const result = await assessmentTool().execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.output.summary).toContain('Total assessments: 10');
      expect(result.output.summary).toContain('TMP: 3/4 completed (1 in progress)');
      expect(result.output.summary).toContain('Engineering: 3/5 completed (60%)');
    });

    it('should filter by assessment type when specified', async () => {
      await assessmentTool().execute({ assessmentType: 'TMP' }, mockContext);

      expect(organizationDataService.getAssessmentStatus).toHaveBeenCalledWith(
        expect.any(Object),
        { teamId: undefined, assessmentType: 'TMP' }
      );
    });
  });

  describe('get_user_journey_progress tool', () => {
    const journeyTool = () => tools.find(t => t.name === 'get_user_journey_progress')!;

    it('should return formatted journey progress', async () => {
      const mockProgress = {
        userId: 'user-123',
        userName: 'John Doe',
        currentPhase: 'ASSESSMENT',
        currentStatus: 'ACTIVE',
        completedSteps: ['ONBOARDING', 'TEAM_SIGNALS'],
        nextStep: 'Complete TMP assessment',
        lastActivity: new Date(),
        assessments: {
          TMP: { status: 'IN_PROGRESS', startedAt: new Date() },
          QO2: { status: 'NOT_STARTED' },
        },
      };

      (organizationDataService.getUserJourneyProgress as jest.Mock).mockResolvedValue(mockProgress);

      const result = await journeyTool().execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.output.summary).toContain('John Doe is currently in the ASSESSMENT phase');
      expect(result.output.summary).toContain('Status: ACTIVE');
      expect(result.output.summary).toContain('Completed steps: 2');
      expect(result.output.summary).toContain('TMP: IN_PROGRESS');
    });

    it('should handle user not found', async () => {
      (organizationDataService.getUserJourneyProgress as jest.Mock).mockResolvedValue(null);

      const result = await journeyTool().execute({ userId: 'unknown' }, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found or access denied');
    });
  });

  describe('get_team_members tool', () => {
    const membersTool = () => tools.find(t => t.name === 'get_team_members')!;

    it('should return formatted member list', async () => {
      const mockMembers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'TEAM_MEMBER',
          teamId: 'team-1',
          teamName: 'Engineering',
          lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          assessmentStatus: {
            TMP: 'completed',
            QO2: 'completed',
            WOW: 'in_progress',
            LLP: 'not_started',
          },
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'TEAM_MEMBER',
          teamId: 'team-1',
          teamName: 'Engineering',
          lastActive: new Date(),
          assessmentStatus: {
            TMP: 'not_started',
            QO2: 'not_started',
            WOW: 'not_started',
            LLP: 'not_started',
          },
        },
      ];

      (organizationDataService.getMemberList as jest.Mock).mockResolvedValue(mockMembers);

      const result = await membersTool().execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.output.summary).toContain('Found 2 team members');
      expect(result.output.summary).toContain('Completed all assessments: 0 members');
      expect(result.output.summary).toContain('Partially completed: 1 member');
      expect(result.output.summary).toContain('Not started: 1 member');
      expect(result.output.summary).toContain('Active in last 7 days: 2 members');
    });

    it('should handle empty member list', async () => {
      (organizationDataService.getMemberList as jest.Mock).mockResolvedValue([]);

      const result = await membersTool().execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.output.summary).toBe('Found 0 team members.');
      expect(result.output.count).toBe(0);
    });
  });

  describe('get_invitation_status tool', () => {
    const invitationTool = () => tools.find(t => t.name === 'get_invitation_status')!;

    it('should return placeholder message for now', async () => {
      (organizationDataService.getInvitationStatus as jest.Mock).mockResolvedValue({});

      const result = await invitationTool().execute({}, mockContext);

      expect(result.success).toBe(true);
      expect(result.output.summary).toContain('Invitation tracking is not yet implemented');
      expect(result.output.placeholder).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle context without organization for all tools', async () => {
      const noOrgContext = { ...mockContext, organizationId: null };

      for (const tool of tools) {
        const result = await tool.execute({}, noOrgContext);
        expect(result.success).toBe(false);
        expect(result.error).toContain('No organization context available');
      }
    });

    it('should properly format singular vs plural in natural language', async () => {
      const mockOverview = {
        organizationId: 'org-123',
        totalTeams: 1,
        totalMembers: 1,
        activeAssessments: 1,
        pendingInvitations: 0,
        completionRate: 1.0,
        lastActivityDate: new Date(),
      };

      (organizationDataService.getOrganizationOverview as jest.Mock).mockResolvedValue(mockOverview);

      const overviewTool = tools.find(t => t.name === 'get_organization_overview')!;
      const result = await overviewTool.execute({}, mockContext);

      expect(result.output.naturalLanguage).toBe(
        'The organization has 1 team with 1 member. There is currently 1 active assessment with a 100% completion rate.'
      );
    });
  });
});