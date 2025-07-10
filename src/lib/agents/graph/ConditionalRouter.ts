/**
 * ConditionalRouter: Handles dynamic routing logic based on conditions
 */

import { 
  FlowTransition, 
  TransitionCondition, 
  TransitionRule, 
  GraphExecutionContext 
} from './types';

export class ConditionalRouter {
  private transitions: FlowTransition[];
  
  constructor(transitions: FlowTransition[]) {
    this.transitions = transitions;
  }
  
  /**
   * Find the next state based on current state and context
   */
  async findNextState(
    currentState: string,
    context: GraphExecutionContext
  ): Promise<string | null> {
    // Get all transitions from current state
    const possibleTransitions = this.transitions
      .filter(t => t.from === currentState)
      .sort((a, b) => b.priority - a.priority);
    
    // Evaluate each transition in priority order
    for (const transition of possibleTransitions) {
      const conditionMet = await this.evaluateCondition(transition.condition, context);
      if (conditionMet) {
        return transition.to;
      }
    }
    
    return null;
  }
  
  /**
   * Get all possible next states (for visualization/debugging)
   */
  getPossibleNextStates(currentState: string): string[] {
    return this.transitions
      .filter(t => t.from === currentState)
      .map(t => t.to);
  }
  
  /**
   * Evaluate a transition condition
   */
  private async evaluateCondition(
    condition: TransitionCondition,
    context: GraphExecutionContext
  ): Promise<boolean> {
    const results = await Promise.all(
      condition.rules.map(rule => this.evaluateRule(rule, context))
    );
    
    switch (condition.type) {
      case 'all':
        return results.every(r => r);
      case 'any':
        return results.some(r => r);
      case 'custom':
        return this.evaluateCustomCondition(condition, context);
      default:
        return false;
    }
  }
  
  /**
   * Evaluate a single rule
   */
  private async evaluateRule(
    rule: TransitionRule,
    context: GraphExecutionContext
  ): Promise<boolean> {
    const { collectedData } = context;
    
    switch (rule.type) {
      case 'data_exists':
        return this.checkDataExists(rule.field!, collectedData);
        
      case 'data_equals':
        return this.checkDataEquals(rule.field!, rule.value, collectedData);
        
      case 'data_matches':
        return this.checkDataMatches(rule.field!, rule.pattern!, collectedData);
        
      case 'custom':
        return this.evaluateCustomRule(rule.expression!, context);
        
      default:
        return false;
    }
  }
  
  private checkDataExists(field: string, data: Record<string, any>): boolean {
    // Handle nested fields (e.g., "user.name")
    const fields = field.split('.');
    let current = data;
    
    for (const f of fields) {
      if (current === null || current === undefined || !(f in current)) {
        return false;
      }
      current = current[f];
    }
    
    return current !== null && current !== undefined && current !== '';
  }
  
  private checkDataEquals(field: string, value: any, data: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(field, data);
    
    // Handle different types of equality
    if (Array.isArray(value)) {
      return value.includes(fieldValue);
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(fieldValue) === JSON.stringify(value);
    }
    
    return fieldValue === value;
  }
  
  private checkDataMatches(field: string, pattern: RegExp, data: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(field, data);
    
    if (typeof fieldValue !== 'string') {
      return false;
    }
    
    return pattern.test(fieldValue);
  }
  
  private getFieldValue(field: string, data: Record<string, any>): any {
    const fields = field.split('.');
    let current = data;
    
    for (const f of fields) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[f];
    }
    
    return current;
  }
  
  private evaluateCustomRule(expression: string, context: GraphExecutionContext): boolean {
    try {
      const func = new Function('context', `
        const { collectedData, currentState, stateHistory, parallelResults } = context;
        return ${expression};
      `);
      
      return func(context);
    } catch (error) {
      console.error('Error evaluating custom rule:', error);
      return false;
    }
  }
  
  private evaluateCustomCondition(
    condition: TransitionCondition,
    context: GraphExecutionContext
  ): boolean {
    // For custom conditions, we expect the first rule to contain the full expression
    const customRule = condition.rules.find(r => r.type === 'custom');
    if (!customRule || !customRule.expression) {
      return false;
    }
    
    return this.evaluateCustomRule(customRule.expression, context);
  }
  
  /**
   * Validate all transitions for consistency
   */
  validateTransitions(): string[] {
    const errors: string[] = [];
    const stateMap = new Map<string, string[]>();
    
    // Build state connectivity map
    for (const transition of this.transitions) {
      if (!stateMap.has(transition.from)) {
        stateMap.set(transition.from, []);
      }
      stateMap.get(transition.from)!.push(transition.to);
    }
    
    // Check for duplicate transitions with same priority
    const transitionKeys = new Map<string, number>();
    for (const transition of this.transitions) {
      const key = `${transition.from}-${transition.to}-${transition.priority}`;
      if (transitionKeys.has(key)) {
        errors.push(
          `Duplicate transition from '${transition.from}' to '${transition.to}' with same priority ${transition.priority}`
        );
      }
      transitionKeys.set(key, 1);
    }
    
    // Check for missing required fields in rules
    for (const transition of this.transitions) {
      for (const rule of transition.condition.rules) {
        if (rule.type !== 'custom' && !rule.field) {
          errors.push(
            `Rule in transition '${transition.id}' is missing required field`
          );
        }
        if (rule.type === 'data_equals' && rule.value === undefined) {
          errors.push(
            `Rule in transition '${transition.id}' is missing required value`
          );
        }
        if (rule.type === 'custom' && !rule.expression) {
          errors.push(
            `Custom rule in transition '${transition.id}' is missing expression`
          );
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Get transition by ID
   */
  getTransition(id: string): FlowTransition | undefined {
    return this.transitions.find(t => t.id === id);
  }
  
  /**
   * Get all transitions from a specific state
   */
  getTransitionsFrom(state: string): FlowTransition[] {
    return this.transitions
      .filter(t => t.from === state)
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get all transitions to a specific state
   */
  getTransitionsTo(state: string): FlowTransition[] {
    return this.transitions.filter(t => t.to === state);
  }
}