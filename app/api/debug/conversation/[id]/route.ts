import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found',
        conversationId 
      }, { status: 404 });
    }

    // Count messages
    const messageCount = await prisma.message.count({
      where: { conversationId }
    });

    // Get first few messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: 5,
      orderBy: { timestamp: 'asc' }
    });

    // Get all messages for this conversation
    const allMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });

    // Get guardrail checks
    const guardrailChecks = await prisma.guardrailCheck.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        teamId: conversation.teamId,
        managerId: conversation.managerId,
        currentAgent: conversation.currentAgent,
        phase: conversation.phase,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      stats: {
        totalMessages: messageCount,
        messagesReturned: allMessages.length,
        guardrailChecks: guardrailChecks.length
      },
      messages: allMessages,
      sampleMessages: messages,
      guardrailChecks
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      error: 'Debug API error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}