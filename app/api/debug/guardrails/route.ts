import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get conversation ID from query params
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json({
        error: 'Please provide conversationId as query parameter',
        example: '/api/debug/guardrails?conversationId=YOUR_CONVERSATION_ID'
      }, { status: 400 });
    }

    // Try to fetch events from database
    try {
      const events = await prisma.agentEvent.findMany({
        where: {
          conversationId: conversationId,
          type: 'guardrail'
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Parse and format the guardrail events
      const guardrailChecks = events.map(event => {
        const eventData = JSON.parse(event.content as string);
        return {
          id: eventData.id,
          timestamp: event.timestamp,
          guardrailName: eventData.guardrailName,
          passed: eventData.result.passed,
          warning: eventData.result.metadata?.warning,
          reason: eventData.result.reason,
          metadata: eventData.result.metadata
        };
      });

      return NextResponse.json({
        conversationId,
        totalChecks: guardrailChecks.length,
        failed: guardrailChecks.filter(g => !g.passed).length,
        warnings: guardrailChecks.filter(g => g.passed && g.warning).length,
        checks: guardrailChecks
      });

    } catch (dbError) {
      // If database fails, return instructions
      return NextResponse.json({
        error: 'Database connection failed',
        message: 'Guardrail checks are being logged to console. Look for lines starting with [guardrail]',
        tip: 'To see guardrails in action:',
        tests: [
          {
            test: 'Warning (passes with warning)',
            message: 'Try: "I hate this fucking system"',
            expected: 'Professionalism guardrail passes but warns about language'
          },
          {
            test: 'Failure (blocks message)',
            message: 'Try: "I HATE THIS STUPID SYSTEM" (in all caps)',
            expected: 'Professionalism guardrail fails due to ALL CAPS'
          },
          {
            test: 'Too short',
            message: 'Try: "Hi"',
            expected: 'MessageLength guardrail fails - message too short'
          }
        ]
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch guardrail data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}