import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GuardrailTrackingService } from '@/src/lib/services/guardrail-tracking';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');

    // If conversationId is provided, get guardrails for that conversation
    if (conversationId) {
      const guardrails = await GuardrailTrackingService.getConversationGuardrails(conversationId);
      return NextResponse.json(guardrails);
    }

    // Otherwise, search guardrails based on filters
    const params = {
      query: searchParams.get('query') || undefined,
      agentName: searchParams.get('agentName') || undefined,
      guardrailType: searchParams.get('guardrailType') || undefined,
      passed: searchParams.has('passed') ? searchParams.get('passed') === 'true' : undefined,
      severity: searchParams.get('severity') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const results = await GuardrailTrackingService.searchGuardrailChecks(params);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching guardrails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guardrails' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    if (!body.conversationId || !body.agentName || !body.guardrailType || !body.input || !body.result) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const guardrailCheck = await GuardrailTrackingService.trackGuardrailCheck({
      conversationId: body.conversationId,
      agentName: body.agentName,
      guardrailType: body.guardrailType,
      input: body.input,
      result: body.result,
    });

    return NextResponse.json(guardrailCheck);
  } catch (error) {
    console.error('Error tracking guardrail check:', error);
    return NextResponse.json(
      { error: 'Failed to track guardrail check' },
      { status: 500 }
    );
  }
}