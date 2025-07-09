import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

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

    // TODO: Add proper admin role check
    // For now, we'll allow all authenticated users

    const { id: conversationId } = await params;

    // Fetch conversation with all related data
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
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

    // Fetch team and manager details
    const [team, manager] = await Promise.all([
      prisma.team.findUnique({ where: { id: conversation.teamId } }),
      prisma.user.findUnique({ where: { id: conversation.managerId } })
    ]);

    // Extract metadata from contextData
    const contextData = conversation.contextData as any;
    const metadata = contextData?.metadata || {};

    // Transform the data
    const transformedConversation = {
      id: conversation.id,
      managerId: conversation.managerId,
      managerName: manager?.name || 'Unknown',
      teamId: conversation.teamId,
      teamName: team?.name || 'Unknown Team',
      currentAgent: conversation.currentAgent,
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        agent: msg.agent
      })),
      metadata,
      events: conversation.events.map(event => ({
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        agent: event.agent,
        data: event.metadata
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