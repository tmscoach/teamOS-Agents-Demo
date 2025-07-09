import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a test failed guardrail check
    const failedCheck = await prisma.guardrailCheck.create({
      data: {
        conversationId: 'test-conversation-' + Date.now(),
        agentName: 'OnboardingAgent',
        guardrailType: 'Professionalism',
        input: 'I HATE THIS STUPID SYSTEM',
        passed: false,
        severity: 'high',
        reasoning: 'Message contains excessive caps (100% uppercase)',
        result: {
          passed: false,
          reason: 'Please avoid using all caps as it can be perceived as shouting.',
          metadata: {
            capsPercentage: 100,
            messageLength: 25
          }
        },
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      message: 'Test guardrail failure created',
      check: failedCheck
    });
  } catch (error) {
    console.error('Error creating test guardrail:', error);
    return NextResponse.json(
      { error: 'Failed to create test guardrail' },
      { status: 500 }
    );
  }
}