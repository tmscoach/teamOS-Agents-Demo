import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Import server-side modules dynamically
    const { mockDataStore } = await import("@/src/lib/mock-tms-api/mock-data-store");
    const { MockTMSClient } = await import("@/src/lib/mock-tms-api/mock-api-client");

    // Find the mock user
    const users = mockDataStore.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate JWT token
    const mockClient = new MockTMSClient();
    const token = mockClient.generateJWT({
      sub: user.id,
      userId: user.id,
      userType: user.userType || 'Respondent',
      organisationId: user.organizationId,
      email: user.email
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating JWT token:", error);
    return NextResponse.json(
      { error: "Failed to generate JWT token" },
      { status: 500 }
    );
  }
}