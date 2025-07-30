import { NextRequest, NextResponse } from 'next/server';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';
import { getAssessmentByWorkflow } from '@/src/lib/mock-tms-api/assessment-definitions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, subscriptionId } = body;
    
    // Find the subscription
    const subscription = mockDataStore.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    
    // Get assessment definition
    const assessment = getAssessmentByWorkflow(workflowId);
    if (!assessment) {
      throw new Error(`Unknown workflow: ${workflowId}`);
    }
    
    // Return the first page URL
    const firstSection = assessment.sections?.[0]?.sectionId || 2;
    const firstPage = assessment.sections?.[0]?.pages?.[0] || 2;
    const firstPageUrl = `/Workflow/Process/${subscriptionId}/${assessment.baseContentId}/${firstSection}/${firstPage}`;
    
    return NextResponse.json({
      success: true,
      firstPageUrl,
      message: `Started ${assessment.name} workflow`
    });
  } catch (error) {
    console.error('Error starting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to start workflow' },
      { status: 500 }
    );
  }
}