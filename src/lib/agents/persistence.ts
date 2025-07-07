/**
 * Conversation Store for persisting agent conversations
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  AgentContext,
  Message,
  AgentEvent,
  TransformationPhase,
} from './types';

export class ConversationStore {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    teamId: string,
    managerId: string,
    options?: {
      initialAgent?: string;
      phase?: TransformationPhase;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const context: AgentContext = {
      teamId,
      managerId,
      transformationPhase: options?.phase || 'onboarding',
      currentAgent: options?.initialAgent || 'OnboardingAgent',
      conversationId: '', // Will be set after creation
      messageHistory: [],
      metadata: options?.metadata || {},
    };

    const conversation = await this.prisma.conversation.create({
      data: {
        teamId,
        managerId,
        currentAgent: context.currentAgent,
        phase: context.transformationPhase,
        contextData: context,
      },
    });

    // Update context with conversation ID
    context.conversationId = conversation.id;
    
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { contextData: context },
    });

    return conversation.id;
  }

  /**
   * Save or update a conversation
   */
  async saveConversation(
    conversationId: string,
    context: AgentContext,
    messages: Message[],
    events: AgentEvent[]
  ): Promise<void> {
    // Use a transaction to ensure consistency
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update conversation context
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          currentAgent: context.currentAgent,
          phase: context.transformationPhase,
          contextData: context,
        },
      });

      // Save new messages
      const existingMessageCount = await tx.message.count({
        where: { conversationId },
      });

      const newMessages = messages.slice(existingMessageCount);
      
      if (newMessages.length > 0) {
        await tx.message.createMany({
          data: newMessages.map(msg => ({
            id: msg.id,
            conversationId,
            role: msg.role,
            content: msg.content,
            agent: msg.agent,
            metadata: msg.metadata,
            timestamp: msg.timestamp,
          })),
        });
      }

      // Save new events
      if (events.length > 0) {
        await tx.agentEvent.createMany({
          data: events.map(event => ({
            conversationId,
            type: event.type,
            agent: event.agent,
            content: JSON.stringify(event),
            metadata: {
              timestamp: event.timestamp,
              id: event.id,
            },
            timestamp: event.timestamp,
          })),
        });
      }
    });
  }

  /**
   * Load a conversation by ID
   */
  async loadConversation(conversationId: string): Promise<{
    context: AgentContext;
    messages: Message[];
    events: AgentEvent[];
  } | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    // Reconstruct context
    const context = conversation.contextData as AgentContext;
    
    // Ensure messageHistory is up to date
    context.messageHistory = conversation.messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role as Message['role'],
      content: msg.content,
      agent: msg.agent || undefined,
      timestamp: msg.timestamp,
      metadata: msg.metadata as Record<string, any> | undefined,
    }));

    // Parse events
    const events = conversation.events.map((event: any) => {
      const parsedEvent = JSON.parse(event.content) as AgentEvent;
      return parsedEvent;
    });

    return {
      context,
      messages: context.messageHistory,
      events,
    };
  }

  /**
   * Update conversation context
   */
  async updateContext(
    conversationId: string,
    updates: Partial<AgentContext>
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const currentContext = conversation.contextData as AgentContext;
    const updatedContext: AgentContext = {
      ...currentContext,
      ...updates,
      // Preserve immutable fields
      conversationId: currentContext.conversationId,
      teamId: currentContext.teamId,
      managerId: currentContext.managerId,
    };

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        currentAgent: updatedContext.currentAgent,
        phase: updatedContext.transformationPhase,
        contextData: updatedContext,
      },
    });
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, message: Message): Promise<void> {
    await this.prisma.message.create({
      data: {
        id: message.id,
        conversationId,
        role: message.role,
        content: message.content,
        agent: message.agent,
        metadata: message.metadata,
        timestamp: message.timestamp,
      },
    });
  }

  /**
   * Add an event to a conversation
   */
  async addEvent(conversationId: string, event: AgentEvent): Promise<void> {
    await this.prisma.agentEvent.create({
      data: {
        conversationId,
        type: event.type,
        agent: event.agent,
        content: JSON.stringify(event),
        metadata: {
          timestamp: event.timestamp,
          id: event.id,
        },
        timestamp: event.timestamp,
      },
    });
  }

  /**
   * Get conversation history for a team
   */
  async getTeamConversations(
    teamId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<Array<{
    id: string;
    managerId: string;
    currentAgent: string;
    phase: string;
    createdAt: Date;
    updatedAt: Date;
    messageCount: number;
  }>> {
    const conversations = await this.prisma.conversation.findMany({
      where: { teamId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return conversations.map((conv: any) => ({
      id: conv.id,
      managerId: conv.managerId,
      currentAgent: conv.currentAgent,
      phase: conv.phase,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
    }));
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: string): Promise<{
    messageCount: number;
    eventCount: number;
    agentHandoffs: number;
    toolCalls: number;
    duration: number;
  }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        _count: {
          select: {
            messages: true,
            events: true,
          },
        },
        events: {
          where: {
            type: { in: ['handoff', 'tool_call'] },
          },
          select: { type: true },
        },
      },
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const handoffs = conversation.events.filter((e: any) => e.type === 'handoff').length;
    const toolCalls = conversation.events.filter((e: any) => e.type === 'tool_call').length;
    const duration = Date.now() - conversation.createdAt.getTime();

    return {
      messageCount: conversation._count.messages,
      eventCount: conversation._count.events,
      agentHandoffs: handoffs,
      toolCalls,
      duration,
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Search conversations
   */
  async searchConversations(
    query: string,
    options?: {
      teamId?: string;
      managerId?: string;
      agent?: string;
      phase?: string;
      limit?: number;
    }
  ): Promise<string[]> {
    const where: any = {};

    if (options?.teamId) where.teamId = options.teamId;
    if (options?.managerId) where.managerId = options.managerId;
    if (options?.agent) where.currentAgent = options.agent;
    if (options?.phase) where.phase = options.phase;

    // Search in messages
    const messages = await this.prisma.message.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
        conversation: where,
      },
      select: { conversationId: true },
      distinct: ['conversationId'],
      take: options?.limit,
    });

    return messages.map((m: any) => m.conversationId);
  }

  /**
   * Cleanup old conversations
   */
  async cleanupOldConversations(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.conversation.deleteMany({
      where: {
        updatedAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}