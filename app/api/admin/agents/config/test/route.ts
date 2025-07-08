import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.agentName) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    const testConfig = {
      prompts: body.prompts,
      flowConfig: body.flowConfig,
      extractionRules: body.extractionRules,
    };

    const testResults = await AgentConfigurationService.testConfiguration(
      body.agentName,
      testConfig
    );

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Error testing agent configuration:', error);
    return NextResponse.json(
      { error: 'Failed to test agent configuration' },
      { status: 500 }
    );
  }
}