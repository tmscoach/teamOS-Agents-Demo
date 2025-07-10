/**
 * ConfigurableFlowEngine: Runtime engine that interprets flow configurations
 */

import { StateGraph } from './StateGraph';
import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResponse, Message } from '../types';
import {
  FlowConfiguration,
  FlowExecutionOptions,
  FlowEvent,
  FlowMetrics,
  FlowValidationResult
} from './types';
import { prisma } from '@/lib/prisma';

export class ConfigurableFlowEngine {
  private agent: BaseAgent;
  private flowConfig?: FlowConfiguration;
  private stateGraph?: StateGraph;
  private agentMap: Map<string, BaseAgent>;
  private metrics: Map<string, any>;
  
  constructor(agent: BaseAgent, agentMap?: Map<string, BaseAgent>) {
    this.agent = agent;
    this.agentMap = agentMap || new Map([['default', agent]]);
    this.metrics = new Map();
    
    // Ensure the main agent is in the map
    this.agentMap.set(agent.constructor.name, agent);
  }
  
  /**
   * Load flow configuration from database or object
   */
  async loadConfiguration(configIdOrObject: string | FlowConfiguration): Promise<void> {
    if (typeof configIdOrObject === 'string') {
      // Load from database
      const config = await this.loadConfigFromDatabase(configIdOrObject);
      if (!config) {
        throw new Error(`Flow configuration not found: ${configIdOrObject}`);
      }
      this.flowConfig = config;
    } else {
      // Use provided configuration
      this.flowConfig = configIdOrObject;
    }
    
    // Validate configuration
    const validation = StateGraph.validateConfiguration(this.flowConfig);
    if (!validation.valid) {
      throw new Error(`Invalid flow configuration: ${validation.errors.join(', ')}`);
    }
    
    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn('Flow configuration warnings:', validation.warnings);
    }
  }
  
  /**
   * Process a message through the flow
   */
  async processMessage(
    message: Message,
    context: AgentContext,
    options?: FlowExecutionOptions
  ): Promise<AgentResponse> {
    if (!this.flowConfig) {
      // Fall back to direct agent processing if no flow configured
      return this.agent.processMessage(message, context);
    }
    
    // Initialize state graph if needed
    if (!this.stateGraph || options?.resumeFromCheckpoint) {
      this.stateGraph = new StateGraph(
        this.flowConfig,
        this.agentMap,
        context.conversationId
      );
      
      // Register event handlers
      this.registerEventHandlers();
    }
    
    try {
      // Execute through graph
      const response = await this.stateGraph.execute(message, context, options);
      
      // Update metrics
      this.updateMetrics(response);
      
      return response;
    } catch (error) {
      console.error('Error in flow execution:', error);
      
      // Fall back to direct agent processing
      return this.agent.processMessage(message, context);
    }
  }
  
  /**
   * Get current flow state
   */
  getCurrentState(): any {
    if (!this.stateGraph) {
      return null;
    }
    
    return this.stateGraph.getCurrentState();
  }
  
  /**
   * Validate a flow configuration
   */
  static validateConfiguration(config: FlowConfiguration): FlowValidationResult {
    return StateGraph.validateConfiguration(config);
  }
  
  /**
   * Get flow metrics
   */
  async getMetrics(): Promise<FlowMetrics> {
    if (!this.flowConfig) {
      return {
        totalDuration: 0,
        stateMetrics: {},
        dataCollectionRate: 0,
        abandonmentPoints: []
      };
    }
    
    // Aggregate metrics from database
    const conversations = await prisma.conversation.findMany({
      where: {
        metadata: {
          path: ['flowConfigId'],
          equals: this.flowConfig.id
        }
      },
      include: {
        messages: true
      }
    });
    
    const stateMetrics: Record<string, any> = {};
    const abandonmentPoints: string[] = [];
    let totalDuration = 0;
    let completedFlows = 0;
    
    // Analyze each conversation
    for (const conversation of conversations) {
      const metadata = conversation.metadata as any;
      
      if (metadata.flowCompleted) {
        completedFlows++;
        totalDuration += metadata.flowDuration || 0;
      } else if (metadata.lastState) {
        abandonmentPoints.push(metadata.lastState);
      }
      
      // Analyze state visits
      if (metadata.stateHistory) {
        for (const entry of metadata.stateHistory) {
          if (!stateMetrics[entry.state]) {
            stateMetrics[entry.state] = {
              visits: 0,
              totalDuration: 0,
              completions: 0
            };
          }
          
          stateMetrics[entry.state].visits++;
          stateMetrics[entry.state].totalDuration += entry.duration || 0;
          
          if (entry.completed) {
            stateMetrics[entry.state].completions++;
          }
        }
      }
    }
    
    // Calculate averages
    for (const state of Object.keys(stateMetrics)) {
      const metrics = stateMetrics[state];
      stateMetrics[state] = {
        visits: metrics.visits,
        averageDuration: metrics.totalDuration / metrics.visits,
        completionRate: metrics.completions / metrics.visits
      };
    }
    
    return {
      totalDuration: totalDuration / Math.max(completedFlows, 1),
      stateMetrics,
      dataCollectionRate: completedFlows / Math.max(conversations.length, 1),
      abandonmentPoints
    };
  }
  
  /**
   * Load configuration from database
   */
  private async loadConfigFromDatabase(configId: string): Promise<FlowConfiguration | null> {
    const dbConfig = await prisma.flowConfiguration.findUnique({
      where: { id: configId }
    });
    
    if (!dbConfig) {
      return null;
    }
    
    return dbConfig.config as FlowConfiguration;
  }
  
  /**
   * Register event handlers for metrics and logging
   */
  private registerEventHandlers(): void {
    if (!this.stateGraph) return;
    
    // State transitions
    this.stateGraph.on('transition_triggered', (event: FlowEvent) => {
      console.log(`Flow transition: ${event.data.from} → ${event.data.to}`);
      this.metrics.set('lastTransition', {
        from: event.data.from,
        to: event.data.to,
        timestamp: event.timestamp
      });
    });
    
    // Data collection
    this.stateGraph.on('data_collected', (event: FlowEvent) => {
      console.log(`Data collected in ${event.state}:`, Object.keys(event.data));
      const collected = this.metrics.get('dataCollected') || [];
      collected.push({
        state: event.state,
        fields: Object.keys(event.data),
        timestamp: event.timestamp
      });
      this.metrics.set('dataCollected', collected);
    });
    
    // Checkpoints
    this.stateGraph.on('checkpoint_saved', (event: FlowEvent) => {
      console.log(`Checkpoint saved at state: ${event.data.checkpointState}`);
    });
    
    // Parallel execution
    this.stateGraph.on('parallel_completed', (event: FlowEvent) => {
      console.log(`Parallel execution completed:`, event.data.results);
    });
    
    // Flow completion
    this.stateGraph.on('flow_completed', (event: FlowEvent) => {
      console.log(`Flow completed in ${event.data.totalDuration}ms`);
      this.saveFlowMetrics(event.data);
    });
    
    // Flow abandonment
    this.stateGraph.on('flow_abandoned', (event: FlowEvent) => {
      console.log(`Flow abandoned at ${event.state}: ${event.data.reason}`);
    });
  }
  
  /**
   * Update metrics based on response
   */
  private updateMetrics(response: AgentResponse): void {
    const responseTime = this.metrics.get('responseTime') || [];
    responseTime.push(Date.now());
    this.metrics.set('responseTime', responseTime);
    
    if (response.metadata?.extractedData) {
      const extractedFields = this.metrics.get('extractedFields') || new Set();
      Object.keys(response.metadata.extractedData).forEach(field => {
        extractedFields.add(field);
      });
      this.metrics.set('extractedFields', extractedFields);
    }
  }
  
  /**
   * Save flow metrics to database
   */
  private async saveFlowMetrics(data: any): Promise<void> {
    try {
      // This would save to a metrics table
      // For now, just log
      console.log('Flow metrics:', {
        flowConfigId: this.flowConfig?.id,
        duration: data.totalDuration,
        statesVisited: data.statesVisited,
        dataCollected: data.dataCollected,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error saving flow metrics:', error);
    }
  }
  
  /**
   * Create a simple linear flow from states array
   */
  static createLinearFlow(
    id: string,
    name: string,
    states: Array<{
      id: string;
      name: string;
      description: string;
      requiredData: string[];
      maxDuration?: number;
    }>
  ): FlowConfiguration {
    const flowStates: Record<string, any> = {};
    const transitions: any[] = [];
    
    // Create states
    states.forEach((state, index) => {
      flowStates[state.id] = {
        id: state.id,
        name: state.name,
        description: state.description,
        dataRequirements: {
          required: state.requiredData,
          optional: []
        },
        exitConditions: [{
          id: `${state.id}_complete`,
          type: 'data_complete',
          config: { fields: state.requiredData }
        }],
        maxDuration: state.maxDuration
      };
      
      // Create transition to next state
      if (index < states.length - 1) {
        transitions.push({
          id: `${state.id}_to_${states[index + 1].id}`,
          from: state.id,
          to: states[index + 1].id,
          condition: {
            type: 'all',
            rules: state.requiredData.map(field => ({
              type: 'data_exists',
              field
            }))
          },
          priority: 10
        });
      }
    });
    
    return {
      id,
      name,
      version: 1,
      states: flowStates,
      transitions,
      settings: {
        initialState: states[0].id,
        finalStates: [states[states.length - 1].id],
        checkpointStates: states.map(s => s.id),
        maxTotalDuration: 60,
        abandonmentBehavior: 'save_progress',
        parallelExecutionEnabled: false
      }
    };
  }
}