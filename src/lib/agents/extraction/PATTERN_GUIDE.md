# Extraction Pattern Guide

This guide documents the enhanced extraction patterns and best practices for improving variable extraction accuracy in the TMS system.

## Overview

The enhanced extraction patterns provide improved coverage for common variations in how users express information during conversations. These patterns have been designed based on real-world usage and testing.

## Pattern Categories

### 1. Personal Information

#### Manager Name
- **Coverage**: Titles (Dr., Prof., Ms.), hyphenated names, nicknames, casual introductions
- **Examples**:
  - "Hi, I'm Dr. Sarah Johnson" → Sarah Johnson
  - "This is Jean-Pierre Martin" → Jean-Pierre Martin
  - "My name is Robert but call me Bob" → Bob
- **Tips**: Enable LLM fallback for non-English names or complex formats

### 2. Numeric Information

#### Team Size
- **Coverage**: Direct numbers, ranges, approximations, descriptive terms
- **Special Features**:
  - Range handling: "10-15 people" → 12 (average)
  - Descriptive mapping: "a dozen" → 12, "handful" → 5
- **Examples**:
  - "Managing 25 people" → 25
  - "About a dozen folks" → 12
  - "10-15 team members" → 12
- **Tips**: Consider context when interpreting descriptive terms

#### Budget Range
- **Coverage**: Multiple currencies ($, €, £, ¥), ranges, descriptive terms
- **Examples**:
  - "$50,000 budget" → 50,000
  - "Low six figures" → (requires LLM interpretation)
  - "€25k-50k range" → 25k-50k
- **Tips**: Handle "no budget" and "TBD" scenarios gracefully

### 3. Time Information

#### Timeline
- **Coverage**: Standard durations, relative dates, specific months, seasons, urgency indicators
- **Examples**:
  - "3 months" → 3 months
  - "By end of Q2" → Q2
  - "ASAP" → urgent
  - "By summer 2024" → summer 2024
- **Tips**: Consider fiscal year vs calendar year contexts

#### Team Tenure
- **Coverage**: Standard durations, "since" patterns, descriptive terms
- **Examples**:
  - "3 years managing" → 3 years
  - "Just started last month" → 1 month
  - "Since January 2023" → (calculate from date)

### 4. Organizational Information

#### Company Name
- **Coverage**: Various formats, creative names, abbreviations
- **Examples**:
  - "bright green projects" → bright green projects
  - "Smith & Associates" → Smith & Associates
  - "From Google LLC" → Google LLC
- **Tips**: Be flexible with capitalization and special characters

#### Department
- **Coverage**: Department names, divisions, functional areas
- **Examples**:
  - "Lead the engineering department" → engineering
  - "Head of Digital Marketing" → Digital Marketing
  - "On the sales side" → sales

### 5. Context Information

#### Primary Challenge
- **Coverage**: Direct statements, struggle patterns, need patterns
- **Examples**:
  - "Main challenge is communication" → communication
  - "Struggling with low morale" → low morale
  - "Can't meet deadlines" → meeting deadlines

#### Success Metrics
- **Coverage**: Goal statements, improvement targets, desired outcomes
- **Examples**:
  - "20% productivity improvement" → 20% productivity improvement
  - "Reduce turnover" → reduce turnover
  - "Better collaboration" → collaboration improvement

## Best Practices

### 1. Pattern Design

- **Start Simple**: Begin with basic patterns and add complexity as needed
- **Use Capture Groups**: Always use parentheses to capture the specific value needed
- **Case Insensitive**: Use the 'i' flag for case-insensitive matching
- **Word Boundaries**: Use `\b` to ensure complete word matches

### 2. Pattern Testing

```typescript
// Test pattern coverage
const testCases = [
  "I have 25 people",
  "Managing 25 staff",
  "25 direct reports",
  "Team of 25"
];

// Ensure all variations are covered
```

### 3. LLM Fallback Strategy

Enable LLM fallback for:
- Required fields with high variability
- Fields where context matters
- Non-English or cultural variations
- Complex expressions

```typescript
useLLMFallback: true // Enable for critical fields
```

### 4. Confidence Scoring

Patterns are scored based on:
- Match position (earlier = higher confidence)
- Match length (longer = higher confidence)
- Number of capture groups
- Pattern specificity

### 5. Performance Considerations

- **Order Patterns**: Place most common patterns first
- **Avoid Backtracking**: Use non-capturing groups `(?:)` when possible
- **Limit Wildcards**: Be specific rather than using `.*`

## Adding New Patterns

1. **Analyze Failed Extractions**: Use `VariableExtractionService.getProblematicFields()`
2. **Identify Patterns**: Look for common expressions in failed cases
3. **Design Pattern**: Create regex to capture the variations
4. **Test Thoroughly**: Use the test suite to validate
5. **Monitor Performance**: Track extraction success rates

## Common Pitfalls

1. **Over-Specific Patterns**: Too restrictive, missing variations
2. **Over-Broad Patterns**: Catching unintended matches
3. **Missing Edge Cases**: Not handling special characters, punctuation
4. **Context Ignorance**: Not considering conversation flow

## Monitoring and Improvement

Use the admin dashboard to:
- View extraction success rates
- Identify problematic fields
- Test new patterns
- Enable/disable LLM fallback

## Examples of Enhanced Patterns

### Before (Basic)
```typescript
patterns: ["(\\d+)\\s+people"]
```

### After (Enhanced)
```typescript
patterns: [
  "(\\d+)\\s*(?:people|members|employees|staff|direct reports|folks|individuals|heads?)",
  "(\\d+)\\s*(?:to|-)\\s*(\\d+)\\s*(?:people|members|employees)",
  "(?:about|approximately|roughly|around)\\s+(\\d+)\\s*(?:people|members)",
  "(?:a )?(?:dozen|handful|few|couple)\\s*(?:of)?\\s*(?:people|members)",
  "(?:team|department|group)\\s+of\\s+(\\d+)"
]
```

## Future Enhancements

1. **Context-Aware Patterns**: Patterns that consider conversation state
2. **Multi-Language Support**: Patterns for non-English conversations
3. **Industry-Specific Patterns**: Specialized patterns for different sectors
4. **Machine Learning**: Auto-generate patterns from successful extractions
5. **Fuzzy Matching**: Handle typos and variations automatically