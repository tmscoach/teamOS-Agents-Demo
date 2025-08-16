# Issue #128: Improve DebriefAgent UX - Performance Optimization Plan

Issue Link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/128

## Problem Analysis

The DebriefAgent currently takes 42+ seconds to respond after a user agrees to start a debrief. Key issues identified:

1. **Redundant subscription checks** - The agent checks `tms_get_dashboard_subscriptions` twice:
   - Once when conversation starts (line 171-185 in openai-debrief-agent.ts)
   - Again after user confirms they want a debrief

2. **Heavy initial load** - The `tms_debrief_report` tool loads the entire report HTML before showing any response

3. **Long summary generation** - Agent generates a 3000+ character summary before interaction

4. **No progressive disclosure** - Everything loaded at once instead of progressively

## Root Cause Analysis

### 1. Forced Report Check in processMessage
```typescript
// Line 171-185: Forces report check on EVERY conversation start
if (!context.conversationId || context.messageCount === 0 || message.includes('[User joined')) {
  const checkReportsPrompt = `REMINDER: This is the start of a new conversation. 
You MUST immediately use tms_get_dashboard_subscriptions to check for completed assessments.`
}
```

### 2. TMP Debrief Instructions in System Prompt
The system prompt (lines 39-77) includes detailed TMP debrief instructions that tell the agent to:
- Step 2: "Retrieve the full TMP profile result using tms_generate_html_report"
- Step 3: Display all profile information before starting conversation

### 3. Flow Configuration Issues
The flow states in simplified-agent-configs.ts show:
- `report_check` → `debrief_intro` → `tmp_report_load` → `tmp_profile_display`
- This enforces loading the report before gathering objectives

## Solution Plan

### Phase 1: Quick Wins (Immediate Impact)
1. **Cache subscription data** in conversation context to avoid redundant checks
2. **Skip to objectives** after user confirms debrief (bypass redundant checks)
3. **Lazy load report data** - only load when needed for specific questions

### Phase 2: Optimize Flow (Better UX)
1. **Simplify flow states** - remove redundant states
2. **Direct questioning approach** - start with objectives immediately
3. **Progressive loading** - load report sections as needed

### Phase 3: System Improvements
1. **Update system prompt** to remove forced full report loading
2. **Implement context caching** for subscription and report data
3. **Add performance metrics** to track improvements

## Implementation Details

### 1. Update processMessage in openai-debrief-agent.ts

```typescript
async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
  // Check if we already have subscription data in context
  const hasCheckedSubscriptions = context.metadata?.subscriptionsChecked;
  
  // Only check subscriptions if we haven't already
  if (!hasCheckedSubscriptions && (!context.conversationId || context.messageCount === 0)) {
    // Add flag to remember we've checked
    context.metadata = { ...context.metadata, subscriptionsChecked: true };
    
    // Check for reports
    const checkReportsPrompt = `...`;
    return super.processMessage(checkReportsPrompt, context);
  }
  
  // If user confirms debrief, skip re-checking and go directly to objectives
  if (message.toLowerCase().includes('yes') && context.metadata?.availableReports) {
    const skipToObjectivesPrompt = `The user has confirmed they want a debrief. 
    Skip checking subscriptions again - we already know they have ${context.metadata.reportType}.
    Go directly to asking about their objectives.`;
    
    return super.processMessage(skipToObjectivesPrompt, context);
  }
  
  // Normal processing
  return super.processMessage(message, context);
}
```

### 2. Update System Prompt

Remove the requirement to load full report upfront:

```typescript
const tmpDebriefInstructions = `
## TMP Debrief Flow

When conducting a TMP debrief:

1. After user confirms, immediately ask: "Great! The purpose of our session is to learn more about yourself, explore your personal team management profile, and use that information as a catalyst to review and fine-tune how you work. To get started, what are your main objectives from the debrief session today?"

2. Only load report data when needed to answer specific questions using tms_debrief_report

3. Follow the conversational flow:
   - Gather objectives first
   - Then highlights
   - Then communication tips
   - Finally support needs

4. Load profile details only when discussing specific aspects
`;
```

### 3. Simplify Flow States

Update simplified-agent-configs.ts to remove redundant states:

```typescript
flowConfig: {
  states: [
    {
      name: "initial_check",
      description: "Check for reports only if no context exists",
      objectives: ["Check subscriptions if needed"],
      key_outputs: ["available_reports"]
    },
    {
      name: "gather_objectives",
      description: "Jump directly to gathering objectives",
      objectives: ["Ask for objectives", "Build rapport"],
      key_outputs: ["objectives"]
    },
    // Remove tmp_report_load and tmp_profile_display states
    // Go directly from confirmation to objectives
  ]
}
```

### 4. Implement Progressive Loading

Add a new approach to loading report data:

```typescript
// Only load specific sections when needed
const loadReportSection = async (section: string) => {
  const query = `Show me the ${section} section of the report`;
  return await tms_debrief_report({ query });
};
```

## Expected Results

1. **Response time**: Reduced from 42 seconds to <5 seconds
2. **User experience**: More conversational and natural flow
3. **Efficiency**: No redundant API calls or data loading
4. **Flexibility**: Can still answer detailed questions when asked

## Testing Plan

1. Test with subscription ID 21989 (TMP report)
2. Measure time from user confirmation to first question
3. Verify all 4 variables are still extracted correctly
4. Test edge cases (no reports, multiple reports, etc.)

## Rollback Plan

If issues arise, we can easily revert by:
1. Removing the context caching logic
2. Restoring original processMessage implementation
3. Keeping the improved system prompt (backwards compatible)