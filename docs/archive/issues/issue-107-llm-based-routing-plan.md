# Issue #107: Implement LLM-Based Intelligent Agent Routing System - Implementation Plan

**Issue URL**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/107

## Overview
Implement an LLM-based routing system for the OrchestratorAgent to intelligently route user queries to the appropriate specialized agents based on context, intent, and user journey phase.

## Problem Statement
- Agent selection is hard-coded through URL parameters (`/chat?agent=OnboardingAgent`)
- "Ask Oskar" input on dashboard is non-functional
- Users must manually select which agent to interact with
- No dynamic routing based on query content or context

## Analysis of Current System

### Existing Infrastructure
1. **Agent Framework**: Robust agent system with router, context management, and handoffs
2. **Flow System**: LangGraph-inspired flow system with state management
3. **Agent Types**: 9 specialized agents (Onboarding, Assessment, Discovery, etc.)
4. **Chat Infrastructure**: Streaming chat with conversation persistence
5. **Admin Configuration**: Agent config management at `/admin/agents/config`
6. **Knowledge Base**: TMS knowledge base integration for agents

### Current Routing Mechanism
- `AgentRouter` class handles message routing but relies on `context.currentAgent`
- No intelligent routing based on message content
- Handoffs are condition-based but not content-aware
- OrchestratorAgent exists but doesn't perform intelligent routing

### Admin System Analysis
1. **Agent Configuration Management**:
   - Dynamic agent configuration via `/admin/agents/config`
   - System prompts, flow configs, extraction rules stored in database
   - AgentConfigLoader loads configs with caching
   - Version control for agent configurations

2. **Conversation Monitoring**:
   - Admin dashboard shows active conversations and journey status
   - Tracks user progress through journey phases
   - Shows which agent is currently active
   - Detailed conversation view with message history

3. **Key Integration Points**:
   - AgentConfigurationService manages agent configs
   - Configs include systemPrompt that can define agent capabilities
   - Flow system supports state-based routing
   - All agents extend KnowledgeEnabledAgent base class

## Implementation Plan

### Phase 1: Core Routing Intelligence (Priority: High)

#### 1.1 Enhance Agent Configuration with Capabilities
**Approach**: Leverage existing agent configuration system to store capabilities
- Add `capabilities` field to agent configurations in database
- Store capability descriptions, examples, and routing keywords in config
- Use AgentConfigLoader to load capabilities along with prompts

**Update**: `/src/lib/services/agent-configuration.ts`
```typescript
// Add to AgentConfigInput interface
capabilities?: {
  description: string;
  examples: string[];
  prerequisites?: string[];
  relevantPhases?: string[];
  keywords?: string[];
}
```

#### 1.2 Create Agent Registry Service
**New File**: `/src/lib/agents/registry/AgentRegistry.ts`
```typescript
interface AgentCapability {
  name: string;
  description: string;
  examples: string[];
  prerequisites?: string[];
  relevantPhases?: string[];
  keywords?: string[];
}

class AgentRegistry {
  // Load capabilities from agent configurations
  async loadCapabilitiesFromConfigs(): Promise<Map<string, AgentCapability>>;
  
  // Get capabilities for routing decision
  async getCapabilitiesForRouting(context: AgentContext): Promise<AgentCapability[]>;
  
  // Check if agent prerequisites are met
  checkPrerequisites(agentName: string, context: AgentContext): boolean;
}
```

#### 1.3 Create Routing Service
**New File**: `/src/lib/agents/routing/RoutingService.ts`
```typescript
interface RoutingDecision {
  targetAgent: string;
  confidence: number;
  reasoning: string;
  suggestedContext?: Record<string, any>;
  alternativeAgents?: Array<{agent: string; confidence: number}>;
}

class RoutingService {
  constructor(
    private agentRegistry: AgentRegistry,
    private configLoader: AgentConfigLoader
  ) {}
  
  async analyzeIntent(message: string, context: AgentContext): Promise<RoutingDecision>;
  async routeMessage(message: string, context: AgentContext): Promise<RoutingDecision>;
  private buildRoutingPrompt(message: string, context: AgentContext, capabilities: AgentCapability[]): string;
  private parseRoutingResponse(response: string): RoutingDecision;
}
```

#### 1.4 Create Routing Prompts
**New File**: `/src/lib/agents/routing/prompts.ts`
```typescript
export const ROUTING_SYSTEM_PROMPT = `You are an intelligent routing system...`;
export const INTENT_CLASSIFICATION_PROMPT = `Classify the user's intent...`;
export const buildRoutingPrompt = (message: string, context: any, capabilities: any[]) => string;
```

#### 1.5 Update Admin UI for Agent Capabilities
**Update**: `/app/admin/agents/config/page.tsx`
- Add "Capabilities" tab to agent configuration
- Allow admins to define routing keywords, examples, and prerequisites
- Store capabilities in agent configuration

### Phase 2: Enhanced OrchestratorAgent (Priority: High)

#### 2.1 Update OrchestratorAgent
**Modify**: `/src/lib/agents/implementations/orchestrator-agent.ts`
- Integrate RoutingService for intelligent routing
- Override processMessage to analyze intent before responding
- Use loaded agent configurations for capability awareness
- Implement confidence thresholds for routing decisions

**Key Changes**:
```typescript
class OrchestratorAgent extends KnowledgeEnabledAgent {
  private routingService: RoutingService;
  
  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // First, analyze intent and determine routing
    const routingDecision = await this.routingService.routeMessage(message, context);
    
    if (routingDecision.confidence > 0.7 && routingDecision.targetAgent !== this.name) {
      // High confidence - route to target agent
      return this.createHandoffResponse(routingDecision);
    }
    
    // Low confidence - ask clarifying questions
    return this.handleAmbiguousQuery(message, routingDecision, context);
  }
}
```

#### 2.2 Add Routing Tools
**New File**: `/src/lib/agents/tools/routing-tools.ts`
```typescript
export const routingTools = [
  {
    name: 'analyze_user_intent',
    description: 'Analyze user message to determine intent and appropriate agent',
    parameters: {...}
  },
  {
    name: 'get_agent_capabilities',
    description: 'Retrieve capabilities of all available agents',
    parameters: {...}
  },
  {
    name: 'check_user_journey_status',
    description: 'Check user journey phase and progress',
    parameters: {...}
  }
];
```

### Phase 3: Dashboard Integration (Priority: High)

#### 3.1 Make "Ask Oskar" Functional
**Modify**: `/app/(dashboard)/dashboard/page.tsx`
- Convert to client component with state management
- Add input handling and navigation
- Redirect to chat with OrchestratorAgent
- Pass initial message as query parameter

#### 3.2 Create Ask Oskar Component
**New File**: `/components/dashboard/AskOskarInput.tsx`
```typescript
export function AskOskarInput() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  
  const handleSubmit = () => {
    const encodedQuery = encodeURIComponent(query);
    router.push(`/chat?agent=OrchestratorAgent&message=${encodedQuery}`);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask Oskar"
      />
    </form>
  );
}
```

### Phase 4: Dynamic Agent Switching (Priority: Medium)

#### 4.1 Update Chat Client
**Modify**: `/app/chat/ChatClientOptimized.tsx`
- Handle initial message from URL parameter
- Show current agent indicator
- Support mid-conversation agent switches
- Display routing explanations

#### 4.2 Update API Routes
**Modify**: `/app/api/agents/chat-streaming/route.ts`
- Process initial message parameter
- Support agent switching responses
- Handle routing metadata in responses

### Phase 5: UI Enhancements (Priority: Medium)

#### 5.1 Create Agent Indicator
**New File**: `/components/chat/AgentIndicator.tsx`
- Show current active agent
- Display agent transitions
- Show routing confidence
- Allow manual agent selection

#### 5.2 Create Routing Explanation
**New File**: `/components/chat/RoutingExplanation.tsx`
- Display routing decisions
- Show confidence scores
- Explain why an agent was chosen
- Allow user to override

### Phase 6: Testing & Monitoring (Priority: Medium)

#### 6.1 Create Routing Tests
**New File**: `/src/lib/agents/routing/__tests__/RoutingService.test.ts`
- Test intent classification
- Test routing decisions
- Test edge cases and ambiguous queries
- Test prerequisite checking

#### 6.2 Add Routing Analytics
**New File**: `/src/lib/agents/routing/analytics.ts`
- Log routing decisions
- Track confidence scores
- Monitor routing accuracy
- Identify improvement opportunities

## Implementation Order

1. **Week 1 - Core Routing**:
   - AgentRegistry with capabilities
   - RoutingService with LLM integration
   - Update OrchestratorAgent
   - Basic routing tests

2. **Week 1-2 - Dashboard Integration**:
   - Make "Ask Oskar" functional
   - Handle initial messages
   - Basic UI updates

3. **Week 2 - Dynamic Switching**:
   - Mid-conversation handoffs
   - Agent indicators
   - Routing explanations

4. **Week 2-3 - Polish & Testing**:
   - Comprehensive tests
   - Analytics implementation
   - Performance optimization

## Technical Considerations

### Performance Optimization
- Cache agent capabilities
- Use streaming for routing decisions
- Implement request batching
- Add circuit breaker for failures

### Cost Management
- Two-stage routing (quick intent → detailed routing)
- Cache common queries
- Use smaller models for intent classification
- Monitor token usage

### Error Handling
- Fallback to OrchestratorAgent on routing failure
- Graceful handling of LLM errors
- User-friendly error messages
- Retry logic with exponential backoff

## Key Design Decisions

### 1. Leverage Existing Infrastructure
- Use AgentConfigurationService to store agent capabilities
- Extend current admin UI to manage routing configuration
- Build on top of existing AgentRouter and handoff mechanisms
- Utilize KnowledgeEnabledAgent base class features

### 2. Configuration-Driven Routing
- Store agent capabilities in database alongside prompts
- Allow admins to update routing keywords and examples
- Version control for routing configurations
- Hot-reload capabilities without code changes

### 3. Two-Stage Routing Process
- Stage 1: Quick keyword/pattern matching for obvious cases
- Stage 2: LLM analysis for nuanced routing decisions
- Fallback to OrchestratorAgent for ambiguous cases

### 4. Context-Aware Decisions
- Consider user's journey phase (stored in database)
- Check completed steps and current progress
- Respect agent prerequisites (e.g., assessment requires onboarding)
- Use conversation history for better routing

## Success Criteria
- [ ] "Ask Oskar" input redirects to chat with query
- [ ] OrchestratorAgent routes messages intelligently
- [ ] 90%+ routing accuracy for common queries
- [ ] <500ms additional latency for routing
- [ ] Users can see and understand routing decisions
- [ ] Mid-conversation agent switches work smoothly
- [ ] Admin UI allows capability configuration
- [ ] Routing decisions logged for analysis

## Risks & Mitigations
1. **LLM Latency**: Use streaming and show loading states
2. **Incorrect Routing**: Allow user overrides, log for improvement
3. **Cost Overruns**: Implement usage limits and monitoring
4. **Complex Queries**: Fallback to clarification questions
5. **Database Schema Changes**: Use backward-compatible updates

## Testing Strategy
1. **Unit Tests**: Test routing logic with various scenarios
2. **Integration Tests**: Test end-to-end routing flow
3. **Admin UI Tests**: Test capability configuration
4. **Performance Tests**: Measure routing latency
5. **User Acceptance Tests**: Validate routing accuracy

## Next Steps
1. Create feature branch `feat/issue-107-llm-routing`
2. Update database schema for capabilities
3. Implement Phase 1 (Core Routing)
4. Update admin UI for capability management
5. Test with common scenarios
6. Deploy to staging for user testing