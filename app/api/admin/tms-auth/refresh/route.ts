import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { MockTMSAPIClient } from "@/src/lib/mock-tms-api/mock-api-client";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create mock API client
    const mockApi = new MockTMSAPIClient();

    // First, try to login with existing test account
    let loginResponse;
    const testEmail = `test_${session.userId}@example.com`;
    const testPassword = "TestPassword123!";

    try {
      loginResponse = await mockApi.request({
        method: "POST",
        endpoint: "/api/v1/auth/login",
        data: {
          Email: testEmail,
          Password: testPassword
        }
      });
    } catch (error) {
      // If login fails, create a new account
      const signupResponse = await mockApi.request({
        method: "POST",
        endpoint: "/api/v1/auth/signup",
        data: {
          Email: testEmail,
          Password: testPassword,
          FirstName: user.firstName || "Test",
          LastName: user.lastName || "User",
          OrganizationName: "Test Organization"
        }
      });

      // Now login with the new account
      loginResponse = await mockApi.request({
        method: "POST",
        endpoint: "/api/v1/auth/login",
        data: {
          Email: testEmail,
          Password: testPassword
        }
      });
    }

    if (!loginResponse || !(loginResponse as any).token) {
      return NextResponse.json(
        { error: "Failed to generate JWT token" },
        { status: 500 }
      );
    }

    const { token, userId: tmsUserId, organizationId: tmsOrgId } = loginResponse as any;

    // Ensure user exists in database first
    await prisma.user.upsert({
      where: { clerkId: session.userId },
      update: {},
      create: {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        clerkId: session.userId,
        email: user.emailAddresses[0]?.emailAddress || testEmail,
        name: `${user.firstName || 'Test'} ${user.lastName || 'User'}`,
        role: 'MANAGER',
        journeyPhase: 'ONBOARDING',
        journeyStatus: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    // Get the database user
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: session.userId }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to create or find user" },
        { status: 500 }
      );
    }

    // Store the JWT token in database
    await prisma.tMSAuthToken.upsert({
      where: { userId: dbUser.id },
      update: {
        tmsJwtToken: token,
        tmsUserId: tmsUserId,
        tmsOrgId: tmsOrgId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        updatedAt: new Date()
      },
      create: {
        id: `tmsauth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: dbUser.id,
        tmsJwtToken: token,
        tmsUserId: tmsUserId,
        tmsOrgId: tmsOrgId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      token,
      tmsUserId: tmsUserId,
      tmsOrgId: tmsOrgId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    console.error("Error refreshing JWT token:", error);
    return NextResponse.json(
      { error: "Failed to refresh JWT token" },
      { status: 500 }
    );
  }
}