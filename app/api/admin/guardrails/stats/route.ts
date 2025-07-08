import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GuardrailTrackingService } from '@/lib/services/guardrail-tracking';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    
    // Get recent violations if requested
    if (searchParams.get('recent') === 'true') {
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
      const recentViolations = await GuardrailTrackingService.getRecentViolations(limit);
      return NextResponse.json(recentViolations);
    }

    // Otherwise, get statistics
    const filters = {
      agentName: searchParams.get('agentName') || undefined,
      guardrailType: searchParams.get('guardrailType') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const stats = await GuardrailTrackingService.getGuardrailStats(filters);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching guardrail stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guardrail statistics' },
      { status: 500 }
    );
  }
}