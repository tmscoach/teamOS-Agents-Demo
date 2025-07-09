import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get a sample of guardrail events
    const events = await prisma.agentEvent.findMany({
      where: { 
        type: 'guardrail',
        content: {
          contains: 'Professionalism'
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });
    
    // Parse and show the actual content
    const parsedEvents = events.map(event => {
      const content = JSON.parse(event.content as string);
      return {
        id: event.id,
        conversationId: event.conversationId,
        timestamp: event.timestamp,
        guardrailName: content.guardrailName,
        result: content.result,
        input: content.input
      };
    });
    
    // Also check for any with passed: false
    const failedEvents = await prisma.agentEvent.findMany({
      where: { 
        type: 'guardrail',
        content: {
          contains: '"passed":false'
        }
      },
      take: 10
    });
    
    const parsedFailedEvents = failedEvents.map(event => {
      const content = JSON.parse(event.content as string);
      return {
        id: event.id,
        guardrailName: content.guardrailName,
        result: content.result,
        timestamp: event.timestamp
      };
    });
    
    return NextResponse.json({
      success: true,
      professionalismEvents: parsedEvents,
      failedEvents: parsedFailedEvents,
      totalFailedCount: failedEvents.length
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}