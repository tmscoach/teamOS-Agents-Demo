import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the database user
    const dbUser = await prisma.user.findUnique({
      where: { 
        email: user.emailAddresses?.[0]?.emailAddress || user.id 
      },
      include: {
        Team_Team_managerIdToUser: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Check current state
    const currentState = {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      organizationId: dbUser.organizationId,
      organizationRole: dbUser.organizationRole,
      role: dbUser.role,
      onboardingData: dbUser.onboardingData,
      managedTeamsCount: dbUser.Team_Team_managerIdToUser.length,
      managedTeamIds: dbUser.Team_Team_managerIdToUser.map(t => t.id)
    };

    return NextResponse.json({
      currentState,
      needsFix: !dbUser.organizationId && dbUser.role === 'MANAGER',
      instructions: !dbUser.organizationId ? 
        "Your user doesn't have an organization. You can either: 1) Complete onboarding again with an organization name, or 2) Use the fix endpoint (POST to this URL with {action: 'createOrg', orgName: 'Your Org Name'})" : 
        "Your user already has an organization."
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { action, orgName } = body;

    if (action !== 'createOrg' || !orgName) {
      return NextResponse.json({ 
        error: 'Invalid request. Send {action: "createOrg", orgName: "Your Org Name"}' 
      }, { status: 400 });
    }

    // Get the database user
    const dbUser = await prisma.user.findUnique({
      where: { 
        email: user.emailAddresses?.[0]?.emailAddress || user.id 
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.organizationId) {
      return NextResponse.json({ 
        error: 'User already has an organization',
        organizationId: dbUser.organizationId 
      }, { status: 400 });
    }

    try {
      // Import Clerk client
      const { clerkClient } = await import('@clerk/nextjs/server');
      const clerk = await clerkClient();
      
      // Create organization in Clerk
      const organization = await clerk.organizations.createOrganization({
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        createdBy: user.id,
      });
      
      // Add user as admin
      await clerk.organizations.createOrganizationMembership({
        organizationId: organization.id,
        userId: user.id,
        role: 'org:admin'
      });
      
      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          organizationId: organization.id,
          organizationRole: 'org:admin'
        }
      });
      
      // Update all teams managed by this user
      if (dbUser.role === 'MANAGER') {
        await prisma.team.updateMany({
          where: { managerId: dbUser.id },
          data: { organizationId: organization.id }
        });
      }
      
      return NextResponse.json({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug
        },
        updatedUser: {
          id: updatedUser.id,
          organizationId: updatedUser.organizationId,
          organizationRole: updatedUser.organizationRole
        },
        message: 'Organization created and linked successfully'
      });
    } catch (clerkError: any) {
      // If Clerk fails, we might be in dev mode - create a mock org ID
      if (process.env.NODE_ENV === 'development') {
        const mockOrgId = `org_mock_${Date.now()}`;
        
        const updatedUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            organizationId: mockOrgId,
            organizationRole: 'org:admin'
          }
        });
        
        // Update teams
        await prisma.team.updateMany({
          where: { managerId: dbUser.id },
          data: { organizationId: mockOrgId }
        });
        
        return NextResponse.json({
          success: true,
          organization: {
            id: mockOrgId,
            name: orgName,
            note: 'Mock organization created (dev mode)'
          },
          updatedUser: {
            id: updatedUser.id,
            organizationId: updatedUser.organizationId
          }
        });
      }
      
      throw clerkError;
    }
  } catch (error) {
    console.error('Fix org error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}