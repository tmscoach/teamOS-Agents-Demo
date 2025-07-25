# DebriefAgent Test Documentation

## Overview
The DebriefAgent test suite validates the performance optimizations implemented in PR #129 to reduce response time from 42+ seconds to <5 seconds.

## Test Files

### 1. `debrief-agent-auto-detection.test.ts`
Tests the agent's ability to automatically detect available reports and offer debriefs:
- **Auto-detection**: Checks for completed assessments on conversation start
- **Confirmation handling**: Skips redundant checks when user confirms debrief
- **Journey tracking**: Updates user journey phase after debrief completion

### 2. `debrief-agent-hallucination.test.ts`
Ensures the agent uses knowledge base data instead of making up information:
- **ICAF definition**: Verifies correct definition from knowledge base
- **Search relevance**: Uses results with >0.3 relevance score
- **Error handling**: Gracefully handles missing knowledge base data

### 3. `openai-debrief-agent.test.ts`
Core functionality tests:
- **System message**: Removes duplicate subscription check instructions
- **Tool configuration**: Validates TMS-specific tools are loaded
- **Performance**: Ensures <5 second response time targets

### 4. `debrief-agent-model.test.ts`
Tests the agent configuration and instructions:
- **Instructions**: Validates proper debrief flow instructions
- **Tool setup**: Ensures correct tools are configured
- **Assessment types**: Supports TMP, QO2, WoWV, LLP assessments

### 5. `route.test.ts`
API route integration tests:
- **Subscription caching**: Validates subscription data is cached in context
- **Skip logic**: Tests confirmation detection and skip behavior
- **Streaming**: Ensures proper streaming response handling

## Key Test Scenarios

### Performance Optimization Tests
1. **Subscription Caching**: Verifies subscription data is stored in conversation context
2. **Skip to Objectives**: When user confirms, skips redundant checks
3. **Progressive Loading**: Only loads report data when needed

### User Flow Tests
1. **First Message**: Checks for available reports
2. **Confirmation**: Detects user confirmation and skips to objectives
3. **Debrief Completion**: Marks debrief as viewed and updates journey phase

## Running Tests

```bash
# Run all debrief agent tests
npm test -- --testPathPatterns="debrief-agent"

# Run specific test file
npm test -- src/lib/agents/implementations/__tests__/debrief-agent-auto-detection.test.ts

# Run with coverage
npm test -- --testPathPatterns="debrief-agent" --coverage
```

## Test Data

Tests use the following mock data:
- **Subscription ID**: 21989 (standard test subscription)
- **User ID**: test-user-123
- **Assessment Type**: TMP (Team Management Profile)

## Common Issues

1. **Mock Setup**: Ensure JourneyTracker and OpenAIAgent mocks are properly configured
2. **Message History**: Include proper message history format with id and timestamp
3. **Async Operations**: Use proper async/await for all agent operations

## Related Documentation
- [DebriefAgent Implementation](../agents/debrief-agent.md)
- [Performance Optimization Guide](../performance/agent-optimization.md)
- [Journey Tracker Integration](../journey/journey-tracker.md)