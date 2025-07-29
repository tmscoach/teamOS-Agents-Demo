import { NextRequest, NextResponse } from 'next/server';
import { generateHTMLReport } from '@/src/lib/mock-tms-api/endpoints/reports';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate mock JWT
    const jwt = mockTMSClient.generateJWT({
      userId: 'facilitator-123',
      email: 'facilitator@example.com',
      userType: 'Facilitator',
      organisationId: 'org-123'
    });
    
    const response = await generateHTMLReport({ 
      templateId: body.templateId,
      subscriptionId: body.subscriptionId,
      jwt 
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}