/**
 * StateGraph: Main graph orchestration engine
 */

import { GraphNode } from './GraphNode';
import { ConditionalRouter } from './ConditionalRouter';
import { CheckpointManager } from './CheckpointManager';
import { ParallelExecutor } from './ParallelExecutor';
import {
  FlowConfiguration,
  FlowState,
  GraphExecutionContext,
  StateHistoryEntry,
  FlowEvent,
  FlowEventHandler,
  FlowExecutionOptions,
  FlowValidationResult
} from './types';
import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResponse, Message } from '../types';

export class StateGraph {
  private nodes: Map<string, GraphNode>;
  private router: ConditionalRouter;
  private checkpointManager?: CheckpointManager;
  private parallelExecutor: ParallelExecutor;
  private config: FlowConfiguration;
  private eventHandlers: Map<string, FlowEventHandler[]>;
  private currentState: string;
  private stateHistory: StateHistoryEntry[];
  private collectedData: Record<string, any>;
  private startTime: Date;
  
  constructor(
    config: FlowConfiguration,
    agentMap: Map<string, BaseAgent>,
    conversationId?: string
  ) {
    this.config = config;
    this.nodes = new Map();
    this.eventHandlers = new Map();
    this.stateHistory = [];
    this.collectedData = {};
    this.currentState = config.settings.initialState;
    this.startTime = new Date();
    
    // Initialize nodes
    this.initializeNodes(agentMap);
    
    // Initialize router
    this.router = new ConditionalRouter(config.transitions);
    
    // Initialize checkpoint manager if conversation ID provided
    if (conversationId) {
      this.checkpointManager = new CheckpointManager(conversationId, config.id);
    }
    
    // Initialize parallel executor
    this.parallelExecutor = new ParallelExecutor(
      5, // max concurrency
      config.settings.maxTotalDuration ? config.settings.maxTotalDuration * 60 * 1000 : 300000
    );
  }
  
  /**
   * Execute the graph with a message and context
   */
  async execute(
    message: Message,
    context: AgentContext,
    options?: FlowExecutionOptions
  ): Promise<AgentResponse> {
    try {
      // Load from checkpoint if requested
      if (options?.resumeFromCheckpoint && this.checkpointManager) {
        await this.resumeFromCheckpoint();
      }
      
      // Create execution context
      const executionContext: GraphExecutionContext = {
        ...context,
        currentState: this.currentState,
        stateConfig: this.config.states[this.currentState],
        collectedData: this.collectedData,
        stateHistory: this.stateHistory
      };
      
      // Emit state entered event
      await this.emitEvent({
        type: 'state_entered',
        timestamp: new Date(),
        state: this.currentState,
        data: { message: message.content }
      });
      
      // Execute current node
      const node = this.nodes.get(this.currentState);
      if (!node) {
        throw new Error(`Node not found for state: ${this.currentState}`);
      }
      
      let response: AgentResponse;
      
      // Handle parallel execution
      if (node.isParallel) {
        response = await this.executeParallelState(node, message, executionContext);
      } else {
        response = await node.execute(message, executionContext);
      }
      
      // Update collected data
      if (response.metadata?.extractedData) {
        Object.assign(this.collectedData, response.metadata.extractedData);
        await this.emitEvent({
          type: 'data_collected',
          timestamp: new Date(),
          state: this.currentState,
          data: response.metadata.extractedData
        });
      }
      
      // Check exit conditions
      const shouldTransition = await node.checkExitConditions(executionContext);
      
      if (shouldTransition) {
        // Find next state
        const nextState = await this.router.findNextState(this.currentState, executionContext);
        
        if (nextState) {
          await this.transitionTo(nextState, executionContext);
        } else if (this.config.settings.finalStates.includes(this.currentState)) {
          // Flow completed
          await this.completeFlow();
        }
      }
      
      // Save checkpoint if this is a checkpoint state
      if (this.config.settings.checkpointStates?.includes(this.currentState)) {
        await this.saveCheckpoint();
      }
      
      // Check timeout
      if (this.isTimedOut()) {
        await this.handleTimeout();
      }
      
      return {
        ...response,
        metadata: {
          ...response.metadata,
          flowState: this.currentState,
          flowProgress: this.getProgress(),
          collectedData: this.collectedData
        }
      };
    } catch (error) {
      console.error('Error in graph execution:', error);
      
      // Try to save recovery checkpoint
      if (this.checkpointManager) {
        await this.checkpointManager.createRecoveryCheckpoint(
          this.currentState,
          this.collectedData,
          this.stateHistory,
          error as Error
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Execute a parallel state
   */
  private async executeParallelState(
    node: GraphNode,
    message: Message,
    context: GraphExecutionContext
  ): Promise<AgentResponse> {
    const parallelNodes = node.parallelNodes
      .map(id => this.nodes.get(id))
      .filter((n): n is GraphNode => n !== undefined);
    
    if (parallelNodes.length === 0) {
      throw new Error(`No parallel nodes found for state: ${node.id}`);
    }
    
    // Emit parallel started event
    await this.emitEvent({
      type: 'parallel_started',
      timestamp: new Date(),
      state: this.currentState,
      data: { nodes: node.parallelNodes }
    });
    
    // Execute nodes in parallel
    const results = await this.parallelExecutor.executeParallel(
      parallelNodes,
      message,
      context
    );
    
    // Store parallel results in context
    context.parallelResults = results;
    
    // Aggregate results
    const aggregated = this.parallelExecutor.aggregateResults(results);
    
    // Update collected data
    Object.assign(this.collectedData, aggregated.extractedData);
    
    // Emit parallel completed event
    await this.emitEvent({
      type: 'parallel_completed',
      timestamp: new Date(),
      state: this.currentState,
      data: {
        results: aggregated,
        duration: aggregated.totalDuration
      }
    });
    
    // Create composite response
    return {
      content: this.createParallelResponseContent(results, aggregated),
      toolCalls: [],
      metadata: {
        parallelExecution: true,
        parallelResults: results,
        extractedData: aggregated.extractedData,
        errors: aggregated.errors
      }
    };
  }
  
  /**
   * Create response content for parallel execution
   */
  private createParallelResponseContent(
    results: Record<string, any>,
    aggregated: any
  ): string {
    if (aggregated.allSuccessful) {
      return `Successfully gathered information from ${aggregated.successCount} parallel sources. ` +
             `All required data has been collected.`;
    } else {
      return `Gathered information from ${aggregated.successCount} out of ${aggregated.successCount + aggregated.failureCount} sources. ` +
             `Some information may be incomplete.`;
    }
  }
  
  /**
   * Transition to a new state
   */
  private async transitionTo(nextState: string, context: GraphExecutionContext): Promise<void> {
    // Record state exit
    const exitTime = new Date();
    const duration = this.stateHistory.length > 0
      ? exitTime.getTime() - (this.stateHistory[this.stateHistory.length - 1].timestamp?.getTime() || 0)
      : 0;
    
    // Update state history
    this.stateHistory.push({
      state: this.currentState,
      timestamp: exitTime,
      duration,
      dataCollected: Object.keys(context.collectedData || {})
    });
    
    // Emit state exited event
    await this.emitEvent({
      type: 'state_exited',
      timestamp: exitTime,
      state: this.currentState,
      data: { nextState, duration }
    });
    
    // Emit transition event
    await this.emitEvent({
      type: 'transition_triggered',
      timestamp: new Date(),
      state: this.currentState,
      data: { from: this.currentState, to: nextState }
    });
    
    // Update current state
    this.currentState = nextState;
  }
  
  /**
   * Complete the flow
   */
  private async completeFlow(): Promise<void> {
    await this.emitEvent({
      type: 'flow_completed',
      timestamp: new Date(),
      state: this.currentState,
      data: {
        totalDuration: Date.now() - this.startTime.getTime(),
        statesVisited: this.stateHistory.length,
        dataCollected: Object.keys(this.collectedData)
      }
    });
    
    // Clear checkpoints on successful completion
    if (this.checkpointManager) {
      await this.checkpointManager.clearCheckpoints();
    }
  }
  
  /**
   * Handle flow timeout
   */
  private async handleTimeout(): Promise<void> {
    await this.emitEvent({
      type: 'flow_abandoned',
      timestamp: new Date(),
      state: this.currentState,
      data: {
        reason: 'timeout',
        duration: Date.now() - this.startTime.getTime()
      }
    });
    
    // Save checkpoint for resume
    if (this.checkpointManager && this.config.settings.abandonmentBehavior === 'save_progress') {
      await this.saveCheckpoint();
    }
  }
  
  /**
   * Save checkpoint
   */
  private async saveCheckpoint(): Promise<void> {
    if (!this.checkpointManager) return;
    
    await this.checkpointManager.saveCheckpoint(
      this.currentState,
      this.collectedData,
      this.stateHistory
    );
    
    await this.emitEvent({
      type: 'checkpoint_saved',
      timestamp: new Date(),
      state: this.currentState,
      data: { checkpointState: this.currentState }
    });
  }
  
  /**
   * Resume from checkpoint
   */
  private async resumeFromCheckpoint(): Promise<void> {
    if (!this.checkpointManager) return;
    
    const checkpoint = await this.checkpointManager.loadCheckpoint();
    if (!checkpoint) return;
    
    // Validate checkpoint
    if (!this.checkpointManager.validateCheckpoint(checkpoint)) {
      console.error('Invalid checkpoint data');
      return;
    }
    
    // Check if checkpoint is expired (24 hours)
    if (this.checkpointManager.isCheckpointExpired(checkpoint, 24 * 60 * 60 * 1000)) {
      console.warn('Checkpoint expired, starting fresh');
      return;
    }
    
    // Restore state
    this.currentState = checkpoint.state;
    this.collectedData = checkpoint.data;
    this.stateHistory = checkpoint.stateHistory;
  }
  
  /**
   * Initialize nodes from configuration
   */
  private initializeNodes(agentMap: Map<string, BaseAgent>): void {
    for (const [stateId, state] of Object.entries(this.config.states)) {
      // Find appropriate agent for this state
      const agentName = this.findAgentForState(state);
      const agent = agentMap.get(agentName);
      
      if (!agent) {
        throw new Error(`Agent not found for state ${stateId}: ${agentName}`);
      }
      
      const node = new GraphNode(agent, { ...state, id: stateId });
      this.nodes.set(stateId, node);
    }
  }
  
  /**
   * Find the appropriate agent for a state
   */
  private findAgentForState(state: FlowState): string {
    // This could be enhanced with more sophisticated mapping logic
    // For now, use a simple mapping based on state name
    if (state.name.toLowerCase().includes('onboarding')) {
      return 'OnboardingAgent';
    }
    if (state.name.toLowerCase().includes('assessment')) {
      return 'AssessmentAgent';
    }
    if (state.name.toLowerCase().includes('discovery')) {
      return 'DiscoveryAgent';
    }
    
    // Default to onboarding agent
    return 'OnboardingAgent';
  }
  
  /**
   * Check if flow has timed out
   */
  private isTimedOut(): boolean {
    if (!this.config.settings.maxTotalDuration) return false;
    
    const elapsed = Date.now() - this.startTime.getTime();
    return elapsed > this.config.settings.maxTotalDuration * 60 * 1000;
  }
  
  /**
   * Get flow progress percentage
   */
  private getProgress(): number {
    const totalStates = Object.keys(this.config.states).length;
    const visitedStates = new Set(this.stateHistory.map(h => h.state)).size + 1;
    return Math.round((visitedStates / totalStates) * 100);
  }
  
  /**
   * Register event handler
   */
  on(eventType: string, handler: FlowEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }
  
  /**
   * Emit event
   */
  private async emitEvent(event: FlowEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }
  
  /**
   * Validate flow configuration
   */
  static validateConfiguration(config: FlowConfiguration): FlowValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check initial state exists
    if (!config.states[config.settings.initialState]) {
      errors.push(`Initial state '${config.settings.initialState}' not found in states`);
    }
    
    // Check final states exist
    for (const finalState of config.settings.finalStates) {
      if (!config.states[finalState]) {
        errors.push(`Final state '${finalState}' not found in states`);
      }
    }
    
    // Check all transition states exist
    for (const transition of config.transitions) {
      if (!config.states[transition.from]) {
        errors.push(`Transition source state '${transition.from}' not found`);
      }
      if (!config.states[transition.to]) {
        errors.push(`Transition target state '${transition.to}' not found`);
      }
    }
    
    // Check for unreachable states
    const reachableStates = new Set([config.settings.initialState]);
    let changed = true;
    
    while (changed) {
      changed = false;
      for (const transition of config.transitions) {
        if (reachableStates.has(transition.from) && !reachableStates.has(transition.to)) {
          reachableStates.add(transition.to);
          changed = true;
        }
      }
    }
    
    for (const stateId of Object.keys(config.states)) {
      if (!reachableStates.has(stateId) && stateId !== config.settings.initialState) {
        warnings.push(`State '${stateId}' may be unreachable`);
      }
    }
    
    // Validate router configuration
    const router = new ConditionalRouter(config.transitions);
    const routerErrors = router.validateTransitions();
    errors.push(...routerErrors);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get current state information
   */
  getCurrentState(): {
    state: string;
    stateConfig: FlowState;
    timeInState: number;
    collectedData: Record<string, any>;
  } {
    const lastEntry = this.stateHistory[this.stateHistory.length - 1];
    const timeInState = lastEntry 
      ? Date.now() - lastEntry.timestamp.getTime() 
      : Date.now() - this.startTime.getTime();
    
    return {
      state: this.currentState,
      stateConfig: this.config.states[this.currentState],
      timeInState,
      collectedData: this.collectedData
    };
  }
}