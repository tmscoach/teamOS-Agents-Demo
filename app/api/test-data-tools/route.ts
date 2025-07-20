import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationContext } from '@/src/lib/auth/organization';
import { organizationDataService } from '@/src/lib/agents/services/organization-data-service';
import { createDataQueryTools } from '@/src/lib/agents/tools/data-query-tools';

export async function GET(req: NextRequest) {
  try {
    // Get organization context
    const orgContext = await getOrganizationContext();
    
    if (!orgContext) {
      return NextResponse.json({ error: 'No organization context' }, { status: 401 });
    }

    // Test the data service directly
    const overview = await organizationDataService.getOrganizationOverview(orgContext);
    const teams = await organizationDataService.getTeamList(orgContext);
    const assessmentStatus = await organizationDataService.getAssessmentStatus(orgContext);
    
    // Test the tools
    const tools = createDataQueryTools();
    const overviewTool = tools.find(t => t.name === 'get_organization_overview');
    const toolResult = overviewTool ? await overviewTool.execute({}, { 
      conversationId: 'test',
      teamId: 'test',
      managerId: orgContext.userId,
      transformationPhase: 'assessment',
      currentAgent: 'test',
      messageHistory: [],
      metadata: {}
    }) : null;

    return NextResponse.json({
      context: {
        userId: orgContext.userId,
        organizationId: orgContext.organizationId,
        role: orgContext.organizationRole,
        isSuperAdmin: orgContext.isSuperAdmin
      },
      dataService: {
        overview,
        teamCount: teams.length,
        teams: teams.map(t => ({ id: t.id, name: t.name, memberCount: t.memberCount })),
        assessmentStatus: {
          total: assessmentStatus.totalAssessments,
          byType: assessmentStatus.byType
        }
      },
      toolTest: toolResult
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}