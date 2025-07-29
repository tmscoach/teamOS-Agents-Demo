import { NextResponse } from 'next/server';
import { getDashboardSubscriptions } from '@/src/lib/mock-tms-api/endpoints/subscriptions';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function GET() {
  try {
    // Generate a mock JWT for the facilitator
    const jwt = mockTMSClient.generateJWT({
      userId: 'facilitator-123',
      email: 'facilitator@example.com',
      userType: 'Facilitator',
      organisationId: 'org-123'
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