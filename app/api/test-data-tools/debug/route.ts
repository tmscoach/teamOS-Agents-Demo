import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getOrganizationContext } from '@/src/lib/auth/organization';

export async function GET(req: NextRequest) {
  try {
    const orgContext = await getOrganizationContext();
    
    if (!orgContext || !orgContext.isSuperAdmin) {
      // Quick stats for non-super admins
      const userCount = await prisma.user.count({
        where: orgContext ? { organizationId: orgContext.organizationId } : {}
      });
      
      const teamCount = await prisma.team.count({
        where: orgContext ? { organizationId: orgContext.organizationId } : {}
      });

      return NextResponse.json({
        message: 'Limited debug info',
        yourOrganizationId: orgContext?.organizationId,
        usersInYourOrg: userCount,
        teamsInYourOrg: teamCount
      });
    }

    // Full debug for super admin
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organizationRole: true,
        journeyPhase: true,
        completedAssessments: true
      }
    });

    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        _count: {
          select: { members: true }
        }
      }
    });

    const organizations = await prisma.user.groupBy({
      by: ['organizationId'],
      _count: true
    });

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        totalTeams: teams.length,
        uniqueOrganizations: organizations.filter(o => o.organizationId).length
      },
      organizations: organizations,
      users: users.map(u => ({
        email: u.email,
        org: u.organizationId,
        role: u.role,
        orgRole: u.organizationRole,
        phase: u.journeyPhase
      })),
      teams: teams.map(t => ({
        name: t.name,
        org: t.organizationId,
        memberCount: t._count.members
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}