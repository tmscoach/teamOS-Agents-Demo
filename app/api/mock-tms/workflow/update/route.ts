import { NextRequest, NextResponse } from 'next/server';
import { updateWorkflow, getWorkflowProcess } from '@/src/lib/mock-tms-api/endpoints/workflows';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 Workflow Update Request:', {
      subscriptionId: body.subscriptionID || body.subscriptionId,
      pageId: body.pageID || body.pageId,
      currentPageId: body.currentPageID || body.currentPageId,
      currentSectionId: body.currentSectionID || body.currentSectionId,
      baseContentId: body.baseContentID || body.baseContentId,
      questionsCount: body.questions?.length || 0
    });
    
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
          console.log('[workflow-update] Using dev auth:', { userId, userEmail });
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
      console.log('[workflow-update] Trying to find user by email:', userEmail);
      mockUser = mockDataStore.getUserByEmail(userEmail);
    }
    
    if (!mockUser) {
      console.log('[workflow-update] No mock user found for:', { userId, userEmail });
      
      // In development, auto-create a mock user for real Clerk users
      if (process.env.NODE_ENV === 'development' && userId && userEmail) {
        console.log('[workflow-update] Creating mock user for real Clerk user');
        
        // Extract organization ID from subscription if available
        const subscriptionId = body.subscriptionID || body.subscriptionId;
        const subscription = mockDataStore.subscriptions.get(subscriptionId);
        const orgId = subscription?.organizationId || 'default-org';
        
        mockUser = mockDataStore.createUser({
          email: userEmail,
          clerkUserId: userId,
          firstName: userEmail.split('@')[0],
          lastName: 'User',
          userType: 'Facilitator',
          organizationId: orgId
        });
        console.log('[workflow-update] Created mock user:', mockUser.id);
      }
    }
    
    if (!mockUser) {
      return NextResponse.json(
        { error: 'User not found. Please ensure data is seeded.' },
        { status: 401 }
      );
    }
    
    // Generate mock JWT with actual user data
    const jwt = mockTMSClient.generateJWT({
      sub: mockUser.id,
      userId: mockUser.id,
      email: mockUser.email,
      UserType: mockUser.userType,
      organisationId: mockUser.organizationId
    });
    
    // Call the update endpoint
    const updateResult = await updateWorkflow({ data: body, jwt });
    
    // If update successful and we have navigation IDs, chain to get next page
    if (updateResult === true) {
      const nextPageId = body.nextPageID || body.nextPageId;
      const nextSectionId = body.nextSectionID || body.nextSectionId;
      const nextBaseContentId = body.nextBaseContentID || body.nextBaseContentId;
      const subscriptionId = body.subscriptionID || body.subscriptionId;
      const baseContentId = body.baseContentID || body.baseContentId;
      const currentSectionId = body.currentSectionID || body.currentSectionId;
      
      // Check if workflow is complete
      if (!nextPageId && !nextSectionId && !nextBaseContentId) {
        return NextResponse.json({
          workflow_updated: true,
          workflow_complete: true,
          message: "Workflow completed successfully"
        });
      }
      
      // Build endpoint for next page
      let endpoint = `/Workflow/Process/${subscriptionId}`;
      
      if (nextPageId) {
        // Navigate to next page within current section
        endpoint += `/${baseContentId}/${currentSectionId}/${nextPageId}`;
      } else if (nextSectionId) {
        // Navigate to next section
        endpoint += `/${baseContentId}/${nextSectionId}`;
      } else if (nextBaseContentId) {
        // Navigate to next base content
        endpoint += `/${nextBaseContentId}`;
      }
      
      console.log('🔗 Chaining to next page:', endpoint);
      
      // Get the next page data
      const nextResponse = await getWorkflowProcess({ endpoint, jwt });
      
      return NextResponse.json({
        workflow_updated: true,
        workflow_advanced: true,
        ...nextResponse
      });
    }
    
    return NextResponse.json({ workflow_updated: updateResult });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}