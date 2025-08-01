import { NextResponse } from 'next/server';
import { getDashboardSubscriptions } from '@/src/lib/mock-tms-api/endpoints/subscriptions';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get the current user from Clerk
    const session = await auth();
    
    // In dev mode, check for dev auth cookie if no Clerk session
    let userId = session?.userId;
    let userEmail: string | undefined;
    
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
    }
    
    if (!mockUser) {
      console.error('No mock user found for:', { userId, userEmail });
      return NextResponse.json({ subscriptions: [] });
    }
    
    // Generate a JWT for the current user
    const jwt = mockTMSClient.generateJWT({
      sub: mockUser.id,
      nameid: mockUser.email,
      UserType: mockUser.userType || 'Respondent',
      organisationId: mockUser.organizationId
    });
    
    const subscriptions = await getDashboardSubscriptions({ jwt });
    
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error getting dashboard subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard subscriptions' },
      { status: 500 }
    );
  }
}