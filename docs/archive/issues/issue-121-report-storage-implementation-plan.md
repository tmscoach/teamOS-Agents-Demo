# Issue #121: Report Storage and Interrogation System Implementation Plan

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/121

## Overview
Implement a next-generation report storage and interrogation system that enables the Debrief Agent to provide intelligent, contextual explanations of assessment reports including visual elements.

## Implementation Approach
Given the scope of this feature, I'll implement a pragmatic MVP that can be tested immediately while laying the foundation for future enhancements.

## Phase 1: Core Infrastructure (MVP)

### 1.1 Report Context Service
Create a simple in-memory storage service that can be enhanced later:

```typescript
// src/lib/mock-tms-api/services/report-context-service.ts
- Store report HTML and extracted metadata
- Extract plain text for search
- Parse image URLs and types
- Provide query interface
```

### 1.2 Report Debrief Endpoint
Create new mock API endpoint:

```typescript
// src/lib/mock-tms-api/endpoints/debrief.ts
- POST /api/v1/tms/debrief-report
- Accept subscriptionId, query, and context
- Return contextual response with relevant sections
```

### 1.3 Tool Registry Update
Add new tool to TMS tool registry:
- tms_debrief_report in 'debrief' category
- Parameters: subscriptionId, query, context

### 1.4 Mock API Client Update
Update mock API client to handle new endpoint

## Phase 2: Intelligence Layer (Simple Version)

### 2.1 Query Intent Recognition
Simple pattern matching for MVP:
- Visual questions (wheel, graph, color, section)
- Score questions (score, result, performance)
- Comparison questions (compare, average, benchmark)
- Next steps questions (improve, action, focus)

### 2.2 Response Generation
Template-based responses for MVP:
- Extract relevant report sections
- Generate explanations based on assessment type
- Suggest follow-up questions

## Phase 3: Testing Interface

### 3.1 Update TMS API Test Page
- Add debrief report to test scenarios
- Create interactive Q&A interface
- Pre-populate sample queries

### 3.2 Sample Test Data
Create realistic test scenarios:
- Completed TMP assessment with questions
- Completed Team Signals assessment
- Various query types to test

## Implementation Steps

1. **Create Report Context Service**
   - Basic in-memory storage
   - HTML parsing and text extraction
   - Image URL detection

2. **Implement Debrief Endpoint**
   - Query processing
   - Context retrieval
   - Response generation

3. **Update Tool Registry**
   - Add tms_debrief_report tool
   - Configure parameters

4. **Update Mock API Client**
   - Add debrief endpoint handler
   - Route configuration

5. **Create Test Interface**
   - Update TMS API test page
   - Add interactive UI component
   - Sample queries

6. **Write Tests**
   - Unit tests for service
   - Integration tests for endpoint
   - E2E test for full flow

## Key Design Decisions

1. **In-Memory Storage for MVP**: Start simple, can add persistence later
2. **Pattern-Based Intent Recognition**: Good enough for testing, can upgrade to ML later
3. **Template Responses**: Structured responses that can be enhanced with AI later
4. **Focus on Testability**: Everything should be testable in /admin/tms-api-test

## Future Enhancements (Not in MVP)

- Persistent storage (database)
- Vector embeddings for semantic search
- Multi-modal AI for image understanding
- Learning from user interactions
- Advanced query understanding

## Testing Strategy

1. **Unit Tests**
   - Report context service methods
   - Query intent recognition
   - Response generation

2. **Integration Tests**
   - Full debrief flow
   - Various query types
   - Error handling

3. **Manual Testing**
   - Use /admin/tms-api-test interface
   - Test all sample queries
   - Verify response quality

## Success Criteria

1. Can store and retrieve report context
2. Can answer basic questions about reports
3. Works in /admin/tms-api-test interface
4. All tests passing
5. Code is extensible for future enhancements