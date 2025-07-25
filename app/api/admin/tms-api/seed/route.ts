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
    console.log('Seed: Current Clerk user ID:', session.userId);
    console.log('Seed: Current Clerk user email:', session.sessionClaims?.email);
    
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

    // Create a test respondent
    const testRespondent = mockDataStore.createUser({
      email: "respondent@example.com",
      password: "Welcome123!",
      firstName: "Test",
      lastName: "Respondent",
      userType: 'Respondent',
      organizationId: testOrg.id
    });

    // Also create a user entry for the current logged-in Clerk user
    // This allows the DebriefAgent to find subscriptions for the actual user
    // Get the actual email from session claims or use a default
    const currentUserEmail = String(session.sessionClaims?.email || 
                           session.sessionClaims?.primaryEmail || 
                           "rowan@teammanagementsystems.com");
    const currentUserName = String(session.sessionClaims?.name || 
                          session.sessionClaims?.firstName || 
                          session.sessionClaims?.fullName ||
                          "Test User");
    const [firstName, ...lastNameParts] = currentUserName.split(' ');
    const lastName = lastNameParts.join(' ') || 'User';
    
    const currentUser = mockDataStore.createUser({
      email: currentUserEmail,
      firstName,
      lastName,
      userType: 'Respondent',
      organizationId: testOrg.id,
      clerkUserId: session.userId
    });
    
    // Map the Clerk user ID to the mock user
    mockDataStore.clerkIdToUser.set(session.userId, currentUser.id);
    
    console.log('Seed: Created current user:', {
      id: currentUser.id,
      email: currentUser.email,
      clerkUserId: session.userId,
      sessionEmail: session.sessionClaims?.email
    });

    // Create test subscriptions with recorded IDs
    const subscriptions = [];
    
    // TMP Subscription (assigned to current user)
    const tmpSub = {
      subscriptionId: '21989',
      userId: currentUser.id,  // Changed to current user
      organizationId: testOrg.id,
      workflowId: 'tmp-workflow',
      workflowName: 'Team Management Profile',
      assessmentType: 'TMP' as const,
      status: 'completed' as const,  // Changed to completed for debrief
      completionPercentage: 100,
      assignedDate: new Date('2024-01-15'),
      completedDate: new Date('2024-01-16'),
      baseContentId: 3,
      currentPageId: 2
    };
    mockDataStore.subscriptions.set('21989', tmpSub);
    subscriptions.push(tmpSub);
    console.log('Seed: Created TMP subscription for current user', tmpSub);
    
    // QO2 Subscription (assigned to test respondent)
    const qo2Sub = {
      subscriptionId: '21983',
      userId: testRespondent.id,
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
    
    // Team Signals Subscription (assigned to test respondent)
    const teamSignalsSub = {
      subscriptionId: '21988',
      userId: testRespondent.id,
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

    // Initialize workflow states with some sample answers for testing reports
    const { workflowStateManager } = await import("@/src/lib/mock-tms-api/workflow-state-manager");
    
    // Initialize and add some answers to TMP workflow
    workflowStateManager.getOrCreateWorkflowState('21989', 'tmp-workflow');
    workflowStateManager.updateWorkflowState(
      '21989',
      2,
      [
        { questionID: 20, value: "30" },
        { questionID: 21, value: "12" },
        { questionID: 22, value: "21" },
        { questionID: 23, value: "03" },
        { questionID: 24, value: "20" }
      ]
    );

    // Initialize and add some answers to QO2 workflow
    workflowStateManager.getOrCreateWorkflowState('21983', 'qo2-workflow');
    workflowStateManager.updateWorkflowState(
      '21983',
      408,
      [
        { questionID: 100, value: "3" },
        { questionID: 101, value: "4" },
        { questionID: 102, value: "2" },
        { questionID: 103, value: "3" }
      ]
    );

    // Initialize and add some answers to Team Signals workflow
    workflowStateManager.getOrCreateWorkflowState('21988', 'team-signals-workflow');
    workflowStateManager.updateWorkflowState(
      '21988',
      97,
      [
        { questionID: 200, value: "5" },
        { questionID: 201, value: "4" },
        { questionID: 202, value: "3" },
        { questionID: 203, value: "4" }
      ]
    );

    return NextResponse.json({
      message: "Test data created successfully",
      data: {
        facilitator: {
          id: testUser.id,
          email: testUser.email,
          organizationId: testUser.organizationId,
          token: facilitatorToken
        },
        respondent: {
          id: testRespondent.id,
          email: testRespondent.email,
          organizationId: testRespondent.organizationId,
          password: "Welcome123!" // Include for easy testing
        },
        currentUser: {
          id: currentUser.id,
          email: currentUser.email,
          organizationId: currentUser.organizationId,
          clerkUserId: session.userId,
          hasCompletedTMP: true
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
          status: sub.status,
          assignedTo: sub.userId === currentUser.id ? currentUser.email : 
                     sub.userId === testRespondent.id ? testRespondent.email : 
                     "unknown"
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