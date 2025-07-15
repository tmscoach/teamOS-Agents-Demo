import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get agent name from query params
    const searchParams = req.nextUrl.searchParams;
    const agentName = searchParams.get('agent');
    
    if (!agentName) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    // Get extraction rules with metadata
    const rules = await AgentConfigurationService.getExtractionRulesWithMetadata(agentName);
    
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error('Failed to fetch extraction rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extraction rules' },
      { status: 500 }
    );
  }
}