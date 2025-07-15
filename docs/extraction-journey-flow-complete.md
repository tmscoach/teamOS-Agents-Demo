# Complete Extraction and Journey Flow

## Overview
This document describes the complete flow from variable extraction through journey completion and dashboard redirect.

## 1. Extraction Rules Configuration (/admin/agents/config)

### Current Manager Extraction Rules:
- **manager_name**: The manager's full name (required, preferLLM: true)
- **manager_role**: The manager's role at the company (required)  
- **team_size**: Number of team members (required)
- **organization**: Organization name (required)
- **primary_challenge**: Main team challenge (required)

## 2. Extraction Process

### How It Works:
1. **Continuous Listening**: The system extracts from each message throughout the conversation
2. **No Re-extraction**: Once a field is captured, it won't be extracted again
3. **LLM-First for Names**: Name fields use AI extraction to avoid false positives
4. **Only Successful Extractions**: Failed extractions don't overwrite existing data

### Example Flow:
```
User: "I have 10 people on my team"
→ Extracts: team_size = 10
→ Does NOT extract name (correctly identifies no name present)

User: "Hi I'm Rowan"  
→ Extracts: manager_name = "Rowan"

User: "I'm the Engineering Manager at TechCorp"
→ Extracts: manager_role = "Engineering Manager"
→ Extracts: organization = "TechCorp"

User: "We're struggling with communication"
→ Extracts: primary_challenge = "struggling with communication"
```

## 3. Completion Detection

The OnboardingAgent tracks completion in `updateCapturedFields()`:
```typescript
// Check if all required fields are now captured
if (completedFields === totalRequiredFields && totalRequiredFields > 0) {
  metadata.isComplete = true;
}
```

## 4. Journey Status Update (NEW)

When onboarding completes, the chat API now:
1. Detects `onboardingState.isComplete = true`
2. Calls `JourneyTracker.completeOnboarding()` which:
   - Updates `journeyPhase` to `ASSESSMENT`
   - Updates `journeyStatus` to `ACTIVE`
   - Sets `currentAgent` to `AssessmentAgent`
3. Logs the completion with captured fields

## 5. Automatic Dashboard Redirect (NEW)

The ChatClient now:
1. Detects when `onboardingState.isComplete = true`
2. Shows completion message for 2 seconds
3. Automatically redirects to `/dashboard`

## 6. Complete Flow Summary

1. **User starts chat** → OnboardingAgent greets them
2. **User provides information** → System extracts variables continuously
3. **All required fields captured** → `isComplete = true`
4. **Journey updated** → Phase changes to ASSESSMENT
5. **Auto-redirect** → User sent to dashboard after 2 seconds

## Testing the Complete Flow

1. Start a new onboarding session
2. Provide all required information:
   - Your name: "Hi I'm [Name]"
   - Team size: "I have X people on my team"
   - Your role: "I'm the [Role]"
   - Organization: "at [Company]"
   - Challenge: "We're struggling with [Challenge]"
3. Once all fields are captured:
   - Right panel shows "Go to Team Dashboard" button
   - Journey status updates to ASSESSMENT phase
   - After 2 seconds, auto-redirects to /dashboard

## Debugging

Check the console logs for:
- `[Extraction]` - Shows extraction attempts
- `[LLM Extraction]` - Shows AI extraction results
- `[OnboardingAgent]` - Shows what was extracted
- `[Journey]` - Shows journey status updates
- `[ChatClient]` - Shows redirect trigger

## Key Improvements Made:

1. **Smarter Extraction**: LLM understands context (won't extract "fine" as a name)
2. **Journey Integration**: Automatically updates journey phase on completion
3. **Better UX**: Auto-redirect instead of manual button click
4. **Proper Tracking**: Journey tracker records completion with all extracted data