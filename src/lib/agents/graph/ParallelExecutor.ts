/**
 * ParallelExecutor: Handles parallel execution of multiple graph nodes
 */

import { GraphNode } from './GraphNode';
import { GraphExecutionContext, ParallelExecutionResult } from './types';
import { Message } from '../types';

export class ParallelExecutor {
  private maxConcurrency: number;
  private timeout: number;
  
  constructor(maxConcurrency: number = 5, timeout: number = 60000) {
    this.maxConcurrency = maxConcurrency;
    this.timeout = timeout;
  }
  
  /**
   * Execute multiple nodes in parallel
   */
  async executeParallel(
    nodes: GraphNode[],
    message: Message,
    context: GraphExecutionContext
  ): Promise<Record<string, ParallelExecutionResult>> {
    const results: Record<string, ParallelExecutionResult> = {};
    
    // Create execution promises with timeout
    const executions = nodes.map(node => this.createExecutionPromise(node, message, context));
    
    // Execute with concurrency control
    const chunks = this.chunkArray(executions, this.maxConcurrency);
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(chunk);
      
      // Process results
      chunkResults.forEach((result, index) => {
        const node = nodes[chunks.indexOf(chunk) * this.maxConcurrency + index];
        
        if (result.status === 'fulfilled') {
          results[node.id] = result.value;
        } else {
          results[node.id] = {
            nodeId: node.id,
            success: false,
            error: result.reason?.message || 'Unknown error',
            duration: 0
          };
        }
      });
    }
    
    return results;
  }
  
  /**
   * Create an execution promise for a single node with timeout
   */
  private createExecutionPromise(
    node: GraphNode,
    message: Message,
    context: GraphExecutionContext
  ): Promise<ParallelExecutionResult> {
    const startTime = Date.now();
    
    const executionPromise = node.execute(message, context).then(response => {
      const duration = Date.now() - startTime;
      
      return {
        nodeId: node.id,
        success: true,
        data: {
          response,
          extractedData: response.metadata?.extractedData || {}
        },
        duration
      };
    });
    
    const timeoutPromise = new Promise<ParallelExecutionResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Node ${node.id} execution timed out after ${this.timeout}ms`));
      }, this.timeout);
    });
    
    return Promise.race([executionPromise, timeoutPromise]).catch(error => ({
      nodeId: node.id,
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    }));
  }
  
  /**
   * Execute nodes with dependencies
   */
  async executeWithDependencies(
    nodes: GraphNode[],
    dependencies: Record<string, string[]>,
    message: Message,
    context: GraphExecutionContext
  ): Promise<Record<string, ParallelExecutionResult>> {
    const results: Record<string, ParallelExecutionResult> = {};
    const completed = new Set<string>();
    const executing = new Set<string>();
    
    while (completed.size < nodes.length) {
      // Find nodes ready to execute (all dependencies completed)
      const ready = nodes.filter(node => 
        !completed.has(node.id) &&
        !executing.has(node.id) &&
        (dependencies[node.id] || []).every(dep => completed.has(dep))
      );
      
      if (ready.length === 0 && executing.size === 0) {
        // Circular dependency or invalid configuration
        throw new Error('Circular dependency detected or invalid dependency configuration');
      }
      
      if (ready.length > 0) {
        // Mark as executing
        ready.forEach(node => executing.add(node.id));
        
        // Execute ready nodes in parallel
        const batchResults = await this.executeParallel(ready, message, {
          ...context,
          parallelResults: results
        });
        
        // Update results and mark as completed
        Object.entries(batchResults).forEach(([nodeId, result]) => {
          results[nodeId] = result;
          completed.add(nodeId);
          executing.delete(nodeId);
        });
      }
      
      // Wait a bit before next iteration if nothing is ready
      if (ready.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
  
  /**
   * Aggregate results from parallel execution
   */
  aggregateResults(results: Record<string, ParallelExecutionResult>): {
    allSuccessful: boolean;
    successCount: number;
    failureCount: number;
    totalDuration: number;
    extractedData: Record<string, any>;
    errors: Record<string, string>;
  } {
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;
    const extractedData: Record<string, any> = {};
    const errors: Record<string, string> = {};
    
    Object.entries(results).forEach(([nodeId, result]) => {
      if (result.success) {
        successCount++;
        if (result.data?.extractedData) {
          Object.assign(extractedData, result.data.extractedData);
        }
      } else {
        failureCount++;
        errors[nodeId] = result.error || 'Unknown error';
      }
      totalDuration = Math.max(totalDuration, result.duration);
    });
    
    return {
      allSuccessful: failureCount === 0,
      successCount,
      failureCount,
      totalDuration,
      extractedData,
      errors
    };
  }
  
  /**
   * Execute nodes with retry logic
   */
  async executeWithRetry(
    node: GraphNode,
    message: Message,
    context: GraphExecutionContext,
    maxRetries: number = 3
  ): Promise<ParallelExecutionResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.createExecutionPromise(node, message, context);
        if (result.success) {
          return result;
        }
        
        lastError = new Error(result.error || 'Execution failed');
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    return {
      nodeId: node.id,
      success: false,
      error: lastError?.message || 'Max retries exceeded',
      duration: 0
    };
  }
  
  /**
   * Chunk array for concurrency control
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Validate parallel execution configuration
   */
  validateConfiguration(
    nodes: GraphNode[],
    dependencies?: Record<string, string[]>
  ): string[] {
    const errors: string[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));
    
    // Check for duplicate node IDs
    if (nodeIds.size !== nodes.length) {
      errors.push('Duplicate node IDs detected');
    }
    
    // Validate dependencies
    if (dependencies) {
      Object.entries(dependencies).forEach(([nodeId, deps]) => {
        if (!nodeIds.has(nodeId)) {
          errors.push(`Dependency defined for non-existent node: ${nodeId}`);
        }
        
        deps.forEach(dep => {
          if (!nodeIds.has(dep)) {
            errors.push(`Invalid dependency ${dep} for node ${nodeId}`);
          }
        });
      });
      
      // Check for circular dependencies
      const circular = this.detectCircularDependencies(dependencies);
      if (circular.length > 0) {
        errors.push(`Circular dependencies detected: ${circular.join(' -> ')}`);
      }
    }
    
    return errors;
  }
  
  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(dependencies: Record<string, string[]>): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const deps = dependencies[node] || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) {
            return true;
          }
        } else if (recursionStack.has(dep)) {
          path.push(dep);
          return true;
        }
      }
      
      path.pop();
      recursionStack.delete(node);
      return false;
    };
    
    for (const node of Object.keys(dependencies)) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          // Return the cycle path
          const cycleStart = path[path.length - 1];
          const cycleIndex = path.indexOf(cycleStart);
          return path.slice(cycleIndex);
        }
      }
    }
    
    return [];
  }
}