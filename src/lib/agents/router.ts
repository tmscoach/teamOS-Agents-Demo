/**
 * Agent Router for managing message routing between agents
 */

import { EventEmitter } from 'events';
import { Agent } from './base';
import {
  AgentContext,
  AgentResponse,
  AgentEvent,
  HandoffEvent,
  Message,
} from './types';
import { ContextManager } from './context';

export interface RouterOptions {
  contextManager?: ContextManager;
  enableEventLogging?: boolean;
}

export class AgentRouter extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private contextManager: ContextManager;
  private enableEventLogging: boolean;

  constructor(options: RouterOptions = {}) {
    super();
    this.contextManager = options.contextManager || new ContextManager();
    this.enableEventLogging = options.enableEventLogging ?? true;
  }

  /**
   * Register an agent with the router
   */
  registerAgent(agent: Agent): void {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent already registered: ${agent.name}`);
    }

    this.agents.set(agent.name, agent);
    this.emit('agent:registered', { agentName: agent.name });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentName: string): void {
    if (!this.agents.has(agentName)) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    this.agents.delete(agentName);
    this.emit('agent:unregistered', { agentName });
  }

  /**
   * Get a registered agent by name
   */
  getAgent(agentName: string): Agent | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Get all registered agents
   */
  getAgents(): Map<string, Agent> {
    return new Map(this.agents);
  }

  /**
   * Route a message to the appropriate agent
   */
  async routeMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    try {
      // Get the current agent
      const currentAgent = this.agents.get(context.currentAgent);
      
      if (!currentAgent) {
        throw new Error(`Agent not found: ${context.currentAgent}`);
      }

      // Add user message to context
      const userMessage: Message = {
        id: this.generateId(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      await this.contextManager.addMessage(context.conversationId, userMessage);

      // Process the message with the current agent
      let response: AgentResponse;
      this.emit('message:processing', {
        conversationId: context.conversationId,
        agent: currentAgent.name,
        message,
      });

      response = await currentAgent.processMessage(message, context);

      // Log events if enabled
      if (this.enableEventLogging) {
        this.logEvents(response.events);
      }

      // Handle handoff if requested
      if (response.handoff) {
        response = await this.handleHandoff(response, context);
      }

      // Update context with any assistant messages
      if (response.message) {
        const assistantMessage: Message = {
          id: this.generateId(),
          role: 'assistant',
          content: response.message,
          agent: currentAgent.name,
          timestamp: new Date(),
        };
        await this.contextManager.addMessage(context.conversationId, assistantMessage);
      }

      this.emit('message:processed', {
        conversationId: context.conversationId,
        agent: currentAgent.name,
        response,
      });

      return response;
    } catch (error) {
      this.emit('message:error', {
        conversationId: context.conversationId,
        agent: context.currentAgent,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Handle agent handoff
   */
  private async handleHandoff(
    response: AgentResponse,
    initialContext: AgentContext
  ): Promise<AgentResponse> {
    if (!response.handoff) {
      return response;
    }

    const { targetAgent: targetAgentName, reason } = response.handoff;

    // Find the handoff event in the response
    const handoffEvent = response.events.find(
      (e): e is HandoffEvent => e.type === 'handoff'
    );

    if (!handoffEvent) {
      throw new Error('Handoff requested but no handoff event found');
    }

    // Update context with new current agent
    const updatedContext = handoffEvent.context;
    await this.contextManager.updateContext(
      updatedContext.conversationId,
      { currentAgent: targetAgentName }
    );

    // Get the target agent
    const targetAgent = this.agents.get(targetAgentName);
    
    if (!targetAgent) {
      throw new Error(`Target agent not found: ${targetAgentName}`);
    }

    this.emit('agent:handoff', {
      conversationId: updatedContext.conversationId,
      sourceAgent: initialContext.currentAgent,
      targetAgent: targetAgentName,
      reason,
    });

    // Process with the target agent
    // For now, we'll just return the handoff response
    // In a real implementation, you might want to have the target agent
    // automatically process an initial message
    return {
      ...response,
      context: updatedContext,
    };
  }

  /**
   * Log events to console or external system
   */
  private logEvents(events: AgentEvent[]): void {
    events.forEach(event => {
      this.emit('event:logged', event);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${event.type}] ${event.agent}:`, event);
      }
    });
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    teamId: string,
    managerId: string,
    options?: {
      initialAgent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AgentContext> {
    return await this.contextManager.createContext({
      teamId,
      managerId,
      initialAgent: options?.initialAgent,
      metadata: options?.metadata,
    });
  }

  /**
   * Get conversation context
   */
  async getConversation(conversationId: string): Promise<AgentContext | null> {
    return await this.contextManager.getContext(conversationId);
  }

  /**
   * Process a message in a conversation
   */
  async processConversationMessage(
    conversationId: string,
    message: string
  ): Promise<AgentResponse> {
    const context = await this.contextManager.getContext(conversationId);
    
    if (!context) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    return await this.routeMessage(message, context);
  }

  /**
   * Get agent handoff graph (for visualization)
   */
  getHandoffGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    this.agents.forEach((agent, agentName) => {
      graph[agentName] = agent.handoffs.map(h => h.targetAgent);
    });

    return graph;
  }

  /**
   * Validate handoff configuration
   */
  validateHandoffs(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    this.agents.forEach((agent, agentName) => {
      agent.handoffs.forEach(handoff => {
        if (!this.agents.has(handoff.targetAgent)) {
          errors.push(
            `Agent '${agentName}' has handoff to non-existent agent '${handoff.targetAgent}'`
          );
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}