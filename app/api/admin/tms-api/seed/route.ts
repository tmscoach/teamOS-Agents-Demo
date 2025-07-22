import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { mockDataStore } from "@/src/lib/mock-tms-api/mock-data-store";
import { mockTMSClient } from "@/src/lib/mock-tms-api/mock-api-client";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a test user
    const testUserId = `test_${session.userId}`;
    const testEmail = `test_${session.userId}@example.com`;
    const testOrgId = `org_${session.userId}`;
    
    // Create test organization
    const org = mockDataStore.createOrganization("Test Organization", testUserId);

    // Create test user
    const user = mockDataStore.createUser({
      email: testEmail,
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "User",
      userType: 'Facilitator',
      organizationId: org.id
    });

    // The user already has a token from createUser

    // Also create a standard test facilitator for easy testing
    const facilitator = mockDataStore.createUser({
      email: "facilitator@example.com",
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "Facilitator",
      userType: 'Facilitator',
      organizationId: org.id
    });

    // Create test subscriptions for each workflow type
    const workflowIds = mockDataStore.getAvailableWorkflows();
    const subscriptions = [];

    for (const workflowId of workflowIds) {
      const subscription = mockDataStore.createSubscription(
        user.id,
        workflowId,
        user.organizationId
      );
      subscriptions.push(subscription);
    }

    return NextResponse.json({
      message: "Test data created successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          organizationId: user.organizationId,
          token: user.token
        },
        organization: {
          id: org.id,
          name: org.name
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