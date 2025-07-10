# Onboarding Architecture Explanation

## Current State

The onboarding process consists of several components:

### 1. Journey Steps Definition
- **Location**: `/lib/orchestrator/journey-tracker.ts`
- **Structure**: Hardcoded array of steps with:
  - id, name, description
  - agent assignment
  - order and required status

### 2. UI Components
- **Onboarding Page**: `/app/onboarding/page.tsx`
  - Shows progress through steps
  - Hardcoded duplicate of step names
  - Routes to chat interface

### 3. Agent System
- **Onboarding Agent**: `/src/lib/agents/implementations/onboarding-agent.ts`
  - Uses state machine for conversation flow
  - Configured via admin interface
  - System prompt defines behavior

### 4. Admin Configuration
- **Config Page**: `/app/admin/agents/config/page.tsx`
  - Edit agent prompts
  - Version control
  - Test functionality

## Current Flow

1. Manager signs up → assigned ONBOARDING status
2. Dashboard redirects to `/onboarding`
3. Onboarding page shows hardcoded steps
4. "Continue Onboarding" → `/chat?agent=onboarding&step=welcome`
5. Chat uses OnboardingAgent with configured prompt
6. Progress tracked in database

## Limitations

1. **Steps are duplicated** in UI and journey tracker
2. **Not dynamically configurable** - requires code changes
3. **Agent assignment is fixed** per step
4. **No direct admin control** over journey flow

## To Make Fully Configurable

### Option 1: Database-Driven Steps
```typescript
// Add to Prisma schema
model JourneyStep {
  id          String   @id @default(cuid())
  journeyType String   // 'ONBOARDING', 'TRANSFORMATION', etc
  stepId      String   // 'welcome', 'team_context', etc
  name        String
  description String
  agent       String
  order       Int
  required    Boolean
  active      Boolean
  metadata    Json?
}
```

### Option 2: Extend Agent Config
```typescript
// In simplified-agent-configs.ts
OnboardingAgent: {
  systemPrompt: "...",
  journeySteps: [
    {
      id: 'welcome',
      name: 'Welcome & Introduction',
      // ... other fields
    }
  ],
  flowConfig: {
    // ... existing config
  }
}
```

### Option 3: Separate Journey Config
Create a new admin section for "Journey Management" where admins can:
- Define journey types
- Configure steps per journey
- Assign agents to steps
- Set conditions and transitions

## Recommended Approach

1. **Short term**: Update journey-tracker.ts when needed
2. **Medium term**: Move steps to agent config (Option 2)
3. **Long term**: Full journey management system (Option 3)

## Current Agent <-> Step Relationship

- Steps define WHICH agent handles them
- Agents define HOW they handle the conversation
- No LangChain integration - custom implementation
- Prompts are editable, but journey flow is not

This separation allows prompt flexibility while maintaining structured journey flow.