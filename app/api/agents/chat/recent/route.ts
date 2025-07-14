/**
 * API route for retrieving the user's most recent conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConversationStore } from '@/src/lib/agents';
import { prisma } from '@/lib/db/prisma';

const conversationStore = new ConversationStore(prisma);

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const agentName = searchParams.get('agent') || 'OnboardingAgent';

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the most recent conversation for this user and agent
    const recentConversation = await prisma.conversation.findFirst({
      where: {
        managerId: dbUser.id,
        currentAgent: agentName
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true }
    });

    if (!recentConversation) {
      return NextResponse.json({
        conversationId: null,
        messages: []
      });
    }

    // Load the conversation details
    const conversationData = await conversationStore.loadConversation(recentConversation.id);
    
    if (!conversationData) {
      return NextResponse.json({
        conversationId: null,
        messages: []
      });
    }

    // Return conversation data
    return NextResponse.json({
      conversationId: recentConversation.id,
      currentAgent: conversationData.context.currentAgent,
      phase: conversationData.context.transformationPhase,
      messages: conversationData.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        agent: msg.agent,
        timestamp: msg.timestamp,
        metadata: msg.metadata
      })),
      metadata: conversationData.context.metadata
    });
  } catch (error) {
    console.error('Recent conversation API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}