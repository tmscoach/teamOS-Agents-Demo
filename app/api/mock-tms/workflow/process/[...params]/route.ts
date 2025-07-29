import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowProcess } from '@/src/lib/mock-tms-api/endpoints/workflows';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const pathParams = params.params || [];
    
    // Build endpoint path
    const endpoint = `/Workflow/Process/${pathParams.join('/')}`;
    
    console.log('🔍 Hierarchical Navigation:', {
      path: pathParams.join('/'),
      endpoint,
      depth: pathParams.length
    });
    
    // Generate mock JWT
    const jwt = mockTMSClient.generateJWT({
      userId: 'user-123',
      email: 'user@example.com',
      userType: 'Respondent',
      organisationId: 'org-123'
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