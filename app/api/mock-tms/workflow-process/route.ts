import { NextRequest, NextResponse } from 'next/server';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      subscriptionId: searchParams.get('subscriptionId') || '',
      baseContentId: searchParams.get('baseContentId') || '',
      sectionId: searchParams.get('sectionId') || '',
      pageId: searchParams.get('pageId') || ''
    };
    
    const response = await mockTMSClient.callTool('tms_get_workflow_process', params);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting workflow process:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow process' },
      { status: 500 }
    );
  }
}