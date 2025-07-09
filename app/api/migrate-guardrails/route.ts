import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST() {
  try {
    // Get all guardrail events
    const guardrailEvents = await prisma.agentEvent.findMany({
      where: { type: 'guardrail' },
      orderBy: { timestamp: 'asc' }
    });

    console.log(`Found ${guardrailEvents.length} guardrail events to migrate`);

    let migrated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const event of guardrailEvents) {
      try {
        const eventData = JSON.parse(event.content as string);
        
        // Check if already migrated
        const existing = await prisma.guardrailCheck.findFirst({
          where: {
            conversationId: event.conversationId,
            timestamp: event.timestamp,
            guardrailType: eventData.guardrailName || 'unknown'
          }
        });

        if (existing) {
          console.log(`Skipping already migrated event ${event.id}`);
          continue;
        }

        // Extract guardrail data
        const guardrailResult = eventData.result || {};
        
        // Create GuardrailCheck record
        await prisma.guardrailCheck.create({
          data: {
            conversationId: event.conversationId,
            agentName: eventData.agent || event.agent,
            guardrailType: eventData.guardrailName || 'unknown',
            input: eventData.input || '',
            passed: guardrailResult.passed || false,
            severity: guardrailResult.passed === false ? 'high' : null,
            reasoning: guardrailResult.reason || JSON.stringify(guardrailResult),
            timestamp: event.timestamp
          }
        });

        migrated++;
      } catch (error: any) {
        console.error(`Error migrating event ${event.id}:`, error);
        failed++;
        errors.push(`Event ${event.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        total: guardrailEvents.length,
        migrated,
        failed,
        errors: errors.slice(0, 10) // Only show first 10 errors
      }
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}