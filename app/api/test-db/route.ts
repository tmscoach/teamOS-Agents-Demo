import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const documentCount = await prisma.document.count();
    const conversationCount = await prisma.conversation.count();
    
    return NextResponse.json({
      success: true,
      database: "connected",
      counts: {
        documents: documentCount,
        conversations: conversationCount,
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      database: "connection failed",
    });
  }
}