import { NextResponse } from 'next/server';
import { getDashboardSubscriptions } from '@/src/lib/mock-tms-api/endpoints/subscriptions';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get the current user from Clerk
    const session = await auth();
    const user = await currentUser();
    
    // In dev mode, check for dev auth cookie if no Clerk session
    let userId = session?.userId;
    let userEmail: string | undefined = user?.emailAddresses?.[0]?.emailAddress;
    
    if (!userId && process.env.NODE_ENV === 'development') {
      const cookieStore = await cookies();
      const devAuthCookie = cookieStore.get('dev-auth');
      if (devAuthCookie) {
        try {
          const devAuth = JSON.parse(devAuthCookie.value);
          userId = devAuth.userId;
          userEmail = devAuth.email;
          console.log('[dashboard-subscriptions] Using dev auth:', { userId, userEmail });
        } catch (e) {
          console.error('Failed to parse dev auth cookie:', e);
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the mock user by Clerk ID or email (for dev mode)
    let mockUser = mockDataStore.getUserByClerkId(userId);
    
    // In dev mode, also try to find by email if we have it
    if (!mockUser && userEmail && process.env.NODE_ENV === 'development') {
      console.log('[dashboard-subscriptions] Trying to find user by email:', userEmail);
      mockUser = mockDataStore.getUserByEmail(userEmail);
      
      // If still no user found in dev mode, create one automatically
      if (!mockUser) {
        console.log('[dashboard-subscriptions] Creating dev mode user:', userEmail);
        
        // First check if an organization exists for this email domain
        const emailDomain = userEmail.split('@')[1];
        let organization = Array.from(mockDataStore.organizations.values())
          .find(org => org.name.toLowerCase().includes(emailDomain.split('.')[0]));
        
        // If no org exists, create one
        if (!organization) {
          organization = mockDataStore.createOrganization(`Dev Org - ${emailDomain}`, userId);
        }
        
        // Create the user
        mockUser = mockDataStore.createUser({
          email: userEmail,
          password: 'dev-mode-user', // Not used in dev mode
          firstName: 'Dev',
          lastName: 'User',
          userType: 'Respondent',
          organizationId: organization.id,
          clerkUserId: userId
        });
        
        console.log('[dashboard-subscriptions] Created dev mode user:', mockUser.id);
      }
    }
    
    if (!mockUser) {
      console.log('No mock user found for:', { userId, userEmail });
      
      // In development, auto-create a mock user for real Clerk users
      if (process.env.NODE_ENV === 'development' && userId && userEmail) {
        console.log('[dashboard-subscriptions] Auto-creating mock user for real Clerk user');
        
        // First, ensure we have an organization
        const existingOrgs = Array.from(mockDataStore.organizations.values());
        let orgId: string;
        
        if (existingOrgs.length > 0) {
          // Use the first organization
          orgId = existingOrgs[0].id;
        } else {
          // Create a default organization
          const newOrg = mockDataStore.createOrganization('Default Organization', 'system');
          orgId = newOrg.id;
        }
        
        // Create the mock user linked to the Clerk user
        mockUser = mockDataStore.createUser({
          email: userEmail,
          clerkUserId: userId,
          firstName: userEmail.split('@')[0],
          lastName: 'User',
          userType: 'Facilitator',
          organizationId: orgId
        });
        
        console.log('[dashboard-subscriptions] Created mock user:', mockUser);
      } else {
        console.error('Cannot create mock user - missing required data');
        return NextResponse.json({ subscriptions: [] });
      }
    }
    
    // Generate a JWT for the current user
    const jwtPayload = {
      sub: mockUser.id,
      nameid: mockUser.email,
      UserType: mockUser.userType || 'Respondent',
      organisationId: mockUser.organizationId
    };
    console.log('[dashboard-subscriptions] Generating JWT with payload:', jwtPayload);
    
    const jwt = mockTMSClient.generateJWT(jwtPayload);
    
    try {
      const subscriptions = await getDashboardSubscriptions({ jwt });
      
      console.log('[dashboard-subscriptions] Returning subscriptions:', subscriptions?.length || 0);
      if (subscriptions && subscriptions.length > 0) {
        console.log('[dashboard-subscriptions] First subscription:', subscriptions[0]);
      }
      
      return NextResponse.json({ subscriptions: subscriptions || [] });
    } catch (subscriptionError) {
      console.error('[dashboard-subscriptions] Error from getDashboardSubscriptions:', subscriptionError);
      // Return empty array instead of error to allow modal to show
      return NextResponse.json({ subscriptions: [] });
    }
  } catch (error) {
    console.error('Error getting dashboard subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard subscriptions' },
      { status: 500 }
    );
  }
}