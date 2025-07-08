import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // TODO: Add proper admin role check
    // For now, we'll allow all authenticated users

    const conversationId = params.id;

    // Fetch conversation with all related data
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        team: true,
        manager: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        events: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedConversation = {
      id: conversation.id,
      managerId: conversation.managerId,
      managerName: conversation.manager.name || 'Unknown',
      teamId: conversation.teamId,
      teamName: conversation.team.name,
      currentAgent: conversation.currentAgent,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        agent: msg.agent
      })),
      metadata: conversation.metadata,
      events: conversation.events.map(event => ({
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        agent: event.agent,
        data: event.data
      }))
    };

    return NextResponse.json(transformedConversation);
  } catch (error) {
    console.error('Admin conversation detail API error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}