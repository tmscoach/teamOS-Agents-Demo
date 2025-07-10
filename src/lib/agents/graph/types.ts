/**
 * Type definitions for the graph-based flow system
 */

import { AgentContext, AgentResponse } from '../types';

export interface FlowState {
  id: string;
  name: string;
  description: string;
  systemPromptOverride?: string;
  dataRequirements: {
    required: string[];
    optional: string[];
  };
  availableTools?: string[];
  exitConditions: ExitCondition[];
  maxDuration?: number;
  parallel?: boolean;
  nodes?: string[];
}

export interface ExitCondition {
  id: string;
  type: 'data_complete' | 'time_elapsed' | 'user_intent' | 'custom' | 'parallel_complete';
  config: any;
}

export interface FlowTransition {
  id: string;
  from: string;
  to: string;
  condition: TransitionCondition;
  priority: number;
}

export interface TransitionCondition {
  type: 'all' | 'any' | 'custom';
  rules: TransitionRule[];
}

export interface TransitionRule {
  type: 'data_exists' | 'data_equals' | 'data_matches' | 'custom';
  field?: string;
  value?: any;
  expression?: string;
  pattern?: RegExp;
}

export interface FlowConfiguration {
  id: string;
  name: string;
  version: number;
  states: Record<string, FlowState>;
  transitions: FlowTransition[];
  settings: FlowSettings;
}

export interface FlowSettings {
  initialState: string;
  finalStates: string[];
  checkpointStates?: string[];
  defaultTransitionDelay?: number;
  maxTotalDuration?: number;
  abandonmentBehavior?: 'save_progress' | 'reset' | 'handoff';
  parallelExecutionEnabled?: boolean;
}

export interface GraphNode {
  id: string;
  type: 'state' | 'parallel' | 'decision';
  data: FlowState;
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  data: FlowTransition;
}

export interface GraphExecutionContext extends AgentContext {
  currentState: string;
  stateConfig: FlowState;
  collectedData: Record<string, any>;
  stateHistory: StateHistoryEntry[];
  parallelResults?: Record<string, any>;
}

export interface StateHistoryEntry {
  state: string;
  timestamp: Date;
  duration?: number;
  dataCollected?: string[];
}

export interface FlowCheckpoint {
  conversationId: string;
  flowConfigId: string;
  state: string;
  data: Record<string, any>;
  stateHistory: StateHistoryEntry[];
  timestamp: Date;
}

export interface ParallelExecutionResult {
  nodeId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface FlowExecutionOptions {
  resumeFromCheckpoint?: boolean;
  checkpointId?: string;
  maxExecutionTime?: number;
  debugMode?: boolean;
}

export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FlowMetrics {
  totalDuration: number;
  stateMetrics: Record<string, {
    visits: number;
    averageDuration: number;
    completionRate: number;
  }>;
  dataCollectionRate: number;
  abandonmentPoints: string[];
}

export type FlowEventType = 
  | 'state_entered'
  | 'state_exited'
  | 'transition_triggered'
  | 'data_collected'
  | 'checkpoint_saved'
  | 'parallel_started'
  | 'parallel_completed'
  | 'flow_completed'
  | 'flow_abandoned';

export interface FlowEvent {
  type: FlowEventType;
  timestamp: Date;
  state?: string;
  data?: any;
  metadata?: Record<string, any>;
}

export interface FlowEventHandler {
  (event: FlowEvent): void | Promise<void>;
}

export interface GraphExecutor {
  execute(
    flowConfig: FlowConfiguration,
    context: AgentContext,
    options?: FlowExecutionOptions
  ): Promise<AgentResponse>;
  
  validateFlow(flowConfig: FlowConfiguration): FlowValidationResult;
  
  saveCheckpoint(checkpoint: FlowCheckpoint): Promise<void>;
  
  loadCheckpoint(checkpointId: string): Promise<FlowCheckpoint | null>;
  
  getMetrics(flowConfigId: string): Promise<FlowMetrics>;
}