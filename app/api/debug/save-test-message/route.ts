import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ConversationStore } from '@/src/lib/agents/persistence';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, message } = await req.json();
    
    if (!conversationId || !message) {
      return NextResponse.json({ 
        error: 'conversationId and message are required' 
      }, { status: 400 });
    }

    // Create a test message
    const testMessage = {
      id: `test-${Date.now()}`,
      conversationId,
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    // Save directly to database
    const savedMessage = await prisma.message.create({
      data: {
        conversationId,
        role: testMessage.role,
        content: testMessage.content,
        timestamp: testMessage.timestamp
      }
    });

    // Also add an assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: 'I understand you\'re frustrated. Let me help you get started with the system.',
        agent: 'OnboardingAgent',
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      userMessage: savedMessage,
      assistantMessage
    });
  } catch (error) {
    console.error('Debug save message error:', error);
    return NextResponse.json({
      error: 'Failed to save message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}