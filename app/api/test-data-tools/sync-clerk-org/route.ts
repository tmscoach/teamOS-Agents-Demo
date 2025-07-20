import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[Sync] Current user:', user.id, user.emailAddresses?.[0]?.emailAddress);

    // Check if we're in dev mode
    const isDevMode = process.env.NODE_ENV === 'development' && user.id.startsWith('dev_user_');
    
    if (isDevMode) {
      // In dev mode, we can't use Clerk API, so let's use the Facebook org ID directly
      // You saw in Clerk that Facebook org exists
      const mockOrgId = 'org_facebook_' + Date.now();
      
      const dbUser = await prisma.user.findUnique({
        where: { email: user.emailAddresses?.[0]?.emailAddress || user.id }
      });
      
      if (!dbUser) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          organizationId: mockOrgId,
          organizationRole: 'org:admin'
        }
      });
      
      // Update teams
      await prisma.team.updateMany({
        where: { managerId: dbUser.id, organizationId: null },
        data: { organizationId: mockOrgId }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Dev mode: Created mock organization',
        devMode: true,
        organization: { id: mockOrgId, name: 'Facebook (Dev)' },
        user: {
          id: updatedUser.id,
          organizationId: updatedUser.organizationId,
          organizationRole: updatedUser.organizationRole
        }
      });
    }

    // Get user's organizations from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    
    console.log('[Sync] Getting memberships for Clerk user:', user.id);
    
    // Get user's organization memberships
    const memberships = await clerk.users.getOrganizationMembershipList({
      userId: user.id
    });

    if (!memberships || memberships.data.length === 0) {
      return NextResponse.json({ 
        error: 'No organizations found in Clerk for this user' 
      }, { status: 404 });
    }

    // Get the first (or primary) organization
    const primaryMembership = memberships.data[0];
    const organization = primaryMembership.organization;

    // Update user in database
    const dbUser = await prisma.user.findUnique({
      where: { 
        email: user.emailAddresses?.[0]?.emailAddress || user.id 
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Update user with organization info
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        organizationId: organization.id,
        organizationRole: primaryMembership.role
      }
    });

    // Update all teams managed by this user
    if (dbUser.role === 'MANAGER') {
      const teamsUpdated = await prisma.team.updateMany({
        where: { 
          managerId: dbUser.id,
          organizationId: null // Only update teams without an org
        },
        data: { 
          organizationId: organization.id 
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully synced organization from Clerk',
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug
        },
        user: {
          id: updatedUser.id,
          organizationId: updatedUser.organizationId,
          organizationRole: updatedUser.organizationRole
        },
        teamsUpdated: teamsUpdated.count
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully synced organization from Clerk',
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      },
      user: {
        id: updatedUser.id,
        organizationId: updatedUser.organizationId,
        organizationRole: updatedUser.organizationRole
      }
    });

  } catch (error) {
    console.error('Sync org error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'POST to this endpoint to sync your Clerk organization to the database',
    instructions: 'Use fetch("/api/test-data-tools/sync-clerk-org", { method: "POST" })'
  });
}