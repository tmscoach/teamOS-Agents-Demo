import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { assignSubscription } from '@/src/lib/mock-tms-api/endpoints/subscriptions';

export async function POST(request: Request) {
  try {
    const { assessmentType } = await request.json();
    
    // Get current user
    const session = await auth();
    const user = await currentUser();
    
    if (!session?.userId || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    
    // Get or create mock user
    let mockUser = mockDataStore.getUserByClerkId(session.userId);
    
    if (!mockUser && userEmail) {
      // Create mock user if doesn't exist
      const existingOrgs = Array.from(mockDataStore.organizations.values());
      let orgId: string;
      
      if (existingOrgs.length > 0) {
        orgId = existingOrgs[0].id;
      } else {
        const newOrg = mockDataStore.createOrganization('Default Organization', 'system');
        orgId = newOrg.id;
      }
      
      mockUser = mockDataStore.createUser({
        email: userEmail,
        clerkUserId: session.userId,
        firstName: userEmail.split('@')[0],
        lastName: 'User',
        userType: 'Facilitator',
        organizationId: orgId
      });
    }
    
    if (!mockUser) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
    
    // Map assessment type to workflow ID
    const workflowMap: Record<string, string> = {
      'tmp': 'tmp-workflow',
      'teamsignals': 'team-signals-workflow',
      'qo2': 'qo2-workflow',
      'wowv': 'wowv-workflow',
      'llp': 'llp-workflow'
    };
    
    const workflowId = workflowMap[assessmentType?.toLowerCase()];
    if (!workflowId) {
      return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 });
    }
    
    // Create JWT for the user
    const jwt = mockTMSClient.generateJWT({
      sub: mockUser.id,
      nameid: mockUser.email,
      UserType: mockUser.userType,
      organisationId: mockUser.organizationId
    });
    
    // Create subscription using mock TMS API
    const result = await assignSubscription({
      data: {
        userId: mockUser.id,
        workflowId: workflowId,
        organizationId: mockUser.organizationId
      },
      jwt: jwt
    });
    
    if (!result.subscriptionId) {
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
    
    // Return the subscription ID and redirect URL
    return NextResponse.json({
      subscriptionId: result.subscriptionId,
      assessmentType: assessmentType,
      redirectUrl: `/chat/assessment?agent=AssessmentAgent`
    });
    
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}