import { NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { DebriefAgent } from '@/src/lib/agents/implementations/debrief-agent';

/**
 * API endpoint to fetch DebriefAgent tools configuration
 * This runs server-side so it's safe to import DebriefAgent here
 */
export async function GET() {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create and initialize the DebriefAgent
    const agent = new DebriefAgent();
    await agent.initialize(); // This loads config from database
    
    // Get the tools and convert them to a serializable format
    const tools = agent.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
    
    console.log('[API: debrief/tools] Returning tools:', tools.map(t => t.name));
    
    return NextResponse.json({ 
      success: true,
      tools 
    });
  } catch (error) {
    console.error('[API: debrief/tools] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch agent tools' 
      },
      { status: 500 }
    );
  }
}