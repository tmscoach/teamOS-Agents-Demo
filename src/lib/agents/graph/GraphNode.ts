/**
 * GraphNode: Wrapper for agents as nodes in the flow graph
 */

import { Agent } from '../base';
import { AgentContext, AgentResponse, Message } from '../types';
import { FlowState, GraphExecutionContext } from './types';

export class GraphNode {
  private agent: Agent;
  private state: FlowState;
  private startTime?: Date;
  
  constructor(agent: Agent, state: FlowState) {
    this.agent = agent;
    this.state = state;
  }
  
  get id(): string {
    return this.state.id;
  }
  
  get name(): string {
    return this.state.name;
  }
  
  get isParallel(): boolean {
    return this.state.parallel || false;
  }
  
  get parallelNodes(): string[] {
    return this.state.nodes || [];
  }
  
  async execute(
    message: Message,
    context: GraphExecutionContext
  ): Promise<AgentResponse> {
    this.startTime = new Date();
    
    // Add state context to the execution
    const enhancedContext: GraphExecutionContext = {
      ...context,
      currentState: this.state.id,
      stateConfig: this.state,
      metadata: {
        ...context.metadata,
        graphState: this.state.id,
        requiredData: this.state.dataRequirements.required,
        availableTools: this.state.availableTools
      }
    };
    
    // Execute agent with enhanced context
    const response = await this.agent.processMessage(message.content, enhancedContext);
    
    // Extract data based on state requirements
    const extractedData = await this.extractRequiredData(response, context.collectedData);
    
    // Update collected data in context
    Object.assign(context.collectedData, extractedData);
    
    return {
      ...response,
      metadata: {
        ...response.metadata,
        stateId: this.state.id,
        extractedData,
        duration: Date.now() - this.startTime.getTime()
      }
    };
  }
  
  async checkExitConditions(context: GraphExecutionContext): Promise<boolean> {
    for (const condition of this.state.exitConditions) {
      const met = await this.evaluateExitCondition(condition, context);
      if (met) return true;
    }
    return false;
  }
  
  private async evaluateExitCondition(
    condition: any,
    context: GraphExecutionContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'data_complete':
        return this.checkDataComplete(condition.config.fields, context.collectedData);
        
      case 'time_elapsed':
        if (!this.startTime) return false;
        const elapsed = Date.now() - this.startTime.getTime();
        return elapsed >= (condition.config.duration || 0);
        
      case 'user_intent':
        // Check if user expressed intent to move forward
        return this.checkUserIntent(context);
        
      case 'parallel_complete':
        return this.checkParallelComplete(condition.config.nodes, context);
        
      case 'custom':
        return this.evaluateCustomCondition(condition.config.expression, context);
        
      default:
        return false;
    }
  }
  
  private checkDataComplete(fields: string[], collectedData: Record<string, any>): boolean {
    return fields.every(field => 
      collectedData[field] !== undefined && 
      collectedData[field] !== null &&
      collectedData[field] !== ''
    );
  }
  
  private checkUserIntent(context: GraphExecutionContext): boolean {
    // Check metadata or last message for intent signals
    const lastMessage = context.messageHistory?.[context.messageHistory.length - 1];
    if (!lastMessage) return false;
    
    const intentPatterns = [
      /let's move on/i,
      /next step/i,
      /continue/i,
      /ready to proceed/i,
      /what's next/i
    ];
    
    return intentPatterns.some(pattern => pattern.test(lastMessage.content));
  }
  
  private checkParallelComplete(nodes: string[], context: GraphExecutionContext): boolean {
    if (!context.parallelResults) return false;
    return nodes.every(node => node in context.parallelResults);
  }
  
  private evaluateCustomCondition(expression: string, context: GraphExecutionContext): boolean {
    try {
      // Create a safe evaluation context
      const evalContext = {
        data: context.collectedData,
        state: context.currentState,
        history: context.stateHistory,
        parallelResults: context.parallelResults
      };
      
      // Use Function constructor for safer evaluation
      const func = new Function('context', `
        const { data, state, history, parallelResults } = context;
        return ${expression};
      `);
      
      return func(evalContext);
    } catch (error) {
      console.error('Error evaluating custom condition:', error);
      return false;
    }
  }
  
  private async extractRequiredData(
    response: AgentResponse,
    existingData: Record<string, any>
  ): Promise<Record<string, any>> {
    const extracted: Record<string, any> = {};
    
    // Get extraction rules from agent if available
    if ('getExtractionRules' in this.agent) {
      const rules = (this.agent as any).getExtractionRules();
      
      // Extract based on rules
      for (const [field, rule] of Object.entries(rules)) {
        if (this.state.dataRequirements.required.includes(field) ||
            this.state.dataRequirements.optional.includes(field)) {
          const value = this.extractField(response.message || '', rule as any);
          if (value !== undefined) {
            extracted[field] = value;
          }
        }
      }
    }
    
    // Also check response metadata for extracted data
    if (response.metadata?.extractedData) {
      Object.assign(extracted, response.metadata.extractedData);
    }
    
    return extracted;
  }
  
  private extractField(content: string, rule: any): any {
    if (!rule.patterns || !Array.isArray(rule.patterns)) return undefined;
    
    for (const pattern of rule.patterns) {
      const regex = new RegExp(`${pattern}[:\s]+([^.!?]+)`, 'i');
      const match = content.match(regex);
      if (match) {
        const value = match[1].trim();
        
        // Convert based on type
        switch (rule.type) {
          case 'number':
            const num = parseFloat(value.replace(/[^\d.-]/g, ''));
            return isNaN(num) ? undefined : num;
            
          case 'boolean':
            return /yes|true|correct|affirmative/i.test(value);
            
          case 'array':
            return value.split(/[,;]/).map(v => v.trim()).filter(Boolean);
            
          default:
            return value;
        }
      }
    }
    
    return undefined;
  }
  
  getDuration(): number {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime.getTime();
  }
  
  getMaxDuration(): number {
    return this.state.maxDuration ? this.state.maxDuration * 60 * 1000 : Infinity;
  }
  
  isTimedOut(): boolean {
    return this.getDuration() >= this.getMaxDuration();
  }
}