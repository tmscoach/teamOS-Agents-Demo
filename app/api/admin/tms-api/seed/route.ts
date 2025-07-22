import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mockDataStore, resetMockDataStore } from "@/src/lib/mock-tms-api/mock-data-store";
import { mockTMSClient } from "@/src/lib/mock-tms-api/mock-api-client";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear existing data first
    resetMockDataStore();
    
    console.log('Seed: Starting to create test data...');
    
    // Create a test user
    const testEmail = "facilitator@example.com";
    
    // Create test organization
    const testOrg = mockDataStore.createOrganization("Test Organization", "");

    // Create test user  
    const testUser = mockDataStore.createUser({
      email: testEmail,
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "Facilitator",
      userType: 'Facilitator',
      organizationId: testOrg.id
    });

    // The user already has a token from createUser

    // Return the created facilitator credentials for easy testing
    const facilitatorToken = mockTMSClient.generateJWT({
      sub: testUser.id,
      UserType: 'Facilitator',
      nameid: testUser.email,
      organisationId: testOrg.id
    });
    
    // Update token mapping
    mockDataStore.tokenToUser.set(facilitatorToken, testUser.id);

    // Create test subscriptions with recorded IDs
    const subscriptions = [];
    
    // TMP Subscription
    const tmpSub = {
      subscriptionId: '21989',
      userId: testUser.id,
      organizationId: testOrg.id,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP' as const,
      status: 'not_started' as const,
      completionPercentage: 0,
      assignedDate: new Date('2024-01-15'),
      baseContentId: 3,
      currentPageId: 2
    };
    mockDataStore.subscriptions.set('21989', tmpSub);
    subscriptions.push(tmpSub);
    console.log('Seed: Created TMP subscription', tmpSub);
    
    // QO2 Subscription
    const qo2Sub = {
      subscriptionId: '21983',
      userId: testUser.id,
      organizationId: testOrg.id,
      workflowId: 'qo2-workflow',
      workflowName: 'Opportunities-Obstacles Quotient',
      assessmentType: 'QO2' as const,
      status: 'not_started' as const,
      completionPercentage: 0,
      assignedDate: new Date('2024-01-15'),
      baseContentId: 5,
      currentPageId: 408
    };
    mockDataStore.subscriptions.set('21983', qo2Sub);
    subscriptions.push(qo2Sub);
    
    // Team Signals Subscription
    const teamSignalsSub = {
      subscriptionId: '21988',
      userId: testUser.id,
      organizationId: testOrg.id,
      workflowId: 'team-signals-workflow',
      workflowName: 'Team Signals',
      assessmentType: 'TeamSignals' as const,
      status: 'not_started' as const,
      completionPercentage: 0,
      assignedDate: new Date('2024-01-15'),
      baseContentId: 12,
      currentPageId: 97
    };
    mockDataStore.subscriptions.set('21988', teamSignalsSub);
    subscriptions.push(teamSignalsSub);
    
    console.log('Seed: All subscriptions in store:', Array.from(mockDataStore.subscriptions.values()));
    console.log('Seed: Test user org:', testOrg.id);

    return NextResponse.json({
      message: "Test data created successfully",
      data: {
        user: {
          id: testUser.id,
          email: testUser.email,
          organizationId: testUser.organizationId,
          token: facilitatorToken
        },
        organization: {
          id: testOrg.id,
          name: testOrg.name
        },
        subscriptions: subscriptions.map(sub => ({
          subscriptionId: sub.subscriptionId,
          workflowId: sub.workflowId,
          workflowName: sub.workflowName,
          assessmentType: sub.assessmentType,
          status: sub.status
        }))
      }
    });
  } catch (error) {
    console.error("Error seeding test data:", error);
    return NextResponse.json(
      { error: "Failed to seed test data" },
      { status: 500 }
    );
  }
}