import { NextRequest, NextResponse } from 'next/server';
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
    
    // The mock API expects camelCase, but the real API uses PascalCase
    // Convert to the expected format
    const params = {
      subscriptionId: body.subscriptionID || body.subscriptionId,
      pageId: body.pageID || body.pageId,
      currentPageId: body.currentPageID || body.currentPageId || body.pageID || body.pageId,
      currentSectionId: body.currentSectionID || body.currentSectionId || body.sectionId,
      baseContentId: body.baseContentID || body.baseContentId,
      nextPageId: body.nextPageID || body.nextPageId || null,
      nextSectionId: body.nextSectionID || body.nextSectionId || null,
      nextBaseContentId: body.nextBaseContentID || body.nextBaseContentId || null,
      questions: body.questions || []
    };
    
    const response = await mockTMSClient.callTool('tms_update_workflow', params);
    
    // If update successful and we have navigation IDs, chain to get next page
    if (response === true || response.success) {
      const { nextPageId, nextSectionId, nextBaseContentId, subscriptionId, baseContentId, currentSectionId } = params;
      
      // Check if workflow is complete
      if (!nextPageId && !nextSectionId && !nextBaseContentId) {
        return NextResponse.json({
          workflow_updated: true,
          workflow_complete: true,
          message: "Workflow completed successfully"
        });
      }
      
      // Build hierarchical navigation params
      let nextParams: any = { subscriptionId };
      
      if (nextPageId) {
        // Navigate to next page within current section
        nextParams.baseContentId = baseContentId;
        nextParams.sectionId = currentSectionId;
        nextParams.pageId = nextPageId;
      } else if (nextSectionId) {
        // Navigate to next section
        nextParams.baseContentId = baseContentId;
        nextParams.sectionId = nextSectionId;
      } else if (nextBaseContentId) {
        // Navigate to next base content
        nextParams.baseContentId = nextBaseContentId;
      }
      
      console.log('🔗 Chaining to next page:', nextParams);
      
      // Get the next page data
      const nextResponse = await mockTMSClient.callTool('tms_get_workflow_process', nextParams);
      
      return NextResponse.json({
        workflow_updated: true,
        workflow_advanced: true,
        ...nextResponse
      });
    }
    
    return NextResponse.json({ workflow_updated: response === true });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}