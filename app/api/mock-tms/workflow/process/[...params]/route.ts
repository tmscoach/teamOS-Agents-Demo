import { NextRequest, NextResponse } from 'next/server';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const pathParams = params.params || [];
    
    let toolParams: any = {};
    
    // Parse hierarchical path: /subscriptionId/baseContentId/sectionId/pageId
    if (pathParams.length >= 1) {
      toolParams.subscriptionId = parseInt(pathParams[0]);
    }
    if (pathParams.length >= 2) {
      toolParams.baseContentId = parseInt(pathParams[1]);
    }
    if (pathParams.length >= 3) {
      toolParams.sectionId = parseInt(pathParams[2]);
    }
    if (pathParams.length >= 4) {
      toolParams.pageId = parseInt(pathParams[3]);
    }
    
    console.log('🔍 Hierarchical Navigation:', {
      path: pathParams.join('/'),
      params: toolParams,
      depth: pathParams.length
    });
    
    const response = await mockTMSClient.callTool('tms_get_workflow_process', toolParams);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting workflow process:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow process' },
      { status: 500 }
    );
  }
}