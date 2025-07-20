import { AgentTool, AgentContext, ToolResult } from '../types';
import { 
  organizationDataService,
  OrganizationDataService 
} from '../services/organization-data-service';
import { getOrganizationContext } from '@/src/lib/auth/organization';

/**
 * Create data query tools for agents to access organization data
 */
export function createDataQueryTools(): AgentTool[] {
  return [
    {
      name: 'get_organization_overview',
      description: 'Get high-level overview of the organization including teams, members, and assessment progress',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const orgContext = await getOrganizationContext();
          
          if (!orgContext) {
            return {
              success: false,
              output: null,
              error: 'Unable to determine organization context'
            };
          }

          const overview = await organizationDataService.getOrganizationOverview(orgContext);
          
          // Format for natural language
          const formattedOutput = {
            raw: overview,
            summary: {
              teams: overview.totalTeams,
              members: overview.totalMembers,
              activeAssessments: overview.activeAssessments,
              pendingInvitations: overview.pendingInvitations,
              completionPercentage: Math.round(overview.completionRate * 100),
              lastActivity: overview.lastActivityDate
            },
            naturalLanguage: `The organization has ${overview.totalTeams} team${overview.totalTeams !== 1 ? 's' : ''} with ${overview.totalMembers} member${overview.totalMembers !== 1 ? 's' : ''}. There are currently ${overview.activeAssessments} active assessment${overview.activeAssessments !== 1 ? 's' : ''} with a ${Math.round(overview.completionRate * 100)}% completion rate.`
          };

          return {
            success: true,
            output: formattedOutput,
            metadata: {
              source: 'LOCAL_DB',
              accessLevel: orgContext.userRole
            }
          };
        } catch (error) {
          console.error('[get_organization_overview] Error:', error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    },

    {
      name: 'get_team_assessment_status',
      description: 'Get assessment completion status for teams in the organization',
      parameters: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Optional team ID to filter by specific team'
          },
          assessmentType: {
            type: 'string',
            enum: ['TMP', 'QO2', 'WOW', 'LLP'],
            description: 'Optional assessment type to filter by'
          }
        },
        required: []
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const orgContext = await getOrganizationContext();
          
          if (!orgContext) {
            return {
              success: false,
              output: null,
              error: 'Unable to determine organization context'
            };
          }

          const status = await organizationDataService.getAssessmentStatus(
            orgContext,
            {
              teamId: params.teamId,
              assessmentType: params.assessmentType
            }
          );

          // Build natural language summary
          let summary = `Assessment Status:\n`;
          
          // Overall stats
          summary += `Total assessments: ${status.totalAssessments}\n\n`;
          
          // By type breakdown
          if (!params.assessmentType) {
            summary += `By Assessment Type:\n`;
            Object.entries(status.byType).forEach(([type, data]) => {
              if (data.total > 0) {
                summary += `- ${type}: ${data.completed}/${data.total} completed`;
                if (data.inProgress > 0) {
                  summary += ` (${data.inProgress} in progress)`;
                }
                summary += '\n';
              }
            });
            summary += '\n';
          }
          
          // By team breakdown (if not filtered by team)
          if (!params.teamId && Object.keys(status.byTeam).length > 0) {
            summary += `By Team:\n`;
            Object.values(status.byTeam).forEach((team: any) => {
              const completionRate = team.total > 0 
                ? Math.round((team.completed / team.total) * 100) 
                : 0;
              summary += `- ${team.teamName}: ${team.completed}/${team.total} completed (${completionRate}%)\n`;
            });
          }

          return {
            success: true,
            output: {
              raw: status,
              summary: summary.trim(),
              metrics: {
                total: status.totalAssessments,
                byType: status.byType,
                teamCount: Object.keys(status.byTeam).length
              }
            },
            metadata: {
              source: 'LOCAL_DB',
              filtered: {
                byTeam: !!params.teamId,
                byType: !!params.assessmentType
              }
            }
          };
        } catch (error) {
          console.error('[get_team_assessment_status] Error:', error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    },

    {
      name: 'get_user_journey_progress',
      description: 'Get journey progress for a specific user or the current user',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'Optional user ID. If not provided, returns current user\'s progress'
          }
        },
        required: []
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const orgContext = await getOrganizationContext();
          
          if (!orgContext) {
            return {
              success: false,
              output: null,
              error: 'Unable to determine organization context'
            };
          }

          const progress = await organizationDataService.getUserJourneyProgress(
            orgContext,
            params.userId
          );

          if (!progress) {
            return {
              success: false,
              output: null,
              error: 'User not found or access denied'
            };
          }

          // Build natural language summary
          let summary = `${progress.userName} is currently in the ${progress.currentPhase} phase.\n`;
          summary += `Status: ${progress.currentStatus}\n`;
          
          if (progress.completedSteps.length > 0) {
            summary += `Completed steps: ${progress.completedSteps.length}\n`;
          }
          
          if (progress.nextStep) {
            summary += `Next step: ${progress.nextStep}\n`;
          }
          
          // Assessment summary
          const assessmentTypes = Object.keys(progress.assessments);
          if (assessmentTypes.length > 0) {
            summary += '\nAssessments:\n';
            assessmentTypes.forEach(type => {
              const assessment = progress.assessments[type];
              summary += `- ${type}: ${assessment.status}`;
              if (assessment.completedAt) {
                summary += ` (completed)`;
              }
              summary += '\n';
            });
          }

          return {
            success: true,
            output: {
              raw: progress,
              summary: summary.trim(),
              phase: progress.currentPhase,
              nextAction: progress.nextStep
            },
            metadata: {
              source: 'LOCAL_DB',
              userId: progress.userId
            }
          };
        } catch (error) {
          console.error('[get_user_journey_progress] Error:', error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    },

    {
      name: 'get_team_members',
      description: 'Get list of team members with their status and progress',
      parameters: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Optional team ID to filter by specific team'
          }
        },
        required: []
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const orgContext = await getOrganizationContext();
          
          if (!orgContext) {
            return {
              success: false,
              output: null,
              error: 'Unable to determine organization context'
            };
          }

          const members = await organizationDataService.getMemberList(
            orgContext,
            params.teamId
          );

          // Build summary
          let summary = `Found ${members.length} team member${members.length !== 1 ? 's' : ''}.\n\n`;
          
          if (members.length > 0) {
            // Group by assessment completion
            const fullyAssessed = members.filter(m => 
              Object.values(m.assessmentStatus).every(s => s === 'completed')
            );
            const partiallyAssessed = members.filter(m => 
              Object.values(m.assessmentStatus).some(s => s === 'completed') &&
              !Object.values(m.assessmentStatus).every(s => s === 'completed')
            );
            const notStarted = members.filter(m => 
              Object.values(m.assessmentStatus).every(s => s === 'not_started')
            );

            if (fullyAssessed.length > 0) {
              summary += `Completed all assessments: ${fullyAssessed.length} member${fullyAssessed.length !== 1 ? 's' : ''}\n`;
            }
            if (partiallyAssessed.length > 0) {
              summary += `Partially completed: ${partiallyAssessed.length} member${partiallyAssessed.length !== 1 ? 's' : ''}\n`;
            }
            if (notStarted.length > 0) {
              summary += `Not started: ${notStarted.length} member${notStarted.length !== 1 ? 's' : ''}\n`;
            }

            // Recent activity
            const recentlyActive = members.filter(m => {
              const daysSinceActive = (Date.now() - m.lastActive.getTime()) / (1000 * 60 * 60 * 24);
              return daysSinceActive < 7;
            });
            
            if (recentlyActive.length > 0) {
              summary += `\nActive in last 7 days: ${recentlyActive.length} member${recentlyActive.length !== 1 ? 's' : ''}`;
            }
          }

          return {
            success: true,
            output: {
              raw: members,
              summary: summary.trim(),
              count: members.length,
              metrics: {
                total: members.length,
                withAssessments: members.filter(m => 
                  Object.values(m.assessmentStatus).some(s => s !== 'not_started')
                ).length
              }
            },
            metadata: {
              source: 'LOCAL_DB',
              filtered: !!params.teamId
            }
          };
        } catch (error) {
          console.error('[get_team_members] Error:', error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    },

    {
      name: 'get_invitation_status',
      description: 'Check status of team member invitations',
      parameters: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'Optional team ID to filter by specific team'
          }
        },
        required: []
      },
      execute: async (params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const orgContext = await getOrganizationContext();
          
          if (!orgContext) {
            return {
              success: false,
              output: null,
              error: 'Unable to determine organization context'
            };
          }

          const status = await organizationDataService.getInvitationStatus(
            orgContext,
            params.teamId
          );

          // Build natural language summary
          let summary = 'Invitation tracking is not yet implemented. ';
          summary += 'This feature will be available once the invitation system is integrated.';

          return {
            success: true,
            output: {
              raw: status,
              summary,
              placeholder: true
            },
            metadata: {
              source: 'LOCAL_DB',
              note: 'Placeholder implementation - invitation system pending'
            }
          };
        } catch (error) {
          console.error('[get_invitation_status] Error:', error);
          return {
            success: false,
            output: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }
    }
  ];
}