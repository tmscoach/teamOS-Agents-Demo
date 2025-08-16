# Issue #30: Onboarding Agent Implementation Plan

Issue Link: [GitHub Issue #30](https://github.com/tmscoach/teamOS-Agents-Demo/issues/30)

## Overview
Implement a comprehensive Onboarding Agent that guides new managers through the TMS platform setup, with full knowledge base integration and admin monitoring capabilities.

## Key Requirements
1. 8 distinct conversation states for guided onboarding
2. Full knowledge base integration (47 TMS documents, 12,484 chunks)
3. Real-time admin monitoring dashboard
4. Quality metrics and guardrails
5. Handoff to Assessment Agent when complete

## Implementation Breakdown

### Phase 1: Core Agent Development

#### 1.1 Create Onboarding Agent Implementation
- [ ] Create `/src/lib/agents/implementations/onboarding-agent.ts`
- [ ] Define conversation states enum
- [ ] Implement state machine logic
- [ ] Add required fields validation
- [ ] Integrate KB search for contextual responses

#### 1.2 Create Onboarding Tools
- [ ] Create `/src/lib/agents/tools/onboarding-tools.ts`
- [ ] Implement `extractTeamInfo` tool
- [ ] Implement `validateRequiredFields` tool
- [ ] Implement `assessConversationQuality` tool
- [ ] Implement `generateHandoffDocument` tool

#### 1.3 Guardrails Implementation
- [ ] Create `/src/lib/agents/guardrails/onboarding-guardrails.ts`
- [ ] Time-based guardrails (20-45 min conversations)
- [ ] Field completion checks
- [ ] Quality metrics tracking

### Phase 2: Admin Dashboard

#### 2.1 Admin Routes & Layout
- [ ] Create `/app/admin/conversations/page.tsx` - List view
- [ ] Create `/app/admin/conversations/[id]/page.tsx` - Detail view
- [ ] Add authentication middleware for admin routes

#### 2.2 Conversation Monitoring Components
- [ ] Create conversation list table with filters
- [ ] Create real-time conversation viewer
- [ ] Create variable tracking panel
- [ ] Create quality metrics visualizations

#### 2.3 Real-time Updates
- [ ] Implement WebSocket or SSE for live updates
- [ ] Create event streaming for conversation events
- [ ] Add state transition visualizations

### Phase 3: Testing & Integration

#### 3.1 Unit Tests
- [ ] Test state machine transitions
- [ ] Test information extraction
- [ ] Test KB integration
- [ ] Test guardrails

#### 3.2 Integration Tests
- [ ] Test full conversation flows
- [ ] Test handoffs to Assessment Agent
- [ ] Test admin monitoring features
- [ ] Test edge cases

## Technical Architecture

### State Management
```typescript
enum ConversationState {
  GREETING = "greeting",
  CONTEXT_DISCOVERY = "context_discovery", 
  CHALLENGE_EXPLORATION = "challenge_exploration",
  TMS_EXPLANATION = "tms_explanation",
  GOAL_SETTING = "goal_setting",
  RESOURCE_CONFIRMATION = "resource_confirmation",
  STAKEHOLDER_MAPPING = "stakeholder_mapping",
  RECAP_AND_HANDOFF = "recap_and_handoff"
}
```

### Required Fields
```typescript
const REQUIRED_FIELDS = [
  "team_size",
  "team_tenure", 
  "primary_challenge",
  "success_metrics",
  "timeline_preference",
  "budget_range",
  "leader_commitment"
];
```

### Data Models
- Extend existing conversation/message models
- Add onboarding-specific metadata
- Store extracted variables
- Track quality metrics

## Implementation Order
1. Core agent with state management
2. Tools and guardrails
3. Basic admin dashboard
4. Real-time monitoring
5. Testing and refinement

## Success Metrics
- All required fields captured
- Knowledge base properly utilized
- Smooth handoffs to Assessment Agent
- Admin can monitor in real-time
- Quality metrics tracked

## References
- Knowledge base implementation: Issues #36, #39
- Agent framework: `/src/lib/agents/`
- Existing KnowledgeEnabledAgent base class