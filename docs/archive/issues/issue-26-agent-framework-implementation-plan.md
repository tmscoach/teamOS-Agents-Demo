# Issue #26: Build Foundational Agent Framework - Implementation Plan

**Issue URL**: https://github.com/teamOS-Agents-Demo/issues/26

## Overview

Building the core agent framework for the multi-agent TMS transformation system. This framework will enable agent definition, execution, context management, and handoffs between specialized agents.

## Analysis Summary

1. **Existing Documentation**: Found comprehensive implementation plan at `docs/implementation/issue-26-agent-framework-plan.md`
2. **Reference Architecture**: Analyzed Python patterns from `openai-cs-agents-demo` to adapt
3. **Current State**: No agent code exists yet - greenfield implementation
4. **Dependencies**: TypeScript, Next.js, OpenAI SDK, Prisma, WebSockets

## Implementation Breakdown

### Phase 1: Core Infrastructure (Priority: High)
1. **Base Agent System** (`src/lib/agents/base.ts`)
   - Abstract Agent class with processMessage method
   - Type-safe interfaces for Agent, Tool, Guardrail
   - Context management interfaces

2. **Context Management** (`src/lib/agents/context.ts`)
   - ContextManager class for context lifecycle
   - Type-safe AgentContext interface
   - Support for team transformation phases

3. **Message Router** (`src/lib/agents/router.ts`)
   - AgentRouter for message routing
   - Agent registration system
   - Event-based architecture for real-time updates

### Phase 2: OpenAI Integration
1. **LLM Provider** (`src/lib/agents/llm.ts`)
   - OpenAI client wrapper
   - Support for function calling
   - Error handling and retries

2. **OpenAI Agent Base** (`src/lib/agents/implementations/base-openai-agent.ts`)
   - Extends base Agent class
   - Implements OpenAI-specific logic
   - Tool execution and handoff handling

### Phase 3: Persistence Layer
1. **Prisma Schema** (`prisma/schema.prisma`)
   - Conversation model
   - Message history
   - Agent events tracking

2. **Persistence Service** (`src/lib/agents/persistence.ts`)
   - ConversationStore class
   - Save/load conversation state
   - Event logging

### Phase 4: API & Real-time
1. **REST API** (`src/app/api/agents/chat/route.ts`)
   - POST endpoint for chat messages
   - Context retrieval and management

2. **WebSocket Support** (`src/app/api/agents/ws/route.ts`)
   - Real-time event streaming
   - Agent handoff notifications

### Phase 5: Testing & Examples
1. **Unit Tests** (`src/lib/agents/__tests__/`)
   - Test agent processing
   - Test handoffs
   - Test tool execution

2. **Mock Agents** (`src/lib/agents/__tests__/mock-agents.ts`)
   - Example agent implementations
   - Testing utilities

## Key Design Decisions

1. **TypeScript First**: Full type safety with generics for context
2. **Event-Driven**: Support real-time updates via events
3. **Modular Tools**: Decoupled tool system for flexibility
4. **Async Throughout**: All operations are async/await
5. **Context Persistence**: Every conversation state is persisted

## Implementation Order

1. Core interfaces and types
2. Base Agent class
3. Context management
4. Message router
5. OpenAI integration
6. Tool system stub
7. Handoff mechanism
8. Persistence layer
9. API routes
10. Basic tests
11. Example agent

## Success Criteria

- [ ] Agent can process messages
- [ ] Context persists across conversations
- [ ] Handoffs work between agents
- [ ] Tools can be registered and executed
- [ ] Type safety throughout
- [ ] Basic tests pass
- [ ] Example agent works end-to-end

## Next Steps

1. Create branch: `feat/issue-26-agent-framework`
2. Install dependencies: OpenAI SDK, Prisma
3. Implement Phase 1 core infrastructure
4. Test basic agent execution
5. Iterate through remaining phases