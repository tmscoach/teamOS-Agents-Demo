import { NextRequest, NextResponse } from 'next/server';
import { updateWorkflow, getWorkflowProcess } from '@/src/lib/mock-tms-api/endpoints/workflows';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

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
    
    // Generate mock JWT
    const jwt = mockTMSClient.generateJWT({
      userId: 'user-123',
      email: 'user@example.com',
      userType: 'Respondent',
      organisationId: 'org-123'
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
    
    return NextResponse.json({ workflow_updated: updateResult === true });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}