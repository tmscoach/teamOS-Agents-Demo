/**
 * API route for retrieving a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ConversationStore } from '@/src/lib/agents';
import { prisma } from '@/lib/db/prisma';

const conversationStore = new ConversationStore(prisma);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;

    // Load conversation
    const conversationData = await conversationStore.loadConversation(conversationId);
    
    if (!conversationData) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get user from database to verify access
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      include: { managedTeams: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { teamId: true, managerId: true }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Check if user is the manager or part of the team
    const hasAccess = conversation.managerId === dbUser.id || 
                     dbUser.managedTeams.some(team => team.id === conversation.teamId) ||
                     dbUser.teamId === conversation.teamId;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return conversation data
    return NextResponse.json({
      id: conversationData.context.conversationId,
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
      events: conversationData.events,
      metadata: conversationData.context.metadata
    });
  } catch (error) {
    console.error('Conversation GET API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}