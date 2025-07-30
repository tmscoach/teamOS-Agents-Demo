import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/src/lib/auth/clerk-dev-wrapper';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create ephemeral session token with OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['text', 'audio'],
        instructions: 'You are OSmos, the Team Assessment Assistant helping users complete questionnaires through voice interaction.',
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
    
    // Return the ephemeral token to the client
    return NextResponse.json({
      success: true,
      session: {
        id: data.id,
        token: data.client_secret?.value || data.client_secret,
        expires_at: data.expires_at,
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