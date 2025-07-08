/**
 * Context Manager for handling agent conversation contexts
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentContext, Message, TransformationPhase } from './types';

export interface CreateContextOptions {
  teamId: string;
  managerId: string;
  initialAgent?: string;
  transformationPhase?: TransformationPhase;
  metadata?: Record<string, any>;
}

export class ContextManager {
  private contexts: Map<string, AgentContext> = new Map();

  /**
   * Create a new conversation context
   */
  async createContext(options: CreateContextOptions): Promise<AgentContext> {
    const conversationId = uuidv4();
    
    const context: AgentContext = {
      teamId: options.teamId,
      managerId: options.managerId,
      transformationPhase: options.transformationPhase || 'onboarding',
      currentAgent: options.initialAgent || 'OnboardingAgent',
      conversationId,
      messageHistory: [],
      metadata: options.metadata || {},
    };

    this.contexts.set(conversationId, context);
    
    // TODO: Persist to database when persistence layer is ready
    
    return context;
  }

  /**
   * Update an existing context
   */
  async updateContext(
    conversationId: string,
    updates: Partial<AgentContext>
  ): Promise<AgentContext> {
    const context = this.contexts.get(conversationId);
    
    if (!context) {
      throw new Error(`Context not found for conversation: ${conversationId}`);
    }

    // Create updated context
    const updatedContext: AgentContext = {
      ...context,
      ...updates,
      // Ensure certain fields are not overwritten incorrectly
      conversationId: context.conversationId,
      teamId: context.teamId,
      managerId: context.managerId,
    };

    // Update message history if new messages are provided
    if (updates.messageHistory) {
      updatedContext.messageHistory = [
        ...context.messageHistory,
        ...updates.messageHistory.slice(context.messageHistory.length),
      ];
    }

    // Merge metadata if provided
    if (updates.metadata) {
      updatedContext.metadata = {
        ...context.metadata,
        ...updates.metadata,
      };
    }

    this.contexts.set(conversationId, updatedContext);
    
    // TODO: Persist to database when persistence layer is ready
    
    return updatedContext;
  }

  /**
   * Get a context by conversation ID
   */
  async getContext(conversationId: string): Promise<AgentContext | null> {
    // First check in-memory cache
    const context = this.contexts.get(conversationId);
    
    if (context) {
      return context;
    }

    // TODO: Load from database when persistence layer is ready
    
    return null;
  }

  /**
   * Add a message to the conversation history
   */
  async addMessage(
    conversationId: string,
    message: Message
  ): Promise<void> {
    const context = await this.getContext(conversationId);
    
    if (!context) {
      throw new Error(`Context not found for conversation: ${conversationId}`);
    }

    const updatedHistory = [...context.messageHistory, message];
    
    await this.updateContext(conversationId, {
      messageHistory: updatedHistory,
    });
  }

  /**
   * Update the current agent
   */
  async updateCurrentAgent(
    conversationId: string,
    agentName: string
  ): Promise<void> {
    await this.updateContext(conversationId, {
      currentAgent: agentName,
    });
  }

  /**
   * Update transformation phase
   */
  async updatePhase(
    conversationId: string,
    phase: TransformationPhase
  ): Promise<void> {
    await this.updateContext(conversationId, {
      transformationPhase: phase,
    });
  }

  /**
   * Update assessment results
   */
  async updateAssessmentResults(
    conversationId: string,
    assessmentType: 'tmp' | 'qo2' | 'wowv' | 'llp',
    results: any
  ): Promise<void> {
    const context = await this.getContext(conversationId);
    
    if (!context) {
      throw new Error(`Context not found for conversation: ${conversationId}`);
    }

    const assessmentResults = context.assessmentResults || {};
    assessmentResults[assessmentType] = results;

    await this.updateContext(conversationId, { assessmentResults });
  }

  /**
   * Update metadata
   */
  async updateMetadata(
    conversationId: string,
    key: string,
    value: any
  ): Promise<void> {
    const context = await this.getContext(conversationId);
    
    if (!context) {
      throw new Error(`Context not found for conversation: ${conversationId}`);
    }

    const metadata = { ...context.metadata, [key]: value };
    
    await this.updateContext(conversationId, { metadata });
  }

  /**
   * Set a context directly (useful for loading from persistence)
   */
  async setContext(conversationId: string, context: AgentContext): Promise<void> {
    this.contexts.set(conversationId, context);
  }

  /**
   * Clear a context from memory
   */
  async clearContext(conversationId: string): Promise<void> {
    this.contexts.delete(conversationId);
  }

  /**
   * Get all active contexts (for debugging/monitoring)
   */
  getActiveContexts(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Clone a context (useful for simulations or testing)
   */
  async cloneContext(
    sourceConversationId: string,
    options?: { newConversationId?: string }
  ): Promise<AgentContext> {
    const sourceContext = await this.getContext(sourceConversationId);
    
    if (!sourceContext) {
      throw new Error(`Source context not found: ${sourceConversationId}`);
    }

    const newConversationId = options?.newConversationId || uuidv4();
    
    const clonedContext: AgentContext = {
      ...sourceContext,
      conversationId: newConversationId,
      messageHistory: [...sourceContext.messageHistory],
      metadata: JSON.parse(JSON.stringify(sourceContext.metadata)),
      assessmentResults: sourceContext.assessmentResults 
        ? JSON.parse(JSON.stringify(sourceContext.assessmentResults))
        : undefined,
    };

    this.contexts.set(newConversationId, clonedContext);
    
    return clonedContext;
  }
}