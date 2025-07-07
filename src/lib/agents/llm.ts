/**
 * LLM Provider wrapper for OpenAI integration
 */

import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletion,
  ChatCompletionCreateParams,
} from 'openai/resources/chat/completions';

export interface LLMConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  organizationId?: string;
  baseURL?: string;
}

export interface LLMResponse {
  completion: ChatCompletion;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMProvider {
  private client: OpenAI;
  private defaultModel: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(config: LLMConfig = {}) {
    this.client = new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      organization: config.organizationId || process.env.OPENAI_ORG_ID,
      baseURL: config.baseURL,
    });

    this.defaultModel = config.model || 'gpt-4-turbo-preview';
    this.defaultTemperature = config.temperature ?? 0.7;
    this.defaultMaxTokens = config.maxTokens ?? 2048;
  }

  /**
   * Generate a response from the LLM
   */
  async generateResponse(
    messages: ChatCompletionMessageParam[],
    options: {
      tools?: ChatCompletionTool[];
      model?: string;
      temperature?: number;
      maxTokens?: number;
      toolChoice?: ChatCompletionCreateParams['tool_choice'];
      responseFormat?: ChatCompletionCreateParams['response_format'];
    } = {}
  ): Promise<LLMResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature ?? this.defaultTemperature,
        max_tokens: options.maxTokens ?? this.defaultMaxTokens,
        tools: options.tools,
        tool_choice: options.toolChoice || (options.tools ? 'auto' : undefined),
        response_format: options.responseFormat,
      });

      return {
        completion,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API Error: ${error.message} (${error.status})`);
      }
      throw error;
    }
  }

  /**
   * Stream a response from the LLM
   */
  async *streamResponse(
    messages: ChatCompletionMessageParam[],
    options: {
      tools?: ChatCompletionTool[];
      model?: string;
      temperature?: number;
      maxTokens?: number;
      toolChoice?: ChatCompletionCreateParams['tool_choice'];
    } = {}
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk> {
    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? this.defaultTemperature,
      max_tokens: options.maxTokens ?? this.defaultMaxTokens,
      tools: options.tools,
      tool_choice: options.toolChoice || (options.tools ? 'auto' : undefined),
      stream: true,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * Convert agent tools to OpenAI format
   */
  static convertToolsToOpenAI(
    tools: Array<{
      name: string;
      description: string;
      parameters: any;
    }>
  ): ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Parse tool calls from completion
   */
  static parseToolCalls(completion: ChatCompletion): Array<{
    id: string;
    name: string;
    arguments: any;
  }> {
    const message = completion.choices[0]?.message;
    
    if (!message?.tool_calls) {
      return [];
    }

    return message.tool_calls.map(toolCall => ({
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
    }));
  }

  /**
   * Create a tool response message
   */
  static createToolResponseMessage(
    toolCallId: string,
    response: any
  ): ChatCompletionMessageParam {
    return {
      role: 'tool',
      content: typeof response === 'string' ? response : JSON.stringify(response),
      tool_call_id: toolCallId,
    };
  }

  /**
   * Count tokens in a message (approximate)
   */
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate API key
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list();
      return models.data
        .filter(model => model.id.startsWith('gpt'))
        .map(model => model.id);
    } catch (error) {
      throw new Error('Failed to fetch available models');
    }
  }

  /**
   * Create embeddings
   */
  async createEmbedding(
    text: string,
    model: string = 'text-embedding-3-small'
  ): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model,
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Moderate content
   */
  async moderateContent(content: string): Promise<{
    flagged: boolean;
    categories: Record<string, boolean>;
    scores: Record<string, number>;
  }> {
    const response = await this.client.moderations.create({
      input: content,
    });

    const result = response.results[0];
    
    return {
      flagged: result.flagged,
      categories: result.categories as unknown as Record<string, boolean>,
      scores: result.category_scores as unknown as Record<string, number>,
    };
  }
}