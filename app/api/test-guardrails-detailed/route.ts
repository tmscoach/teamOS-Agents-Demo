import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get all guardrail checks
    const allChecks = await prisma.guardrailCheck.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100 // Limit to last 100
    });
    
    // Count stats
    const total = await prisma.guardrailCheck.count();
    const failed = await prisma.guardrailCheck.count({
      where: { passed: false }
    });
    const passed = await prisma.guardrailCheck.count({
      where: { passed: true }
    });
    
    // Get breakdown by type
    const byType = await prisma.guardrailCheck.groupBy({
      by: ['guardrailType', 'passed'],
      _count: true
    });
    
    return NextResponse.json({
      success: true,
      database: "connected",
      guardrailChecks: {
        total,
        failed,
        passed,
        all: allChecks,
        byType: byType.map(item => ({
          type: item.guardrailType,
          passed: item.passed,
          count: item._count
        }))
      }
    });
  } catch (error: any) {
    console.error("Guardrail detailed test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      database: "connection failed",
    });
  }
}