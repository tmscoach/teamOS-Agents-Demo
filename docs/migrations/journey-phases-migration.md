# Journey Phases Data Model Migration

## Overview

This migration updates the data model to support the new 4-phase journey system, replacing the legacy 3-status system with a more comprehensive phase-based approach.

## Changes

### New Database Fields

1. **`journeyPhase`** (enum): The current phase of the user's journey
   - `ONBOARDING`
   - `ASSESSMENT` 
   - `DEBRIEF`
   - `CONTINUOUS_ENGAGEMENT`

2. **`completedAssessments`** (JSON): Tracks which assessments have been completed
   ```json
   {
     "tmp_assessment": {
       "completedAt": "2025-01-12T10:30:00Z",
       "results": { "score": 85, "insights": [...] }
     }
   }
   ```

3. **`viewedDebriefs`** (JSON): Tracks which debrief reports have been viewed
   ```json
   {
     "tmp_debrief": {
       "viewedAt": "2025-01-12T11:00:00Z",
       "metadata": { "reportId": "report_123" }
     }
   }
   ```

4. **`teamSignalsEligible`** (boolean): Whether the user is eligible for Team Signals assessments

### Migration Logic

- `journeyStatus: ONBOARDING` → `journeyPhase: ONBOARDING`
- `journeyStatus: ACTIVE` → `journeyPhase: ASSESSMENT`
- `journeyStatus: DORMANT` → `journeyPhase: CONTINUOUS_ENGAGEMENT`

Users who have completed TMP assessment or viewed TMP debrief are automatically marked as eligible for Team Signals.

## API Updates

### Journey Tracker Methods

```typescript
// Mark an assessment as complete
await tracker.markAssessmentComplete('tmp_assessment', results)

// Mark a debrief as viewed
await tracker.markDebriefViewed('tmp_debrief', metadata)

// Get current journey includes new fields
const journey = await tracker.getCurrentJourney()
// Returns: completedAssessments, viewedDebriefs, teamSignalsEligible
```

### Admin API Response

The admin conversations API now includes:
- `journeyPhase`: Current phase in the journey
- `completedAssessments`: Object of completed assessments
- `viewedDebriefs`: Object of viewed debriefs
- `teamSignalsEligible`: Boolean eligibility flag

## Backward Compatibility

- The `journeyStatus` field is maintained for backward compatibility
- It is automatically synchronized with `journeyPhase`
- Will be removed in a future migration

## Testing

Run the test script to verify the migration:
```bash
npx tsx scripts/test-journey-phases.ts
```