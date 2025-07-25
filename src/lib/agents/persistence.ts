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
      organizationId?: string;
    }
  ): Promise<string> {
    const context: AgentContext = {
      teamId,
      managerId,
      transformationPhase: options?.phase || 'onboarding',
      currentAgent: options?.initialAgent || 'OnboardingAgent',
      conversationId: '', // Will be set after creation
      messageHistory: [],
      // Add organization context from metadata
      organizationId: options?.metadata?.organizationId || options?.organizationId || null,
      organizationRole: options?.metadata?.organizationRole || null,
      userRole: options?.metadata?.userRole || null,
      metadata: options?.metadata || {},
    };

    let conversation;
    // Generate a unique ID for the conversation
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      
      // Try to create with metadata field
      conversation = await this.prisma.conversation.create({
        data: {
          id: conversationId,
          teamId,
          managerId,
          currentAgent: context.currentAgent,
          phase: context.transformationPhase,
          contextData: context,
          metadata: options?.metadata || {},
          organizationId: options?.organizationId,
          updatedAt: new Date(),
        },
      });
    } catch (error: any) {
      // If metadata column doesn't exist, create without it
      if (error?.code === 'P2022' && error.message?.includes('metadata')) {
        console.warn('Metadata column not found in Conversation table, creating without it');
        conversation = await this.prisma.conversation.create({
          data: {
            id: conversationId,
            teamId,
            managerId,
            currentAgent: context.currentAgent,
            phase: context.transformationPhase,
            contextData: context,
            organizationId: options?.organizationId,
            updatedAt: new Date(),
          },
        });
      } else {
        throw error;
      }
    }

    // Update context with conversation ID
    context.conversationId = conversation.id;
    
    try {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { contextData: context },
      });
    } catch (updateError: any) {
      // If update fails due to metadata column, it's okay - the context is already in contextData
      if (updateError?.code === 'P2022' && updateError.message?.includes('metadata')) {
        console.warn('Skipping context update due to missing metadata column');
      } else {
        console.error('Failed to update conversation context:', updateError);
        // Don't throw - the conversation was created successfully
      }
    }
    
    // Note: We don't update user's lastActivity here because it would affect
    // all conversations for that user. Instead, we rely on the conversation's
    // own timestamps (createdAt/updatedAt) for activity tracking.

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
            id: event.id,
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
        Message: {
          orderBy: { timestamp: 'asc' },
        },
        AgentEvent: {
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
    context.messageHistory = conversation.Message.map((msg: any) => ({
      id: msg.id,
      role: msg.role as Message['role'],
      content: msg.content,
      agent: msg.agent || undefined,
      timestamp: msg.timestamp,
      metadata: msg.metadata as Record<string, any> | undefined,
    }));

    // Parse events
    const events = conversation.AgentEvent.map((event: any) => {
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
   * Get a conversation (alias for loadConversation)
   */
  async getConversation(conversationId: string) {
    const result = await this.loadConversation(conversationId);
    if (!result) return null;
    
    return {
      ...result.context,
      context: result.context,
      userId: result.context.managerId
    };
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      role: msg.role as Message['role'],
      content: msg.content,
      agent: msg.agent || undefined,
      timestamp: msg.timestamp,
      metadata: msg.metadata as Record<string, any> | undefined,
    }));
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

    try {
      // Try to update with metadata field
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          currentAgent: updatedContext.currentAgent,
          phase: updatedContext.transformationPhase,
          contextData: updatedContext,
          metadata: updatedContext.metadata || {},
        },
      });
    } catch (error: any) {
      // If metadata column doesn't exist, update without it
      if (error?.code === 'P2022' && error.message?.includes('metadata')) {
        console.warn('Metadata column not found in Conversation table, updating without it');
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: {
            currentAgent: updatedContext.currentAgent,
            phase: updatedContext.transformationPhase,
            contextData: updatedContext,
          },
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, message: Message): Promise<void> {
    try {
      // Try to create with metadata field
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
    } catch (error: any) {
      // If metadata column doesn't exist, create without it
      if (error?.code === 'P2022' && error.message?.includes('metadata')) {
        console.warn('Metadata column not found in Message table, creating without it');
        await this.prisma.message.create({
          data: {
            id: message.id,
            conversationId,
            role: message.role,
            content: message.content,
            agent: message.agent,
            timestamp: message.timestamp,
          },
        });
      } else {
        throw error;
      }
    }
    
    // Update conversation's updatedAt timestamp
    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
    } catch (error) {
      console.warn('Failed to update conversation timestamp:', error);
      // Don't throw - this is not critical for message creation
    }
  }

  /**
   * Add an event to a conversation
   */
  async addEvent(conversationId: string, event: AgentEvent): Promise<void> {
    await this.prisma.agentEvent.create({
      data: {
        id: event.id,
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
      organizationId?: string;
      skipOrgFilter?: boolean; // For super admin access
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
    const where: any = { teamId };
    
    // Add organization filter unless explicitly skipped (for super admin)
    if (!options?.skipOrgFilter && options?.organizationId) {
      where.organizationId = options.organizationId;
    }
    
    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        _count: {
          select: { Message: true },
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
      messageCount: conv._count.Message,
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
            Message: true,
            AgentEvent: true,
          },
        },
        AgentEvent: {
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

    const handoffs = conversation.AgentEvent.filter((e: any) => e.type === 'handoff').length;
    const toolCalls = conversation.AgentEvent.filter((e: any) => e.type === 'tool_call').length;
    const duration = Date.now() - conversation.createdAt.getTime();

    return {
      messageCount: conversation._count.Message,
      eventCount: conversation._count.AgentEvent,
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
      organizationId?: string;
      skipOrgFilter?: boolean; // For super admin access
    }
  ): Promise<string[]> {
    const where: any = {};

    if (options?.teamId) where.teamId = options.teamId;
    if (options?.managerId) where.managerId = options.managerId;
    if (options?.agent) where.currentAgent = options.agent;
    if (options?.phase) where.phase = options.phase;
    
    // Add organization filter unless explicitly skipped (for super admin)
    if (!options?.skipOrgFilter && options?.organizationId) {
      where.organizationId = options.organizationId;
    }

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