import { NextResponse } from 'next/server';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function GET() {
  try {
    const response = await mockTMSClient.callTool('tms_get_dashboard_subscriptions', {});
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting dashboard subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard subscriptions' },
      { status: 500 }
    );
  }
}