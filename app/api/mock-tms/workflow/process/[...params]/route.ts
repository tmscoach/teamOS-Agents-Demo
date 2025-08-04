import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowProcess } from '@/src/lib/mock-tms-api/endpoints/workflows';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathParams = resolvedParams.params || [];
    
    // Build endpoint path
    const endpoint = `/Workflow/Process/${pathParams.join('/')}`;
    
    console.log('🔍 Hierarchical Navigation:', {
      path: pathParams.join('/'),
      endpoint,
      depth: pathParams.length
    });
    
    // Get the current user from Clerk
    const session = await auth();
    const user = await currentUser();
    
    // In dev mode, check for dev auth cookie if no Clerk session
    let userId = session?.userId;
    let userEmail: string | undefined = user?.emailAddresses?.[0]?.emailAddress;
    
    if (!userId && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development')) {
      // Use the getDevAuth function to properly handle dev auth
      const { getDevAuth } = await import('@/src/lib/auth/dev-auth');
      const devAuth = await getDevAuth();
      
      if (devAuth) {
        userId = devAuth.userId;
        userEmail = devAuth.email;
        console.log('[workflow-process] Using dev auth:', { userId, userEmail });
      } else {
        console.log('[workflow-process] No dev auth found');
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the mock user by Clerk ID or email (for dev mode)
    let mockUser = mockDataStore.getUserByClerkId(userId);
    
    // In dev mode, also try to find by email if we have it
    if (!mockUser && userEmail && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development')) {
      console.log('[workflow-process] Trying to find user by email:', userEmail);
      mockUser = mockDataStore.getUserByEmail(userEmail);
    }
    
    if (!mockUser) {
      console.log('[workflow-process] No mock user found for:', { userId, userEmail });
      
      // In development, auto-create a mock user for real Clerk users
      if ((process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development') && userId && userEmail) {
        console.log('[workflow-process] Creating mock user for real Clerk user');
        
        // Extract organization ID from pathParams (subscriptionId contains it)
        const subscriptionId = pathParams[0];
        const subscription = mockDataStore.subscriptions.get(subscriptionId);
        const orgId = subscription?.organizationId || 'default-org';
        
        mockUser = mockDataStore.createUser({
          email: userEmail,
          clerkUserId: userId,
          firstName: userEmail.split('@')[0],
          lastName: 'User',
          userType: 'Facilitator',
          organizationId: orgId
        });
        console.log('[workflow-process] Created mock user:', mockUser.id);
      }
    }
    
    if (!mockUser) {
      return NextResponse.json(
        { error: 'User not found. Please ensure data is seeded.' },
        { status: 401 }
      );
    }
    
    // Generate mock JWT with actual user data
    const jwt = mockTMSClient.generateJWT({
      sub: mockUser.id,
      userId: mockUser.id,
      email: mockUser.email,
      UserType: mockUser.userType,
      organisationId: mockUser.organizationId
    });
    
    const response = await getWorkflowProcess({ endpoint, jwt });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting workflow process:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow process' },
      { status: 500 }
    );
  }
}