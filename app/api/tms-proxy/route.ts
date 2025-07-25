import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { createTMSTool } from '@/src/lib/agents/tools/tms-tool-factory';
import { AgentContext } from '@/src/lib/agents/types';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tool, parameters } = body;

    if (!tool || !parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, parameters' },
        { status: 400 }
      );
    }

    // Create the TMS tool
    const tmsTool = createTMSTool(tool);
    
    if (!tmsTool) {
      return NextResponse.json(
        { error: `Unknown tool: ${tool}` },
        { status: 400 }
      );
    }

    // Create a minimal agent context for the tool
    const context: AgentContext = {
      managerId: user.id,
      conversationId: 'tms-proxy-' + Date.now(),
      messageHistory: []
    };

    // Execute the tool
    const result = await tmsTool.execute(parameters, context);
    
    return NextResponse.json({
      success: result.success,
      result: result.output?.raw || result.output,
      formatted: result.output?.formatted,
      error: result.error,
      tool: tool
    });
  } catch (error) {
    console.error('TMS proxy error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error
      },
      { status: 500 }
    );
  }
}