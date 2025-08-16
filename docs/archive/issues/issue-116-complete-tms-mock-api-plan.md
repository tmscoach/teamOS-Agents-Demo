# Issue #116: Complete TMS Mock API Implementation Plan

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/116

## Overview

This issue requires implementing a complete mock TMS API system with recorded workflows and report generation for three assessment types:
- TMP (Team Management Profile)
- QO2 (Opportunities-Obstacles Quotient)
- Team Signals

## Current State Analysis

### What's Already Implemented:
1. Basic mock API infrastructure (`/src/lib/mock-tms-api/`)
2. Basic workflow endpoints (needs enhancement)
3. Mock data store with in-memory storage
4. 14 TMS tools in the registry
5. JWT authentication system
6. Visual API testing interface at `/admin/tms-api-test`

### What Needs Implementation:
1. Stateful workflow navigation matching recorded API flows
2. Proper question structures for each assessment type
3. Report generation for all three assessment types
4. Mock-to-live API switching capability
5. Enhanced test interface with workflow scenarios

## Breaking Down into Manageable Tasks

### Phase 1: Workflow Data Models and State Management (Day 1)
1. **Create assessment definitions**
   - Define workflow structures for TMP, QO2, Team Signals
   - Create question type generators
   - Implement workflow state tracking

2. **Enhance mock data store**
   - Add workflow state management
   - Implement proper navigation logic
   - Store answers with correct formats

### Phase 2: Implement Workflow Endpoints (Day 2)
1. **GET /Workflow/Process endpoints**
   - Support both hierarchical patterns
   - Return proper question structures
   - Include navigation metadata

2. **POST /Workflow/Update endpoint**
   - Accept answers in recorded format
   - Update workflow state
   - Handle progression logic

### Phase 3: Report Generation (Day 3)
1. **Create report generators**
   - TMP report generator (work preferences, roles)
   - QO2 report generator (opportunities/obstacles ratio)
   - Team Signals generator (individual + manager views)

2. **Extract report structures**
   - Analyze provided report examples
   - Create proper data models
   - Implement scoring algorithms

### Phase 4: Mock-to-Live Switching (Day 4)
1. **Update test interface**
   - Add environment toggle
   - Implement proxy mode
   - Handle SSL for localhost

2. **Create configuration system**
   - Environment-based settings
   - Easy switching mechanism
   - Response comparison tool

### Phase 5: Testing and Polish (Day 5)
1. **Create test scenarios**
   - Complete workflow tests
   - Report generation tests
   - Mock vs live comparison

2. **Update documentation**
   - API usage guide
   - Testing instructions
   - Configuration notes

## Implementation Details

### Task 1: Create Workflow State Manager
```typescript
// src/lib/mock-tms-api/workflow-state-manager.ts
interface WorkflowState {
  subscriptionId: string;
  workflowType: 'TMP' | 'QO2' | 'TeamSignals';
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  answers: Record<number, string>;
  completionPercentage: number;
  startedAt: Date;
  completedAt?: Date;
}
```

### Task 2: Define Assessment Structures
```typescript
// src/lib/mock-tms-api/assessment-definitions.ts
const ASSESSMENT_DEFINITIONS = {
  TMP: {
    baseContentId: 3,
    questionType: 18, // Seesaw
    totalPages: 12,
    answerFormat: 'preference-score' // "20", "12", etc.
  },
  QO2: {
    baseContentId: 5,
    questionType: 16, // Multiple Choice
    totalPages: 10,
    answerFormat: 'text-based'
  },
  TeamSignals: {
    baseContentId: 12,
    questionType: 16, // Likert scale
    totalPages: 7,
    answerFormat: 'text-based',
    listOptions: ["Strongly Agree", "Mostly Agree", "Mostly Disagree", "Strongly Disagree"]
  }
};
```

### Task 3: Implement Question Generators
- Generate TMP questions with StatementA/StatementB
- Generate QO2 questions with agree/disagree options
- Generate Team Signals with Likert scale options

### Task 4: Update Workflow Endpoints
- Parse hierarchical URLs correctly
- Return exact response format from recordings
- Support navigation between pages/sections

### Task 5: Create Report Generators
- Extract scoring logic from report examples
- Implement calculations for each assessment type
- Generate realistic report data

### Task 6: Add Mock/Live Toggle
- Update test interface UI
- Implement proxy endpoint
- Handle environment switching

## Success Criteria

1. ✅ All recorded API endpoints return matching response formats
2. ✅ Workflow state persists throughout assessment
3. ✅ Reports generate with realistic data
4. ✅ Mock/live switching works seamlessly
5. ✅ Test interface supports all three assessments
6. ✅ Answer formats match recordings exactly
7. ✅ Navigation follows hierarchical patterns

## Testing Plan

1. **Unit Tests**
   - Workflow state management
   - Question generation
   - Report calculations

2. **Integration Tests**
   - Complete workflow flows
   - State persistence
   - Report generation

3. **E2E Tests (Puppeteer)**
   - Test interface workflow scenarios
   - Mock/live switching
   - Visual report generation

## Risk Mitigation

1. **Large Scope**: Break into smaller PRs if needed
2. **Complex State**: Use existing patterns from current implementation
3. **Report Accuracy**: Base everything on provided examples
4. **Performance**: Consider caching for large workflows

## Next Steps

1. Create feature branch: `feat/issue-116-complete-tms-mock-api`
2. Start with Phase 1: Data models and state management
3. Implement incrementally with tests
4. Regular commits after each subtask