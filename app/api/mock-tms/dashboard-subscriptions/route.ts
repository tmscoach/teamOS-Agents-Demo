import { NextResponse } from 'next/server';
import { getDashboardSubscriptions } from '@/src/lib/mock-tms-api/endpoints/subscriptions';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    // Get the current user from Clerk
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the mock user by Clerk ID
    const mockUser = mockDataStore.getUserByClerkId(session.userId);
    if (!mockUser) {
      console.error('No mock user found for Clerk ID:', session.userId);
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