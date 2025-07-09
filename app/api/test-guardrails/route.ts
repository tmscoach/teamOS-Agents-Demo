import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Test guardrail checks table
    const guardrailCheckCount = await prisma.guardrailCheck.count();
    const recentChecks = await prisma.guardrailCheck.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });
    
    // Test agent events with guardrail type
    const guardrailEventCount = await prisma.agentEvent.count({
      where: { type: 'guardrail' }
    });
    
    return NextResponse.json({
      success: true,
      database: "connected",
      guardrailChecks: {
        total: guardrailCheckCount,
        recent: recentChecks.map(check => ({
          id: check.id,
          guardrailType: check.guardrailType,
          passed: check.passed,
          input: check.input,
          timestamp: check.timestamp
        }))
      },
      guardrailEvents: {
        total: guardrailEventCount
      }
    });
  } catch (error: any) {
    console.error("Guardrail test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      database: "connection failed",
    });
  }
}