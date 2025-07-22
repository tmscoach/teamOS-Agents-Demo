import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMockDataStore, resetMockDataStore } from "@/src/lib/mock-tms-api/mock-data-store";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset mock data store
    resetMockDataStore();

    // Get new status
    const store = getMockDataStore();
    
    return NextResponse.json({
      message: "Mock data reset successfully",
      status: {
        users: store.users.size,
        organizations: store.organizations.size,
        subscriptions: store.subscriptions.size,
        workflows: store.getAvailableWorkflows().length
      }
    });
  } catch (error) {
    console.error("Error resetting mock data:", error);
    return NextResponse.json(
      { error: "Failed to reset mock data" },
      { status: 500 }
    );
  }
}