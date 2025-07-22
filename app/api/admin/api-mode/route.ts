import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { apiModeManager } from "@/src/lib/mock-tms-api/api-mode-config";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mode, liveApiUrl, mockDelay, enableLogging } = body;

    // Update configuration
    apiModeManager.updateConfig({
      mode,
      liveApiUrl,
      mockDelay,
      enableLogging
    });

    // In a real implementation, you might want to persist this to a database
    // For now, it's just in-memory configuration

    return NextResponse.json({
      success: true,
      config: apiModeManager.getConfig()
    });
  } catch (error) {
    console.error("Error updating API mode:", error);
    return NextResponse.json(
      { error: "Failed to update API mode configuration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      config: apiModeManager.getConfig()
    });
  } catch (error) {
    console.error("Error getting API mode:", error);
    return NextResponse.json(
      { error: "Failed to get API mode configuration" },
      { status: 500 }
    );
  }
}