import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { agentName, systemPrompt, flowConfig, extractionRules, guardrailConfig } = body;

    if (!agentName) {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    // Save to a temporary JSON file
    const configDir = path.join(process.cwd(), 'temp-configs');
    await fs.mkdir(configDir, { recursive: true });
    
    const filePath = path.join(configDir, `${agentName}.json`);
    const config = {
      agentName,
      systemPrompt,
      flowConfig: flowConfig || {},
      extractionRules: extractionRules || {},
      guardrailConfig: guardrailConfig || {},
      updatedBy: userId,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(config, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: `Configuration saved to temp-configs/${agentName}.json`,
      config 
    });
  } catch (error) {
    console.error('Error saving temp config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}