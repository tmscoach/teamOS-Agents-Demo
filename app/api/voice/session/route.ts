import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';
import { DebriefAgent } from '@/src/lib/agents/implementations/debrief-agent';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workflow state or report context from request body
    const body = await request.json();
    const { workflowState, reportContext } = body;
    
    // Load DebriefAgent config and tools if in report context mode
    let systemPrompt = '';
    let tools: any[] = [];
    
    if (reportContext) {
      try {
        // Load system prompt from config
        const debriefConfig = await AgentConfigLoader.loadConfiguration('DebriefAgent');
        if (debriefConfig?.systemPrompt) {
          systemPrompt = debriefConfig.systemPrompt;
          console.log('[Voice Session] Loaded DebriefAgent system prompt from database');
        }
        
        // Create and initialize DebriefAgent to get tools
        const agent = new DebriefAgent();
        await agent.initialize();
        
        // Convert agent tools to OpenAI Realtime format
        tools = agent.tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        }));
        
        console.log('[Voice Session] Loaded tools for debrief:', tools.map(t => t.function.name));
      } catch (error) {
        console.error('[Voice Session] Failed to load DebriefAgent config/tools:', error);
      }
    }

    // Check if we have an API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }
    
    console.log('Creating ephemeral session with API key:', apiKey.substring(0, 10) + '...');
    if (workflowState) {
      console.log('Workflow state questions:', workflowState?.questions?.length || 0);
    }
    if (reportContext) {
      console.log('Report context:', {
        reportId: reportContext.reportId,
        reportType: reportContext.reportType,
        subscriptionId: reportContext.subscriptionId
      });
    }
    
    // Create ephemeral session token with OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['audio', 'text'],  // Audio first for voice-first experience
        voice: 'alloy',
        instructions: reportContext && systemPrompt
          ? `${systemPrompt}\n\nIMPORTANT: Start the conversation immediately with a friendly greeting like "Hello! I'm here to help you understand your ${reportContext.reportType || 'TMP'} assessment results. I have your full report here. What would you like to know about your results?"`
          : reportContext 
          ? `You are OSmos, the Team Assessment Report Debrief Assistant. Start with: "Hello! I'm here to help you understand your ${reportContext.reportType || 'assessment'} report. What would you like to know about your results?"`
          : 'You are OSmos, the Team Assessment Assistant. You will receive detailed instructions when the session starts.',
        tools: tools.length > 0 ? tools : undefined,  // Add tools if available
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
          create_response: true,  // Enable automatic responses when user stops speaking
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create voice session:', error);
      return NextResponse.json(
        { error: 'Failed to create voice session' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('OpenAI session response:', JSON.stringify(data, null, 2));
    
    // The ephemeral key should be in the client_secret field
    const ephemeralKey = data.client_secret?.value || data.client_secret;
    
    if (!ephemeralKey) {
      console.error('No ephemeral key found in response:', data);
      return NextResponse.json(
        { error: 'Failed to get ephemeral key from OpenAI' },
        { status: 500 }
      );
    }
    
    // Return the ephemeral token to the client
    return NextResponse.json({
      success: true,
      session: {
        id: data.id,
        token: ephemeralKey,
        expires_at: data.expires_at,
        systemPrompt: systemPrompt || null, // Include the system prompt for client
        // Also return the full data for debugging
        debug: data
      }
    });
  } catch (error) {
    console.error('Voice session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}