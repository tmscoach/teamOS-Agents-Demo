# Implementation Plan: Issue #26 - Agent Framework Architecture

## Overview
This document provides a detailed implementation plan for building the Agent Framework Architecture that will serve as the foundation for the TMS multi-agent system.

## Architecture Design

### Core Components

```typescript
// 1. Base Agent Interface
interface BaseAgent {
  name: string;
  description: string;
  handoffDescription: string;
  instructions: string | ((context: AgentContext) => string);
  tools: AgentTool[];
  handoffs: HandoffConfig[];
  inputGuardrails: Guardrail[];
}

// 2. Agent Context
interface AgentContext {
  // Team transformation context
  teamId: string;
  managerId: string;
  transformationPhase: 'onboarding' | 'assessment' | 'analysis' | 'transformation' | 'monitoring';
  
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

// 3. Message Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 4. Agent Event Types
type AgentEvent = 
  | MessageEvent
  | HandoffEvent
  | ToolCallEvent
  | ToolOutputEvent
  | ContextUpdateEvent;

interface HandoffEvent {
  type: 'handoff';
  sourceAgent: string;
  targetAgent: string;
  reason: string;
  context: AgentContext;
}
```

## Implementation Steps

### Phase 1: Core Infrastructure (Days 1-3)

#### 1.1 Set up base agent system
```typescript
// src/lib/agents/base.ts
export abstract class Agent implements BaseAgent {
  constructor(config: AgentConfig) {
    this.name = config.name;
    this.description = config.description;
    // ... initialize other properties
  }

  abstract async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse>;
  
  protected async executeHandoff(
    targetAgent: string,
    reason: string,
    context: AgentContext
  ): Promise<HandoffEvent> {
    // Implement handoff logic
  }
  
  protected async callTool(
    toolName: string,
    args: Record<string, any>,
    context: AgentContext
  ): Promise<ToolOutput> {
    // Implement tool execution
  }
}
```

#### 1.2 Create context management
```typescript
// src/lib/agents/context.ts
export class ContextManager {
  private contexts: Map<string, AgentContext> = new Map();
  
  async createContext(teamId: string, managerId: string): Promise<AgentContext> {
    // Initialize new context
  }
  
  async updateContext(
    conversationId: string, 
    updates: Partial<AgentContext>
  ): Promise<void> {
    // Update and persist context
  }
  
  async getContext(conversationId: string): Promise<AgentContext | null> {
    // Retrieve context
  }
}
```

#### 1.3 Implement message routing
```typescript
// src/lib/agents/router.ts
export class AgentRouter {
  private agents: Map<string, Agent> = new Map();
  
  registerAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
  }
  
  async routeMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    const currentAgent = this.agents.get(context.currentAgent);
    if (!currentAgent) {
      throw new Error(`Agent ${context.currentAgent} not found`);
    }
    
    return await currentAgent.processMessage(message, context);
  }
}
```

### Phase 2: OpenAI Integration (Days 4-5)

#### 2.1 Set up OpenAI client
```typescript
// src/lib/agents/llm.ts
import OpenAI from 'openai';

export class LLMProvider {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  async generateResponse(
    messages: OpenAI.ChatCompletionMessageParam[],
    tools?: OpenAI.ChatCompletionTool[],
    model: string = 'gpt-4-turbo-preview'
  ): Promise<OpenAI.ChatCompletion> {
    return await this.client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: tools ? 'auto' : undefined,
    });
  }
}
```

#### 2.2 Create agent implementation
```typescript
// src/lib/agents/implementations/base-openai-agent.ts
export class OpenAIAgent extends Agent {
  private llm: LLMProvider;
  
  constructor(config: AgentConfig) {
    super(config);
    this.llm = new LLMProvider();
  }
  
  async processMessage(
    message: string,
    context: AgentContext
  ): Promise<AgentResponse> {
    // Convert to OpenAI format
    const messages = this.buildMessages(message, context);
    const tools = this.buildTools();
    
    // Get LLM response
    const completion = await this.llm.generateResponse(messages, tools);
    
    // Process response and handle tool calls/handoffs
    return this.processCompletion(completion, context);
  }
}
```

### Phase 3: Persistence Layer (Days 6-7)

#### 3.1 Define Prisma schema
```prisma
// prisma/schema.prisma
model Conversation {
  id              String   @id @default(cuid())
  teamId          String
  managerId       String
  currentAgent    String
  phase           String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  messages        Message[]
  events          AgentEvent[]
  contextData     Json
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  role            String
  content         String
  agent           String?
  timestamp       DateTime @default(now())
  metadata        Json?
  
  conversation    Conversation @relation(fields: [conversationId], references: [id])
}

model AgentEvent {
  id              String   @id @default(cuid())
  conversationId  String
  type            String
  agent           String
  content         String
  metadata        Json?
  timestamp       DateTime @default(now())
  
  conversation    Conversation @relation(fields: [conversationId], references: [id])
}
```

#### 3.2 Create persistence service
```typescript
// src/lib/agents/persistence.ts
import { PrismaClient } from '@prisma/client';

export class ConversationStore {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  async saveConversation(
    conversationId: string,
    context: AgentContext,
    messages: Message[],
    events: AgentEvent[]
  ): Promise<void> {
    // Save to database
  }
  
  async loadConversation(conversationId: string): Promise<{
    context: AgentContext;
    messages: Message[];
    events: AgentEvent[];
  } | null> {
    // Load from database
  }
}
```

### Phase 4: API Integration (Days 8-9)

#### 4.1 Create API routes
```typescript
// src/app/api/agents/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AgentRouter } from '@/lib/agents/router';
import { ContextManager } from '@/lib/agents/context';

export async function POST(req: NextRequest) {
  const { conversationId, message } = await req.json();
  
  const contextManager = new ContextManager();
  const router = new AgentRouter();
  
  // Get or create context
  let context = await contextManager.getContext(conversationId);
  if (!context) {
    context = await contextManager.createContext(/* params */);
  }
  
  // Route message to appropriate agent
  const response = await router.routeMessage(message, context);
  
  return NextResponse.json(response);
}
```

#### 4.2 Set up WebSocket for real-time updates
```typescript
// src/app/api/agents/ws/route.ts
import { WebSocketServer } from 'ws';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
      // Handle real-time agent events
    });
  });
}
```

### Phase 5: Testing & Validation (Days 10-11)

#### 5.1 Create test harness
```typescript
// src/lib/agents/__tests__/agent.test.ts
describe('Agent Framework', () => {
  it('should handle basic message processing', async () => {
    const agent = new TestAgent(config);
    const context = createTestContext();
    
    const response = await agent.processMessage('Hello', context);
    
    expect(response.message).toBeDefined();
  });
  
  it('should handle agent handoffs', async () => {
    // Test handoff logic
  });
  
  it('should execute tools correctly', async () => {
    // Test tool execution
  });
});
```

#### 5.2 Create mock agents for testing
```typescript
// src/lib/agents/__tests__/mock-agents.ts
export class MockOnboardingAgent extends OpenAIAgent {
  constructor() {
    super({
      name: 'Onboarding Agent',
      description: 'Engages team managers',
      // ... config
    });
  }
}
```

## Deliverables Checklist

- [ ] Base agent abstract class
- [ ] Context management system
- [ ] Message routing engine
- [ ] OpenAI integration layer
- [ ] Tool execution framework stub
- [ ] Handoff mechanism
- [ ] Prisma schema for persistence
- [ ] API routes for agent communication
- [ ] WebSocket support for real-time events
- [ ] Comprehensive test suite
- [ ] Documentation and usage examples

## Dependencies

- Next.js 14+ (already in place)
- OpenAI SDK (`npm install openai`)
- Prisma (`npm install prisma @prisma/client`)
- WebSocket support (`npm install ws @types/ws`)
- Testing utilities (Jest, Testing Library)

## Migration from Python Reference

The `openai-cs-agents-demo` uses Python with these key patterns:
1. **Agent class with instructions** → TypeScript abstract class
2. **Runner.run()** → AgentRouter.routeMessage()
3. **Context wrapper** → ContextManager
4. **Guardrails** → Middleware pattern
5. **Tool decorators** → Tool registration system

## Next Steps After Completion

Once Issue #26 is complete, the following can proceed in parallel:
- Issue #36: Knowledge Base System (critical path)
- Issue #29: Tool Execution Framework
- Issue #31: Agent Testing Framework

## Estimated Timeline

- **Total Duration**: 11 days
- **Critical Path**: Days 1-5 (Core + OpenAI)
- **Can parallelize**: Persistence (Days 6-7) with API (Days 8-9)

## Risk Mitigation

1. **Complex state management**: Use Redux or Zustand if context becomes unwieldy
2. **OpenAI rate limits**: Implement retry logic and caching
3. **Real-time scaling**: Consider using Pusher or Ably instead of raw WebSockets
4. **Type safety**: Use Zod for runtime validation of agent responses