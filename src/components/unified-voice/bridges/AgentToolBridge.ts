import { AgentTool } from '@/src/lib/agents/types';

/**
 * AgentToolBridge
 * 
 * Bridges server-side agent tools to work over WebSocket with OpenAI Realtime API.
 * Each tool is converted to a function call that triggers an API request back to our server.
 */
export class AgentToolBridge {
  /**
   * Convert agent tools to OpenAI Realtime format
   */
  static convertToRealtimeTools(agentTools: AgentTool[]): any[] {
    return agentTools.map(tool => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * Execute a tool via API call
   */
  static async executeTool(
    toolName: string, 
    args: any,
    context?: { subscriptionId?: string; userId?: string }
  ): Promise<any> {
    try {
      console.log(`[AgentToolBridge] Executing tool: ${toolName}`, args);
      
      // Convert underscores to hyphens for API path
      const apiPath = toolName.replace(/_/g, '-');
      
      // Route to the appropriate API endpoint
      const response = await fetch(`/api/voice-tools/${apiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...args,
          context // Pass any additional context
        })
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`[AgentToolBridge] Tool result:`, result);
      
      return result;
    } catch (error) {
      console.error(`[AgentToolBridge] Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Register tool handlers for OpenAI Realtime connection
   */
  static registerToolHandlers(
    realtimeConnection: any,
    agentTools: AgentTool[],
    context?: any
  ): void {
    // Create a map of tool names for quick lookup
    const toolMap = new Map(agentTools.map(t => [t.name, t]));
    
    // Handle function calls from OpenAI
    realtimeConnection.on('response.function_call_arguments.done', async (event: any) => {
      const { name, arguments: argsStr, call_id } = event;
      
      console.log(`[AgentToolBridge] Function call received: ${name}`);
      
      if (!toolMap.has(name)) {
        console.error(`[AgentToolBridge] Unknown tool: ${name}`);
        await realtimeConnection.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id,
            output: JSON.stringify({
              success: false,
              error: `Unknown tool: ${name}`
            })
          }
        });
        return;
      }
      
      try {
        // Parse arguments
        const args = JSON.parse(argsStr);
        
        // Execute the tool via API
        const result = await this.executeTool(name, args, context);
        
        // Send result back to OpenAI
        await realtimeConnection.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id,
            output: JSON.stringify(result)
          }
        });
        
        // Trigger a response to continue the conversation
        await realtimeConnection.send({
          type: 'response.create'
        });
      } catch (error) {
        console.error(`[AgentToolBridge] Error handling function call:`, error);
        
        await realtimeConnection.send({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id,
            output: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        });
      }
    });
  }
}