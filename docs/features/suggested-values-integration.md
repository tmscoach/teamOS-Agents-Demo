# Suggested Values Integration

This document describes the integration of FIELD_SUGGESTIONS into the extraction rules system.

## Overview

The suggested values feature helps users who are uncertain about their responses by providing predefined options. This integration ensures that the comprehensive suggested values defined in `FIELD_SUGGESTIONS` are automatically included in the OnboardingAgent's extraction rules.

## Implementation

### 1. Merge Utility (`src/lib/agents/extraction/merge-suggestions.ts`)

The `mergeSuggestedValues` function automatically adds suggested values from `FIELD_SUGGESTIONS` to extraction rules:

```typescript
const mergedRules = mergeSuggestedValues(extractionRules);
```

This utility:
- Preserves all existing extraction rule properties
- Adds `suggestedValues` array for fields that have them in `FIELD_SUGGESTIONS`
- Optionally adds `helpText` for additional guidance

### 2. Default Configuration Update

The OnboardingAgent's default configuration now uses the merge utility:

```typescript
extractionRules: mergeSuggestedValues(
  convertToStandardRules({
    // ... extraction patterns
  })
)
```

### 3. Database Migration Script

For existing configurations, run the migration script:

```bash
npx tsx scripts/merge-suggested-values.ts
```

This script:
- Finds all OnboardingAgent configurations in the database
- Adds suggested values to fields that don't already have them
- Preserves any existing customizations

## Supported Fields

The following fields have suggested values:

- **primary_challenge**: Common team challenges (12 options)
- **success_metrics**: Ways to measure transformation success (12 options)
- **budget_range**: Investment levels (8 options)
- **timeline_preference**: Timeframe options (8 options)
- **team_distribution**: Remote/hybrid/on-site options (8 options)
- **leader_commitment**: Time commitment levels (7 options)
- **leadership_goals**: Leadership development focus areas (10 options)
- **previous_initiatives**: Past improvement efforts (10 options)

## How It Works

1. When the OnboardingAgent asks about a field with suggested values
2. The agent detects this and includes the suggestions in the response metadata
3. The UI displays these as clickable options
4. Users can either click an option or type their own response

## Testing

Run the tests to verify the integration:

```bash
npm test merge-suggestions
```

## Future Enhancements

- Add more fields to FIELD_SUGGESTIONS as needed
- Support dynamic suggestions based on previous responses
- Add analytics to track which suggestions are most used