# Issue 54: Implement LangGraph-Inspired Flow System with Admin Configuration

## GitHub Issue Link
https://github.com/tmscoach/teamOS-Agents-Demo/issues/54

## Overview
Transform the current linear agent flows into a graph-based system that supports parallel execution, state checkpointing, and conditional routing - all configurable through the admin interface. This must integrate seamlessly with the existing onboarding flow that managers are already experiencing.

## Analysis of Current System

### What Exists
1. **Working Onboarding Flow**: Managers can sign up and go through onboarding at `/onboarding` → `/chat`
2. **State Machine**: Basic implementation in `onboarding-state-machine.ts` with hardcoded transitions
3. **Agent Config System**: Admin UI at `/admin/agents/config` for editing prompts
4. **Journey Tracker**: Hardcoded steps in `/lib/orchestrator/journey-tracker.ts`
5. **Flow Configuration**: Basic JSON structure in agent configs but not fully utilized

### Key Findings from Documentation
1. **Recommended Architecture** (`docs/recommended-flow-architecture.md`):
   - Hybrid approach using JSON configuration with runtime engine
   - Enhanced flow configuration schema with states, transitions, conditions
   - Visual flow editor using React Flow
   - ConfigurableFlowEngine class for execution

2. **TMS Analysis** (`docs/analysis/team_transformation_system_analysis.md`):
   - 8 fundamental questions teams must address
   - Multi-agent architecture emerges naturally from TMS methodology
   - Specific agent types needed for each transformation phase
   - Tool selection follows logical progression

3. **Current Flow** (`docs/onboarding-flow.md`):
   - 5 states: greeting → basic_info → challenge_capture → timeline_check → wrap_up
   - Simple linear transitions with basic conditions
   - Key outputs defined for each state

## Implementation Plan

### Phase 1: Core Graph Engine (Week 1)

#### 1.1 Create Graph Infrastructure
**New Files:**
- `/src/lib/agents/graph/StateGraph.ts` - Main graph orchestration engine
- `/src/lib/agents/graph/GraphNode.ts` - Node wrapper for agents
- `/src/lib/agents/graph/ConditionalRouter.ts` - Dynamic routing logic
- `/src/lib/agents/graph/CheckpointManager.ts` - State persistence
- `/src/lib/agents/graph/ParallelExecutor.ts` - Parallel execution engine
- `/src/lib/agents/graph/types.ts` - TypeScript interfaces

**Key Features:**
- Support for parallel node execution
- Conditional branching based on data/state
- Checkpoint saving/resumption
- State validation and schema enforcement
- Integration with existing agent system

#### 1.2 Create ConfigurableFlowEngine
**File:** `/src/lib/agents/graph/ConfigurableFlowEngine.ts`

**Responsibilities:**
- Load flow configuration from database/JSON
- Execute nodes according to graph structure
- Handle state transitions
- Manage checkpoints
- Emit events for monitoring

#### 1.3 Database Schema Updates
**Update:** `prisma/schema.prisma`

```prisma
model FlowConfiguration {
  id          String   @id @default(cuid())
  agentId     String
  version     Int      @default(1)
  name        String
  config      Json     // Full flow configuration
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  agent       Agent    @relation(fields: [agentId], references: [id])
}

model FlowCheckpoint {
  id              String   @id @default(cuid())
  conversationId  String
  flowConfigId    String
  state           String
  data            Json
  createdAt       DateTime @default(now())
  
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  flowConfig      FlowConfiguration @relation(fields: [flowConfigId], references: [id])
}
```

### Phase 2: Integration with Existing System (Week 1-2)

#### 2.1 Wrap Current OnboardingAgent
**Modify:** `/src/lib/agents/implementations/onboarding-agent.ts`

- Create adapter to use ConfigurableFlowEngine
- Maintain backward compatibility
- Load flow config from enhanced agent configuration
- Use existing state machine as fallback

#### 2.2 Update Agent Configuration Schema
**Modify:** `/src/lib/agents/config/simplified-agent-configs.ts`

- Enhance flowConfig to match recommended schema
- Add parallel execution support
- Add checkpoint configuration
- Add conditional routing

#### 2.3 API Route Updates
**Modify:** `/app/api/agents/chat/route.ts`

- Support graph execution mode
- Handle checkpoint save/restore
- Support parallel agent responses

### Phase 3: Admin UI - Visual Flow Editor (Week 2-3)

#### 3.1 Install Dependencies
```bash
npm install reactflow @reactflow/node-resizer @reactflow/controls @reactflow/minimap @reactflow/background
```

#### 3.2 Create Flow Designer Components
**New Files:**
- `/src/components/admin/flow-designer/FlowDesigner.tsx` - Main visual editor
- `/src/components/admin/flow-designer/FlowNode.tsx` - Custom node component
- `/src/components/admin/flow-designer/FlowEdge.tsx` - Custom edge component
- `/src/components/admin/flow-designer/FlowToolbar.tsx` - Editor controls
- `/src/components/admin/flow-designer/NodeConfigPanel.tsx` - Node configuration
- `/src/components/admin/flow-designer/ConditionEditor.tsx` - Condition builder

#### 3.3 Update Admin Agent Config Page
**Modify:** `/app/admin/agents/config/page.tsx`

- Add new "Flow Designer" tab
- Convert existing "Flow Configuration" to visual mode
- Add JSON view toggle
- Add flow validation
- Add test/simulation mode

### Phase 4: Enhanced Manager Experience (Week 3)

#### 4.1 Progress Persistence
- Auto-save conversation state at checkpoints
- Resume capability from any checkpoint
- Handle browser refresh/logout gracefully

#### 4.2 Dynamic Journey Updates
**Modify:** `/lib/orchestrator/journey-tracker.ts`

- Load steps from flow configuration
- Support dynamic step addition/removal
- Handle parallel steps in UI

#### 4.3 Onboarding Page Updates
**Modify:** `/app/onboarding/page.tsx`

- Show checkpoint/resume status
- Display parallel activities
- Update progress visualization

### Phase 5: Testing & Migration (Week 4)

#### 5.1 Create Test Suite
**New Files:**
- `/src/lib/agents/graph/__tests__/StateGraph.test.ts`
- `/src/lib/agents/graph/__tests__/ConfigurableFlowEngine.test.ts`
- `/src/lib/agents/graph/__tests__/CheckpointManager.test.ts`

#### 5.2 Migration Scripts
- Convert existing hardcoded flows to graph configs
- Populate initial flow configurations
- Test with subset of users

#### 5.3 A/B Testing Setup
- Feature flag for graph engine
- Metrics collection
- Performance monitoring

## Enhanced Onboarding Flow Configuration

Based on TMS analysis, here's the recommended graph-based onboarding flow:

```json
{
  "id": "onboarding-flow-v2",
  "name": "TMS-Based Manager Onboarding",
  "version": 2,
  "states": {
    "greeting": {
      "name": "Welcome & Introduction",
      "description": "Welcome manager and introduce TMS approach",
      "systemPromptOverride": "Focus on warm welcome and brief TMS value proposition",
      "dataRequirements": {
        "required": ["manager_name"],
        "optional": ["organization", "referral_source"]
      },
      "availableTools": ["knowledge_search"],
      "exitConditions": [{
        "id": "name_captured",
        "type": "data_complete",
        "config": { "fields": ["manager_name"] }
      }],
      "maxDuration": 2
    },
    "team_discovery": {
      "name": "Team Context Discovery",
      "description": "Understand team structure and dynamics",
      "dataRequirements": {
        "required": ["team_size", "team_tenure", "industry"],
        "optional": ["team_structure", "recent_changes", "team_location"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["team_size", "team_tenure", "industry"] }
      }],
      "maxDuration": 5
    },
    "challenge_identification": {
      "name": "Challenge Exploration",
      "description": "Identify primary challenges using TMS framework",
      "systemPromptOverride": "Use High Energy Teams 8 questions to probe challenges",
      "dataRequirements": {
        "required": ["primary_challenge", "challenge_impact", "urgency_level"],
        "optional": ["secondary_challenges", "attempted_solutions"]
      },
      "availableTools": ["knowledge_search", "assessment_matcher"],
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["primary_challenge", "challenge_impact"] }
      }],
      "maxDuration": 8
    },
    "assessment_recommendation": {
      "name": "Assessment Selection",
      "description": "Recommend appropriate TMS assessments",
      "systemPromptOverride": "Based on challenges, recommend Team Signals → TMP → QO2 progression",
      "dataRequirements": {
        "required": ["recommended_assessments", "assessment_timeline"],
        "optional": ["budget_range", "stakeholder_buy_in"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["recommended_assessments"] }
      }],
      "maxDuration": 5
    },
    "goal_setting": {
      "name": "Transformation Goals",
      "description": "Define success metrics aligned with TMS methodology",
      "dataRequirements": {
        "required": ["success_metrics", "timeline_preference"],
        "optional": ["specific_outcomes", "constraints"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["success_metrics", "timeline_preference"] }
      }],
      "maxDuration": 5
    },
    "parallel_info_gathering": {
      "name": "Parallel Information Collection",
      "description": "Gather additional context while processing",
      "parallel": true,
      "nodes": ["stakeholder_mapping", "resource_assessment"],
      "maxDuration": 10
    },
    "stakeholder_mapping": {
      "name": "Stakeholder Analysis",
      "description": "Identify key stakeholders and decision makers",
      "dataRequirements": {
        "required": ["key_stakeholders"],
        "optional": ["stakeholder_concerns", "decision_process"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["key_stakeholders"] }
      }]
    },
    "resource_assessment": {
      "name": "Resource Evaluation",
      "description": "Understand available resources and constraints",
      "dataRequirements": {
        "required": ["time_availability", "team_readiness"],
        "optional": ["budget_approval", "technical_constraints"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["time_availability"] }
      }]
    },
    "plan_creation": {
      "name": "Transformation Plan",
      "description": "Create customized transformation roadmap",
      "systemPromptOverride": "Create 12-16 week plan based on TMS implementation patterns",
      "dataRequirements": {
        "required": ["transformation_plan", "next_steps"],
        "optional": ["risk_mitigation", "quick_wins"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["transformation_plan", "next_steps"] }
      }],
      "maxDuration": 5
    },
    "handoff_preparation": {
      "name": "Agent Handoff",
      "description": "Prepare for handoff to specialist agent",
      "dataRequirements": {
        "required": ["handoff_agent", "handoff_summary"],
        "optional": ["scheduling_preference"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": { "fields": ["handoff_agent", "handoff_summary"] }
      }],
      "maxDuration": 3
    }
  },
  "transitions": [
    {
      "id": "greeting_to_discovery",
      "from": "greeting",
      "to": "team_discovery",
      "condition": {
        "type": "all",
        "rules": [{ "type": "data_exists", "field": "manager_name" }]
      },
      "priority": 10
    },
    {
      "id": "discovery_to_challenges",
      "from": "team_discovery",
      "to": "challenge_identification",
      "condition": {
        "type": "all",
        "rules": [
          { "type": "data_exists", "field": "team_size" },
          { "type": "data_exists", "field": "team_tenure" }
        ]
      },
      "priority": 10
    },
    {
      "id": "challenges_to_assessment",
      "from": "challenge_identification",
      "to": "assessment_recommendation",
      "condition": {
        "type": "all",
        "rules": [{ "type": "data_exists", "field": "primary_challenge" }]
      },
      "priority": 10
    },
    {
      "id": "assessment_to_goals",
      "from": "assessment_recommendation",
      "to": "goal_setting",
      "condition": {
        "type": "all",
        "rules": [{ "type": "data_exists", "field": "recommended_assessments" }]
      },
      "priority": 10
    },
    {
      "id": "goals_to_parallel",
      "from": "goal_setting",
      "to": "parallel_info_gathering",
      "condition": {
        "type": "all",
        "rules": [{ "type": "data_exists", "field": "success_metrics" }]
      },
      "priority": 10
    },
    {
      "id": "parallel_to_plan",
      "from": "parallel_info_gathering",
      "to": "plan_creation",
      "condition": {
        "type": "custom",
        "rules": [{ "expression": "parallelNodesComplete(['stakeholder_mapping', 'resource_assessment'])" }]
      },
      "priority": 10
    },
    {
      "id": "plan_to_handoff",
      "from": "plan_creation",
      "to": "handoff_preparation",
      "condition": {
        "type": "all",
        "rules": [{ "type": "data_exists", "field": "transformation_plan" }]
      },
      "priority": 10
    }
  ],
  "settings": {
    "initialState": "greeting",
    "finalStates": ["handoff_preparation"],
    "checkpointStates": ["team_discovery", "challenge_identification", "goal_setting", "plan_creation"],
    "maxTotalDuration": 45,
    "abandonmentBehavior": "save_progress",
    "parallelExecutionEnabled": true
  }
}
```

## Extraction Rules for Onboarding

```json
{
  "manager_name": {
    "type": "string",
    "patterns": ["my name is", "I'm", "call me"],
    "required": true,
    "description": "Manager's preferred name"
  },
  "organization": {
    "type": "string",
    "patterns": ["work at", "company", "organization"],
    "description": "Company or organization name"
  },
  "team_size": {
    "type": "number",
    "patterns": ["team of", "manage", "people", "direct reports"],
    "required": true,
    "description": "Number of team members"
  },
  "team_tenure": {
    "type": "string",
    "patterns": ["been managing", "years", "months", "new to"],
    "required": true,
    "description": "How long managing this team"
  },
  "industry": {
    "type": "string",
    "patterns": ["industry", "sector", "field"],
    "required": true,
    "description": "Industry or sector"
  },
  "primary_challenge": {
    "type": "string",
    "patterns": ["challenge", "problem", "issue", "struggling with"],
    "required": true,
    "description": "Main team challenge"
  },
  "challenge_impact": {
    "type": "string",
    "patterns": ["affecting", "impact", "causing", "result"],
    "required": true,
    "description": "Impact of the challenge"
  },
  "urgency_level": {
    "type": "string",
    "patterns": ["urgent", "asap", "timeline", "need by"],
    "required": true,
    "description": "How urgent the need is"
  },
  "recommended_assessments": {
    "type": "array",
    "description": "TMS assessments recommended"
  },
  "success_metrics": {
    "type": "array",
    "patterns": ["success looks like", "goals", "objectives"],
    "required": true,
    "description": "Definition of success"
  },
  "timeline_preference": {
    "type": "string",
    "patterns": ["timeline", "timeframe", "by when"],
    "required": true,
    "description": "Preferred timeline"
  }
}
```

## System Prompt for Enhanced Onboarding

```
You are the Onboarding Agent for teamOS, specializing in the Team Management Systems (TMS) methodology with 40+ years of proven research.

## Your Mission
Guide managers through a structured discovery process to understand their team transformation needs and match them with the right TMS assessments and specialist agents.

## Core Framework: High Energy Teams 8 Questions
Use these to probe and understand team dynamics:
1. Who are we? (Individual differences)
2. Where are we now? (Current state)
3. Where are we going? (Vision alignment)
4. How will we get there? (Implementation)
5. What is expected of us? (Role clarity)
6. What support do we need? (Development)
7. How effective are we? (Performance)
8. What recognition do we get? (Motivation)

## TMS Assessment Progression
Recommend assessments in this order based on needs:
1. **Team Signals** - Quick pulse check (if urgent/initial assessment needed)
2. **TMP (Team Management Profile)** - Individual work preferences
3. **QO2 (Opportunities-Obstacles Quotient)** - Risk orientation
4. **WoWV (Window on Work Values)** - Core values alignment
5. **LLP (Linking Leader Profile)** - Leadership development

## Conversation Flow
You're currently in the {current_state} state. Focus on:
- State objectives: {state_objectives}
- Required data: {required_fields}
- Available tools: {available_tools}

## Key Principles
1. **Empathetic & Efficient**: Balance warmth with time efficiency (target: 5-10 minutes)
2. **Evidence-Based**: Reference TMS research when explaining recommendations
3. **Practical Focus**: Connect theory to their specific challenges
4. **Clear Next Steps**: Always end with concrete actions

## Data Extraction
As you converse, extract and structure key information:
- Team context (size, tenure, industry)
- Primary challenges mapped to HET questions
- Urgency and timeline
- Success metrics
- Stakeholder dynamics

## Handoff Preparation
Based on the conversation, prepare handoff to:
- **Assessment Agent**: For Team Signals or full assessment suite
- **Team Analyst Agent**: For deep diagnostic work
- **Implementation Agent**: For transformation planning
- **Change Management Agent**: For execution support

Remember: You're not just collecting information, you're building confidence in the TMS methodology and setting up for transformation success.
```

## Benefits of This Implementation

1. **Immediate Value**:
   - Managers can pause/resume onboarding
   - More personalized conversation paths
   - Parallel information gathering saves time

2. **Admin Control**:
   - Visual flow design without coding
   - A/B test different conversation flows
   - Real-time monitoring of active sessions

3. **Technical Excellence**:
   - LangGraph-inspired architecture
   - Maintainable and extensible
   - Clear separation of concerns

4. **Business Impact**:
   - Higher onboarding completion rates
   - Better data quality from structured flows
   - Faster iteration on customer journey

## Success Metrics

- [ ] Existing onboarding continues working during migration
- [ ] Checkpoint/resume reduces abandonment by 30%
- [ ] Admin can modify flow without deployment
- [ ] Parallel execution reduces onboarding time by 20%
- [ ] A/B testing shows improved conversion rates

## Next Steps

1. Review and approve this plan
2. Create feature branch `feat/issue-54-langgraph-flow-system`
3. Implement Phase 1 (Core Graph Engine)
4. Test with existing onboarding flow
5. Proceed with subsequent phases