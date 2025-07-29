import { NextRequest, NextResponse } from 'next/server';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await mockTMSClient.callTool('tms_start_workflow', body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    );
  }
}