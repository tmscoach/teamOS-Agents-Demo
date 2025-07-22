import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMockDataStore } from "@/src/lib/mock-tms-api/mock-data-store";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get mock data statistics
    const store = getMockDataStore();
    
    return NextResponse.json({
      users: store.users.size,
      organizations: store.organizations.size,
      subscriptions: store.subscriptions.size,
      workflows: store.getAvailableWorkflows().length
    });
  } catch (error) {
    console.error("Error fetching mock data status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}