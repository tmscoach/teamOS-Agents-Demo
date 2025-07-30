import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateHTMLReport } from '@/src/lib/mock-tms-api/endpoints/reports';
import { mockTMSClient } from '@/src/lib/mock-tms-api/mock-api-client';
import { mockDataStore } from '@/src/lib/mock-tms-api/mock-data-store';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Get the current user from mock data store
    const mockUser = mockDataStore.getUserByClerkId(session.userId);
    
    let jwt: string;
    if (!mockUser) {
      // Create a default facilitator user for report generation
      const defaultUser = {
        userId: `user-${Date.now()}`,
        email: 'facilitator@example.com',
        userType: 'Facilitator',
        organisationId: `org-${Date.now()}`
      };
      
      // Generate mock JWT
      jwt = mockTMSClient.generateJWT(defaultUser);
    } else {
      // Generate mock JWT for the actual user
      jwt = mockTMSClient.generateJWT({
        userId: mockUser.id,
        email: mockUser.email,
        userType: mockUser.userType || 'Facilitator',
        organisationId: mockUser.organizationId
      });
    }
    
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