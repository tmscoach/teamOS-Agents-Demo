/**
 * Base Agent abstract class for all agents in the system
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BaseAgent,
  AgentContext,
  AgentResponse,
  AgentConfig,
  AgentTool,
  HandoffConfig,
  Guardrail,
  HandoffEvent,
  ToolCallEvent,
  ToolOutputEvent,
  GuardrailEvent,
  MessageEvent,
  ToolCall,
  HandoffRequest,
  ToolResult,
  AgentEvent,
  Message,
} from './types';

export abstract class Agent implements BaseAgent {
  name: string;
  description: string;
  handoffDescription: string;
  instructions: string | ((context: AgentContext) => string);
  tools: AgentTool[];
  handoffs: HandoffConfig[];
  inputGuardrails: Guardrail[];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.description = config.description;
    this.handoffDescription = config.handoffDescription;
    this.instructions = config.instructions;
    this.tools = config.tools || [];
    this.handoffs = config.handoffs || [];
    this.inputGuardrails = config.inputGuardrails || [];
  }

  /**
   * Main method to process incoming messages
   * Must be implemented by concrete agent classes
   */
  abstract processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse>;

  /**
   * Get instructions for the agent based on current context
   */
  protected getInstructions(context: AgentContext): string {
    if (typeof this.instructions === 'function') {
      return this.instructions(context);
    }
    return this.instructions;
  }

  /**
   * Validate input using configured guardrails
   */
  protected async validateInput(
    input: string,
    context: AgentContext
  ): Promise<GuardrailEvent[]> {
    const events: GuardrailEvent[] = [];

    for (const guardrail of this.inputGuardrails) {
      const result = await guardrail.validate(input, context);
      
      const event: GuardrailEvent = {
        id: uuidv4(),
        type: 'guardrail',
        timestamp: new Date(),
        conversationId: context.conversationId,
        agent: this.name,
        guardrailName: guardrail.name,
        result,
      };

      events.push(event);

      // If any guardrail fails, stop processing
      if (!result.passed) {
        throw new Error(`Guardrail ${guardrail.name} failed: ${result.reason}`);
      }
    }

    return events;
  }

  /**
   * Execute a handoff to another agent
   */
  protected async executeHandoff(
    targetAgent: string,
    reason: string,
    context: AgentContext
  ): Promise<HandoffEvent> {
    // Find the handoff configuration
    const handoffConfig = this.handoffs.find(h => h.targetAgent === targetAgent);
    
    if (!handoffConfig) {
      throw new Error(`No handoff configured for target agent: ${targetAgent}`);
    }

    // Check condition if specified
    if (handoffConfig.condition && !handoffConfig.condition(context)) {
      throw new Error(`Handoff condition not met for agent: ${targetAgent}`);
    }

    // Execute onHandoff callback if specified
    let updatedContext = context;
    if (handoffConfig.onHandoff) {
      updatedContext = await handoffConfig.onHandoff(context);
    }

    // Create handoff event
    const handoffEvent: HandoffEvent = {
      id: uuidv4(),
      type: 'handoff',
      timestamp: new Date(),
      conversationId: context.conversationId,
      agent: this.name,
      sourceAgent: this.name,
      targetAgent,
      reason,
      context: {
        ...updatedContext,
        currentAgent: targetAgent,
      },
    };

    return handoffEvent;
  }

  /**
   * Call a tool with given parameters
   */
  protected async callTool(
    toolName: string,
    parameters: any,
    context: AgentContext
  ): Promise<{ callEvent: ToolCallEvent; outputEvent: ToolOutputEvent }> {
    // Find the tool
    const tool = this.tools.find(t => t.name === toolName);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Create tool call event
    const callEvent: ToolCallEvent = {
      id: uuidv4(),
      type: 'tool_call',
      timestamp: new Date(),
      conversationId: context.conversationId,
      agent: this.name,
      toolName,
      parameters,
      status: 'executing',
    };

    // Execute the tool
    let result: ToolResult;
    try {
      result = await tool.execute(parameters, context);
    } catch (error) {
      result = {
        success: false,
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Create tool output event
    const outputEvent: ToolOutputEvent = {
      id: uuidv4(),
      type: 'tool_output',
      timestamp: new Date(),
      conversationId: context.conversationId,
      agent: this.name,
      toolName,
      result,
    };

    return { callEvent, outputEvent };
  }

  /**
   * Create a message event
   */
  protected createMessageEvent(
    content: string,
    context: AgentContext
  ): MessageEvent {
    const message: Message = {
      id: uuidv4(),
      role: 'assistant',
      content,
      agent: this.name,
      timestamp: new Date(),
    };

    return {
      id: uuidv4(),
      type: 'message',
      timestamp: new Date(),
      conversationId: context.conversationId,
      agent: this.name,
      message,
    };
  }

  /**
   * Helper to build a response with common structure
   */
  protected buildResponse(
    context: AgentContext,
    events: AgentEvent[],
    options: {
      message?: string;
      toolCalls?: ToolCall[];
      handoff?: HandoffRequest;
    } = {}
  ): AgentResponse {
    // Add message event if message is provided
    if (options.message) {
      events.push(this.createMessageEvent(options.message, context));
    }

    return {
      message: options.message,
      toolCalls: options.toolCalls,
      handoff: options.handoff,
      events,
      context,
    };
  }

  /**
   * Get tool by name
   */
  protected getTool(name: string): AgentTool | undefined {
    return this.tools.find(tool => tool.name === name);
  }

  /**
   * Check if agent can handoff to target
   */
  protected canHandoffTo(targetAgent: string): boolean {
    return this.handoffs.some(h => h.targetAgent === targetAgent);
  }
}