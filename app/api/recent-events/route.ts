import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get the most recent events
    const recentEvents = await prisma.agentEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20
    });
    
    // Parse guardrail events
    const guardrailEvents = recentEvents
      .filter(e => e.type === 'guardrail')
      .map(event => {
        const content = JSON.parse(event.content as string);
        return {
          id: event.id,
          conversationId: event.conversationId,
          timestamp: event.timestamp,
          guardrailName: content.guardrailName,
          passed: content.result?.passed,
          reason: content.result?.reason,
          metadata: content.result?.metadata
        };
      });
    
    // Get recent messages too
    const recentMessages = await prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        role: true,
        timestamp: true,
        conversationId: true
      }
    });
    
    return NextResponse.json({
      success: true,
      totalEvents: recentEvents.length,
      eventTypes: recentEvents.map(e => ({ type: e.type, timestamp: e.timestamp })),
      guardrailEvents,
      recentMessages,
      mostRecentEventTime: recentEvents[0]?.timestamp || null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}