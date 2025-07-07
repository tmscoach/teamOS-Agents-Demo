/**
 * Example usage of the Agent Framework
 * This file demonstrates how to set up and use the agent system
 */

import {
  AgentRouter,
  ContextManager,
  ConversationStore,
  OpenAIAgent,
  OpenAIAgentConfig,
} from './index';

// Example: Create a custom agent
class GreetingAgent extends OpenAIAgent {
  constructor() {
    const config: OpenAIAgentConfig = {
      name: 'GreetingAgent',
      description: 'A friendly agent that greets users',
      handoffDescription: 'Start here for a warm welcome',
      instructions: `
        You are a friendly greeting agent. Your job is to:
        1. Welcome users warmly
        2. Ask about their day
        3. Offer to help them get started
        4. Hand off to the TaskAgent when they're ready to work
      `,
      handoffs: [
        {
          targetAgent: 'TaskAgent',
        },
      ],
      tools: [
        {
          name: 'get_time_of_day',
          description: 'Get the current time of day for appropriate greetings',
          parameters: {
            type: 'object',
            properties: {},
          },
          execute: async () => {
            const hour = new Date().getHours();
            let timeOfDay = 'day';
            
            if (hour < 12) timeOfDay = 'morning';
            else if (hour < 17) timeOfDay = 'afternoon';
            else timeOfDay = 'evening';
            
            return {
              success: true,
              output: { timeOfDay, hour },
            };
          },
        },
      ],
    };

    super(config);
  }
}

// Example: Task management agent
class TaskAgent extends OpenAIAgent {
  constructor() {
    const config: OpenAIAgentConfig = {
      name: 'TaskAgent',
      description: 'Helps users manage their tasks',
      handoffDescription: 'Hand off here to manage tasks',
      instructions: `
        You are a task management agent. Help users:
        1. Create new tasks
        2. List existing tasks
        3. Mark tasks as complete
        4. Prioritize their work
      `,
      tools: [
        {
          name: 'create_task',
          description: 'Create a new task',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              priority: { 
                type: 'string', 
                enum: ['low', 'medium', 'high'],
                description: 'Task priority',
              },
            },
            required: ['title'],
          },
          execute: async (params) => {
            // In a real app, this would save to a database
            console.log('Creating task:', params);
            return {
              success: true,
              output: {
                taskId: `task-${Date.now()}`,
                ...params,
                createdAt: new Date().toISOString(),
              },
            };
          },
        },
      ],
      handoffs: [
        {
          targetAgent: 'GreetingAgent', // Can go back to greeting
        },
      ],
    };

    super(config);
  }
}

/**
 * Example: Setting up the agent system
 */
export async function setupAgentSystem() {
  // 1. Create the router with context manager
  const contextManager = new ContextManager();
  const router = new AgentRouter({ contextManager });

  // 2. Register agents
  router.registerAgent(new GreetingAgent());
  router.registerAgent(new TaskAgent());

  // 3. Validate handoff configuration
  const validation = router.validateHandoffs();
  if (!validation.valid) {
    console.error('Handoff validation errors:', validation.errors);
    throw new Error('Invalid handoff configuration');
  }

  return { router, contextManager };
}

/**
 * Example: Using the agent system
 */
export async function exampleConversation() {
  // Set up the system
  const { router, contextManager } = await setupAgentSystem();

  // Create a new conversation
  const context = await router.createConversation('team-123', 'manager-456', {
    initialAgent: 'GreetingAgent',
    metadata: {
      channel: 'web',
      userTimezone: 'America/New_York',
    },
  });

  console.log('Created conversation:', context.conversationId);

  // Process some messages
  try {
    // First message
    let response = await router.processConversationMessage(
      context.conversationId,
      'Hello!'
    );
    console.log('Agent response:', response.message);

    // Follow-up message
    response = await router.processConversationMessage(
      context.conversationId,
      "I'd like to manage my tasks"
    );
    console.log('Agent response:', response.message);

    // Check if handoff occurred
    if (response.handoff) {
      console.log('Handoff to:', response.handoff.targetAgent);
    }

    // Create a task
    response = await router.processConversationMessage(
      context.conversationId,
      'Create a task: Review agent framework documentation'
    );
    console.log('Agent response:', response.message);

    // Check events
    console.log('Events:', response.events.map(e => e.type));

  } catch (error) {
    console.error('Error in conversation:', error);
  }
}

/**
 * Example: Using with persistence
 */
export async function exampleWithPersistence(prisma: any) {
  const conversationStore = new ConversationStore(prisma);
  const contextManager = new ContextManager();
  const router = new AgentRouter({ contextManager });

  // Register agents
  router.registerAgent(new GreetingAgent());
  router.registerAgent(new TaskAgent());

  // Create a new conversation in the database
  const conversationId = await conversationStore.createConversation(
    'team-789',
    'manager-012',
    {
      initialAgent: 'GreetingAgent',
      phase: 'onboarding',
    }
  );

  // Load and process
  const data = await conversationStore.loadConversation(conversationId);
  if (!data) throw new Error('Failed to load conversation');

  const response = await router.routeMessage('Hello there!', data.context);

  // Save the updated state
  await conversationStore.saveConversation(
    conversationId,
    response.context,
    response.context.messageHistory,
    response.events
  );

  // Get conversation stats
  const stats = await conversationStore.getConversationStats(conversationId);
  console.log('Conversation stats:', stats);
}

/**
 * Example: Creating agents from configuration
 */
export function createAgentFromConfig(config: OpenAIAgentConfig): OpenAIAgent {
  return new (class extends OpenAIAgent {
    constructor() {
      super(config);
    }
  })();
}

// Usage example
const customAgent = createAgentFromConfig({
  name: 'CustomAgent',
  description: 'A dynamically created agent',
  handoffDescription: 'Custom agent for specific tasks',
  instructions: 'Help users with custom requirements',
  llmConfig: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.8,
  },
});

/**
 * Example: Error handling and recovery
 */
export async function exampleErrorHandling() {
  const { router } = await setupAgentSystem();

  // Set up error event listeners
  router.on('message:error', (error) => {
    console.error('Message processing error:', error);
    // Could send to monitoring service
  });

  router.on('agent:handoff', (handoff) => {
    console.log('Handoff event:', handoff);
    // Could track handoffs for analytics
  });

  // Process with error handling
  try {
    const context = await router.createConversation('team-999', 'manager-999');
    
    // This might fail if the agent has guardrails
    await router.processConversationMessage(
      context.conversationId,
      'Some potentially problematic input'
    );
  } catch (error) {
    console.error('Caught error:', error);
    // Implement recovery logic
  }
}