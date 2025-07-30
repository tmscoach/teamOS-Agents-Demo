import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowProcess } from '@/src/lib/mock-tms-api/endpoints/workflows';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

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
    
    // Get the current user from mock data store
    const { mockDataStore } = await import('@/src/lib/mock-tms-api/mock-data-store');
    const currentUser = mockDataStore.getUserByEmail('facilitator@example.com');
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found. Please ensure data is seeded.' },
        { status: 401 }
      );
    }
    
    // Generate mock JWT with actual user data
    const jwt = mockTMSClient.generateJWT({
      sub: currentUser.id,
      userId: currentUser.id,
      email: currentUser.email,
      UserType: currentUser.userType,
      organisationId: currentUser.organizationId
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