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
      select: {
        id: true,
        email: true,
        name: true,
        organizationId: true,
        organizationRole: true,
        role: true,
        journeyPhase: true,
        journeyStatus: true,
        onboardingData: true,
        clerkId: true,
        Team_Team_managerIdToUser: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Check if onboarding data contains organization
    let capturedOrganization = null;
    if (dbUser.onboardingData && typeof dbUser.onboardingData === 'object') {
      const onboardingData = dbUser.onboardingData as any;
      capturedOrganization = onboardingData.extractedFields?.organization || 
                           onboardingData.organization ||
                           onboardingData.capturedFields?.organization;
    }

    // Get recent conversations to check onboarding flow
    const recentConversations = await prisma.conversation.findMany({
      where: {
        managerId: dbUser.id,
        currentAgent: 'OnboardingAgent'
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        clerkId: dbUser.clerkId,
        hasOrganization: !!dbUser.organizationId,
        organizationId: dbUser.organizationId,
        organizationRole: dbUser.organizationRole,
        role: dbUser.role,
        journeyPhase: dbUser.journeyPhase,
        journeyStatus: dbUser.journeyStatus
      },
      onboarding: {
        hasOnboardingData: !!dbUser.onboardingData,
        capturedOrganization,
        onboardingData: dbUser.onboardingData
      },
      teams: dbUser.Team_Team_managerIdToUser,
      recentConversations: recentConversations.map(c => ({
        id: c.id,
        createdAt: c.createdAt,
        hasMetadata: !!c.metadata,
        onboardingComplete: (c.metadata as any)?.onboarding?.isComplete,
        capturedFields: (c.metadata as any)?.onboarding?.capturedFields
      })),
      diagnosis: {
        organizationCaptured: !!capturedOrganization,
        journeyProgressed: dbUser.journeyPhase !== 'ONBOARDING',
        shouldHaveOrganization: !!capturedOrganization && dbUser.journeyPhase !== 'ONBOARDING',
        issue: !dbUser.organizationId && capturedOrganization ? 
          'Organization was captured but not created in Clerk' : 
          !capturedOrganization ? 
          'Organization was never captured during onboarding' :
          'Unknown'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}