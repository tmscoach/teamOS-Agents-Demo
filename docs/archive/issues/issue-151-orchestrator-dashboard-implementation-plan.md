# Implementation Plan: Issue #151 - Orchestrator-driven Dashboard

**Issue**: [#151 - Implement Orchestrator-driven dashboard with multi-modal assessment initiation](https://github.com/tmscoach/teamOS-Agents-Demo/issues/151)

## Overview
This is a large epic that transforms the TeamOS dashboard into an intelligent, proactive system. The goal is to:
1. Guide managers through their transformation journey
2. Enable assessment initiation through multiple modalities (button, text, voice)
3. Provide proper journey tracking and continuity support

## Critical Blockers to Address
1. **No Journey Phase Progression Logic** - We have the enum but no transition code
2. **Dashboard Redirect Conflicts** - Dashboard redirects ONBOARDING users away, but orchestrator needs to be there
3. **No Assessment Completion Tracking** - Can't determine if user completed TMP
4. **Hardcoded Components** - EmbeddedChat locked to OrchestratorAgent

## Implementation Phases

### Phase 1: Foundation (Critical Path)
This phase removes blockers and sets up the foundation.

#### 1.1 Fix Dashboard Redirect Logic
**File**: `app/(dashboard)/dashboard/page.tsx`
- Remove lines 85-103 that redirect ONBOARDING users to `/chat`
- Let orchestrator handle ONBOARDING users on dashboard

#### 1.2 Create Journey Progression Service
**New File**: `/src/lib/services/journey/journey-progression.service.ts`
```typescript
class JourneyProgressionService {
  async checkAndUpdatePhase(userId: string, trigger: 'onboarding_complete' | 'assessment_complete' | 'debrief_viewed') {
    // ONBOARDING → ASSESSMENT: When onboarding completes
    // ASSESSMENT → DEBRIEF: When first assessment completes
    // DEBRIEF → TEAM_ASSESSMENT: When manager views results
    // TEAM_ASSESSMENT → CONTINUOUS: When team starts assessments
  }
}
```

#### 1.3 Remove Discovery Agent
- Delete `/src/lib/agents/implementations/discovery-agent.ts`
- Remove from `index.ts` exports
- Remove from `AGENT_NAMES` in admin config
- Update orchestrator handoffs (remove DiscoveryAgent references)
- Remove from agent registry

### Phase 2: Core Components

#### 2.1 Build Assessment Selector Modal
**New File**: `/components/dashboard/AssessmentSelectorModal.tsx`
- Port design from `/teamOS-figma-designs/src/app/subscription-selector-1/page.tsx`
- Props: isOpen, onClose, onSelect, userPhase, completedAssessments
- Shows TMP and Team Signals options
- Highlights 5000 credit incentive
- "Goal-Based Suggestion" badge

#### 2.2 Make EmbeddedChat Configurable
**Update**: `/components/dashboard/EmbeddedChat.tsx`
```typescript
interface EmbeddedChatProps {
  agentName?: string; // Default to 'OrchestratorAgent'
  testMode?: boolean;
  initiallyExpanded?: boolean;
  onHandoff?: (toAgent: string) => void;
}
```

#### 2.3 Add URL Parameter Support
**Update**: `app/(dashboard)/dashboard/page.tsx`
- Convert to client component or use searchParams
- Handle `?testAgent=OrchestratorAgent&expandOskar=true`
- Pass params to AskOskarWidget

### Phase 3: Agent Intelligence

#### 3.1 Simplify Orchestrator Agent
**Update**: `/src/lib/agents/implementations/orchestrator-agent.ts`
- Remove OrchestratorState enum
- Remove state machine logic
- Remove complex metadata structure
- Focus on routing based on journey phase

#### 3.2 Add Intent Recognition
**New File**: `/src/lib/agents/services/orchestrator-intelligence.ts`
```typescript
interface OrchestratorIntent {
  type: 'start_assessment' | 'check_progress' | 'get_recommendation';
  assessmentType?: 'TMP' | 'TeamSignals';
  confidence: number;
}

async function recognizeIntent(message: string, context: AgentContext): Promise<OrchestratorIntent> {
  // Use OpenAI to understand intent
  // Similar to onboarding extraction pattern
}
```

#### 3.3 Enhance Assessment Agent
**Update**: `/src/lib/agents/implementations/assessment-agent.ts`
- Add subscription lifecycle management
- Check existing subscriptions via `tms_get_dashboard_subscriptions`
- Create new subscriptions via `tms_assign_subscription`
- Handle continuation from abandoned assessments

### Phase 4: Integration & Polish

#### 4.1 Wire Everything Together
- Dashboard button → Opens modal
- Text to orchestrator → Understands intent → Opens modal
- Modal selection → Routes to assessment with subscription
- All paths converge on same experience

#### 4.2 Implement Continuity System
**New File**: `/src/lib/services/continuity/continuity-service.ts`
- Track last activity per assessment
- Store in database or localStorage
- Generate contextual re-engagement messages

#### 4.3 Add Proactive Messages
- On dashboard load, check journey phase
- Show appropriate greeting in Ask Oskar
- Examples:
  - "Welcome! Complete your TMP to earn 5000 credits"
  - "Welcome back! Continue your TMP from page 4?"
  - "Great job! Ready to review your TMP results?"

## Implementation Order

1. **Fix dashboard redirect** (blocks everything else)
2. **Create journey progression service** (needed for context)
3. **Remove Discovery Agent** (simplifies system)
4. **Build assessment selector modal** (central UI component)
5. **Make EmbeddedChat configurable** (needed for testing)
6. **Add URL parameters to dashboard** (enables admin testing)
7. **Simplify orchestrator** (remove state machine)
8. **Add intent recognition** (smart routing)
9. **Enhance assessment agent** (subscription management)
10. **Wire everything together**
11. **Add continuity system**
12. **Add proactive messages**

## Database Changes Required

```sql
-- Add assessment tracking
ALTER TABLE "User" ADD COLUMN "completedAssessments" JSONB DEFAULT '{}';

-- Add journey event logging (optional but helpful)
CREATE TABLE "JourneyEvent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL REFERENCES "User"(id),
  fromPhase TEXT,
  toPhase TEXT NOT NULL,
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Testing Strategy

1. **Unit Tests**:
   - Journey progression logic
   - Intent recognition
   - Assessment subscription management

2. **Integration Tests**:
   - Multi-modal flow (button → modal → assessment)
   - Handoff between agents
   - URL parameter handling

3. **E2E Tests with Puppeteer**:
   - Complete user journey from dashboard
   - Test continuity (close browser, return)
   - Test with different journey phases

4. **Manual Testing**:
   - Admin panel test mode
   - Both Clerk auth modes (dev and prod)
   - Mobile responsiveness

## Risk Mitigation

1. **Breaking Onboarding**: Keep `/chat?agent=OnboardingAgent` working
2. **Circular Redirects**: Test redirect removal carefully
3. **Lost User State**: Implement continuity early
4. **Auth Complexity**: Test both Clerk modes thoroughly

## Success Metrics

1. ✅ Manager lands on dashboard, sees contextual greeting
2. ✅ Manager types "I want to do TMP" → Modal appears
3. ✅ Manager selects TMP → Assessment starts with subscription
4. ✅ Manager returns next day → "Continue your TMP?"
5. ✅ Journey phase auto-updates when TMP completes
6. ✅ Admin can test via URL params
7. ✅ No Discovery Agent in system

## Notes

- This is a large epic - consider breaking into smaller PRs if needed
- Assessment modal is the central hub - all paths lead through it
- Orchestrator never executes actions, only routes
- Continuity is key - users abandon often
- Journey awareness drives everything