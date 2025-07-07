/**
 * Core type definitions for the Agent Framework
 */

export type TransformationPhase = 
  | 'onboarding' 
  | 'assessment' 
  | 'analysis' 
  | 'transformation' 
  | 'monitoring';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ToolStatus = 'pending' | 'executing' | 'completed' | 'failed';

// Core Agent Interfaces
export interface BaseAgent {
  name: string;
  description: string;
  handoffDescription: string;
  instructions: string | ((context: AgentContext) => string);
  tools: AgentTool[];
  handoffs: HandoffConfig[];
  inputGuardrails: Guardrail[];
}

// Agent Context for maintaining conversation state
export interface AgentContext {
  // Team transformation context
  teamId: string;
  managerId: string;
  transformationPhase: TransformationPhase;
  
  // Assessment data
  assessmentResults?: {
    tmp?: TMPResults;
    qo2?: QO2Results;
    wowv?: WoWVResults;
    llp?: LLPResults;
  };
  
  // Conversation state
  currentAgent: string;
  conversationId: string;
  messageHistory: Message[];
  
  // Dynamic context
  metadata: Record<string, any>;
}

// Message structure
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  agent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Tool definitions
export interface AgentTool {
  name: string;
  description: string;
  parameters: ParameterSchema;
  execute: (params: any, context: AgentContext) => Promise<ToolResult>;
}

export interface ParameterSchema {
  type: 'object';
  properties: Record<string, ParameterProperty>;
  required?: string[];
}

export interface ParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: any[];
  items?: ParameterProperty;
  properties?: Record<string, ParameterProperty>;
}

export interface ToolResult {
  success: boolean;
  output: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Handoff configuration
export interface HandoffConfig {
  targetAgent: string;
  condition?: (context: AgentContext) => boolean;
  onHandoff?: (context: AgentContext) => Promise<AgentContext>;
}

// Guardrail for input validation
export interface Guardrail {
  name: string;
  description: string;
  validate: (input: string, context: AgentContext) => Promise<GuardrailResult>;
}

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  metadata?: Record<string, any>;
}

// Agent Events
export type AgentEvent = 
  | MessageEvent
  | HandoffEvent
  | ToolCallEvent
  | ToolOutputEvent
  | ContextUpdateEvent
  | GuardrailEvent;

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  conversationId: string;
  agent: string;
}

export interface MessageEvent extends BaseEvent {
  type: 'message';
  message: Message;
}

export interface HandoffEvent extends BaseEvent {
  type: 'handoff';
  sourceAgent: string;
  targetAgent: string;
  reason: string;
  context: AgentContext;
}

export interface ToolCallEvent extends BaseEvent {
  type: 'tool_call';
  toolName: string;
  parameters: any;
  status: ToolStatus;
}

export interface ToolOutputEvent extends BaseEvent {
  type: 'tool_output';
  toolName: string;
  result: ToolResult;
}

export interface ContextUpdateEvent extends BaseEvent {
  type: 'context_update';
  updates: Partial<AgentContext>;
}

export interface GuardrailEvent extends BaseEvent {
  type: 'guardrail';
  guardrailName: string;
  result: GuardrailResult;
}

// Agent Response structure
export interface AgentResponse {
  message?: string;
  toolCalls?: ToolCall[];
  handoff?: HandoffRequest;
  events: AgentEvent[];
  context: AgentContext;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
}

export interface HandoffRequest {
  targetAgent: string;
  reason: string;
}

// TMS Assessment Types (placeholder for now)
export interface TMPResults {
  // Team Management Profile results
  [key: string]: any;
}

export interface QO2Results {
  // Quotient of Organizational Outcomes results
  [key: string]: any;
}

export interface WoWVResults {
  // Ways of Working Virtually results
  [key: string]: any;
}

export interface LLPResults {
  // Leadership Lens Profile results
  [key: string]: any;
}

// Agent configuration
export interface AgentConfig {
  name: string;
  description: string;
  handoffDescription: string;
  instructions: string | ((context: AgentContext) => string);
  tools?: AgentTool[];
  handoffs?: HandoffConfig[];
  inputGuardrails?: Guardrail[];
}