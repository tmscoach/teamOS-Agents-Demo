/**
 * Main exports for the Agent Framework
 */

// Core types
export * from './types';

// Base classes
export { Agent } from './base';
export { OpenAIAgent } from './implementations/base-openai-agent';

// Framework components
export { ContextManager } from './context';
export { AgentRouter } from './router';
export { LLMProvider } from './llm';
export { ConversationStore } from './persistence';

// Re-export useful types from implementations
export type { OpenAIAgentConfig } from './implementations/base-openai-agent';
export type { LLMConfig, LLMResponse } from './llm';
export type { RouterOptions } from './router';
export type { CreateContextOptions } from './context';