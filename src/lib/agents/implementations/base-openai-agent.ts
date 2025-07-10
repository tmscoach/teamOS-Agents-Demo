/**
 * Base OpenAI Agent implementation
 */

import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import { Agent } from '../base';
import { LLMProvider, LLMConfig } from '../llm';
import {
  AgentConfig,
  AgentContext,
  AgentResponse,
  AgentEvent,
  ToolCall,
  HandoffRequest,
  Message,
} from '../types';
import { AgentConfigLoader, LoadedAgentConfig } from '../config/agent-config-loader';

export interface OpenAIAgentConfig extends AgentConfig {
  llmConfig?: LLMConfig;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class OpenAIAgent extends Agent {
  protected llm: LLMProvider;
  protected model: string;
  protected temperature: number;
  protected maxTokens: number;
  protected systemPrompt?: string;
  protected loadedConfig: LoadedAgentConfig | null = null;
  private configLoadPromise: Promise<void> | null = null;

  constructor(config: OpenAIAgentConfig) {
    super(config);
    
    this.llm = new LLMProvider(config.llmConfig);
    this.model = config.model || 'gpt-4o-mini';  // Updated to a valid model
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2048;
    this.systemPrompt = config.systemPrompt;
    
    // Start loading configuration asynchronously
    this.configLoadPromise = this.loadConfiguration();
  }
  
  /**
   * Load configuration from the database
   */
  protected async loadConfiguration(): Promise<void> {
    try {
      const config = await AgentConfigLoader.loadConfiguration(this.name);
      if (config) {
        this.loadedConfig = config;
        // Override systemPrompt if loaded from config
        if (config.systemPrompt) {
          this.systemPrompt = config.systemPrompt;
        }
        console.log(`[${this.name}] Loaded configuration version ${config.version}`);
      } else {
        console.log(`[${this.name}] No configuration found, using defaults`);
      }
    } catch (error) {
      console.error(`[${this.name}] Failed to load configuration:`, error);
    }
  }
  
  /**
   * Ensure configuration is loaded before processing
   */
  protected async ensureConfigLoaded(): Promise<void> {
    if (this.configLoadPromise) {
      await this.configLoadPromise;
      this.configLoadPromise = null;
    }
  }

  /**
   * Process a message using OpenAI
   */
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Ensure configuration is loaded
    await this.ensureConfigLoaded();
    
    const events: AgentEvent[] = [];

    try {
      // Validate input with guardrails
      const validationResult = await this.validateInput(message, context);
      events.push(...validationResult.events);

      // If validation failed, return early with the guardrail failure message
      if (!validationResult.passed) {
        return this.buildResponse(context, events, {
          message: `I cannot process that message. ${validationResult.failureReason}`,
        });
      }

      // Build conversation messages
      const messages = this.buildMessages(message, context);
      
      // Convert tools to OpenAI format
      const openAITools = this.buildOpenAITools();

      // Get LLM response
      console.log(`[${this.name}] Calling OpenAI with model: ${this.model}`);
      const { completion } = await this.llm.generateResponse(messages, {
        tools: openAITools.length > 0 ? openAITools : undefined,
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      console.log(`[${this.name}] OpenAI response:`, {
        hasContent: !!completion.choices[0]?.message?.content,
        content: completion.choices[0]?.message?.content?.substring(0, 100),
        hasToolCalls: !!completion.choices[0]?.message?.tool_calls,
        toolCallCount: completion.choices[0]?.message?.tool_calls?.length || 0
      });

      // Process the completion
      return await this.processCompletion(completion, context, events, messages);
    } catch (error) {
      // Create error response
      return this.buildResponse(context, events, {
        message: `Error processing message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
  }

  /**
   * Build messages for OpenAI API
   */
  protected buildMessages(
    currentMessage: string,
    context: AgentContext
  ): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    // Add system message
    const systemMessage = this.buildSystemMessage(context);
    messages.push({
      role: 'system',
      content: systemMessage,
    });

    // Add conversation history
    const historyMessages = this.buildHistoryMessages(context);
    messages.push(...historyMessages);

    // Add current user message
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  /**
   * Build system message with instructions
   */
  protected buildSystemMessage(context: AgentContext): string {
    // If we have a loaded configuration with systemPrompt, use it as the primary prompt
    if (this.loadedConfig?.systemPrompt) {
      return this.loadedConfig.systemPrompt;
    }
    
    // Otherwise fall back to the original behavior
    const instructions = this.getInstructions(context);
    
    let systemMessage = `You are ${this.name}. ${this.description}\n\n`;
    systemMessage += `Instructions:\n${instructions}\n\n`;

    if (this.systemPrompt) {
      systemMessage += `${this.systemPrompt}\n\n`;
    }

    // Add context information
    systemMessage += this.buildContextPrompt(context);

    // Add available tools
    if (this.tools.length > 0) {
      systemMessage += '\n\nAvailable tools:\n';
      this.tools.forEach(tool => {
        systemMessage += `- ${tool.name}: ${tool.description}\n`;
      });
    }

    // Add handoff options
    if (this.handoffs.length > 0) {
      systemMessage += '\n\nYou can hand off to these agents:\n';
      this.handoffs.forEach(handoff => {
        const targetAgent = handoff.targetAgent;
        systemMessage += `- ${targetAgent}\n`;
      });
      systemMessage += '\nUse the handoff tool when you need to transfer the conversation to another agent.';
    }

    return systemMessage;
  }

  /**
   * Build context-specific prompt
   */
  protected buildContextPrompt(context: AgentContext): string {
    let prompt = 'Current context:\n';
    prompt += `- Team ID: ${context.teamId}\n`;
    prompt += `- Manager ID: ${context.managerId}\n`;
    prompt += `- Transformation Phase: ${context.transformationPhase}\n`;

    if (context.assessmentResults) {
      prompt += '\nAssessment Results:\n';
      if (context.assessmentResults.tmp) {
        prompt += '- TMP: Completed\n';
      }
      if (context.assessmentResults.qo2) {
        prompt += '- QO2: Completed\n';
      }
      if (context.assessmentResults.wowv) {
        prompt += '- WoWV: Completed\n';
      }
      if (context.assessmentResults.llp) {
        prompt += '- LLP: Completed\n';
      }
    }

    return prompt;
  }

  /**
   * Build conversation history messages
   */
  protected buildHistoryMessages(
    context: AgentContext
  ): ChatCompletionMessageParam[] {
    // Limit history to last 10 messages to avoid token limits
    const recentHistory = context.messageHistory.slice(-10);
    
    return recentHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
      name: msg.agent,
    }));
  }

  /**
   * Convert agent tools to OpenAI format
   */
  protected buildOpenAITools(): ChatCompletionTool[] {
    const tools = [...this.tools];

    // Add handoff tool if there are handoffs configured
    if (this.handoffs.length > 0) {
      tools.push({
        name: 'handoff',
        description: 'Hand off the conversation to another agent',
        parameters: {
          type: 'object',
          properties: {
            targetAgent: {
              type: 'string',
              description: 'The name of the agent to hand off to',
              enum: this.handoffs.map(h => h.targetAgent),
            },
            reason: {
              type: 'string',
              description: 'The reason for the handoff',
            },
          },
          required: ['targetAgent', 'reason'],
        },
        execute: async () => ({ success: true, output: 'Handoff initiated' }),
      });
    }

    return LLMProvider.convertToolsToOpenAI(tools);
  }

  /**
   * Process OpenAI completion
   */
  protected async processCompletion(
    completion: any,
    context: AgentContext,
    events: AgentEvent[],
    originalMessages?: ChatCompletionMessageParam[]
  ): Promise<AgentResponse> {
    const choice = completion.choices[0];
    const message = choice.message;

    // Extract content
    let responseContent = message.content || '';

    // Process tool calls if any
    const toolCalls: ToolCall[] = [];
    let handoffRequest: HandoffRequest | undefined;
    const toolResults: Array<{ toolCallId: string; result: any }> = [];

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const parsedArgs = JSON.parse(toolCall.function.arguments);

        // Check if this is a handoff
        if (toolCall.function.name === 'handoff') {
          handoffRequest = {
            targetAgent: parsedArgs.targetAgent,
            reason: parsedArgs.reason,
          };

          // Execute the handoff
          const handoffEvent = await this.executeHandoff(
            parsedArgs.targetAgent,
            parsedArgs.reason,
            context
          );
          events.push(handoffEvent);
        } else {
          // Regular tool call
          toolCalls.push({
            id: toolCall.id,
            name: toolCall.function.name,
            parameters: parsedArgs,
          });

          // Execute the tool
          const { callEvent, outputEvent } = await this.callTool(
            toolCall.function.name,
            parsedArgs,
            context
          );
          events.push(callEvent, outputEvent);
          
          // Store tool result for follow-up
          toolResults.push({
            toolCallId: toolCall.id,
            result: outputEvent.result
          });
        }
      }
      
      // If we have tool calls but no content, make a follow-up call to get a response
      if (!responseContent && toolResults.length > 0 && originalMessages) {
        console.log(`[${this.name}] Making follow-up call after tool execution`);
        
        // Build messages including tool results
        const followUpMessages = [...originalMessages];
        followUpMessages.push(message); // Add the assistant's tool call message
        
        // Add tool response messages
        for (const { toolCallId, result } of toolResults) {
          followUpMessages.push({
            role: 'tool',
            content: JSON.stringify(result.output || result),
            tool_call_id: toolCallId
          });
        }
        
        // Make follow-up call
        const { completion: followUpCompletion } = await this.llm.generateResponse(followUpMessages, {
          model: this.model,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        });
        
        responseContent = followUpCompletion.choices[0]?.message?.content || '';
        console.log(`[${this.name}] Follow-up response:`, responseContent.substring(0, 100));
      }
    }

    // Build and return response
    return this.buildResponse(context, events, {
      message: responseContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      handoff: handoffRequest,
    });
  }

  /**
   * Stream a response (for future implementation)
   */
  async *streamMessage(
    message: string,
    context: AgentContext
  ): AsyncGenerator<string> {
    const messages = this.buildMessages(message, context);
    const tools = this.buildOpenAITools();

    const stream = this.llm.streamResponse(messages, {
      tools: tools.length > 0 ? tools : undefined,
      model: this.model,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield delta.content;
      }
    }
  }
}