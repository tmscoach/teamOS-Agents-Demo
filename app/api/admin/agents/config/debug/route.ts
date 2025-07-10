import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // First, just try to parse the request body
    const body = await req.json();
    console.log('Received body keys:', Object.keys(body));
    console.log('Agent name:', body.agentName);
    console.log('System prompt length:', body.systemPrompt?.length);
    
    // Try to import the service
    try {
      const { AgentConfigurationService } = await import('@/src/lib/services/agent-configuration');
      console.log('AgentConfigurationService imported successfully');
    } catch (importError) {
      console.error('Failed to import AgentConfigurationService:', importError);
      return NextResponse.json({ 
        error: 'Import failed', 
        details: importError instanceof Error ? importError.message : 'Unknown import error' 
      }, { status: 500 });
    }
    
    // Try to import prisma
    try {
      const prisma = (await import('@/lib/db')).default;
      console.log('Prisma imported successfully');
      
      // Test database connection
      await prisma.$connect();
      console.log('Database connected');
      
      // Try to query
      const count = await prisma.agentConfiguration.count();
      console.log('Agent configuration count:', count);
      
      await prisma.$disconnect();
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error', 
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        code: (dbError as any).code 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debug endpoint working',
      receivedData: {
        agentName: body.agentName,
        systemPromptLength: body.systemPrompt?.length,
        hasFlowConfig: !!body.flowConfig,
        hasExtractionRules: !!body.extractionRules,
        hasGuardrailConfig: !!body.guardrailConfig
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name
    }, { status: 500 });
  }
}