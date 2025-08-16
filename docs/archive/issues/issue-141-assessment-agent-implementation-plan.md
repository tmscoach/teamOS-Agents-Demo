# Issue #141: Assessment Agent Implementation Plan

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/141

## Overview

Implement an Assessment Agent that guides users through TMS questionnaires (TMP, QO2, Team Signals) with an integrated collapsible/expandable chat interface similar to the Debrief Agent. The agent should support natural language commands and voice interaction capabilities (voice to be added in Phase 2 using GPT-4o realtime API).

## Key Findings from Analysis

### 1. Existing Components
- **Assessment Agent**: Basic implementation exists at `/src/lib/agents/implementations/assessment-agent.ts` but needs enhancement
- **Mock TMS API**: Workflow endpoints are implemented in `/src/lib/mock-tms-api/endpoints/workflows.ts`
- **Debrief Agent Pattern**: Working example at `/app/chat/debrief/` showing chat interface integration
- **Figma Mockups**: UI designs available at `/Users/rowanmccann/Documents/Development/teamOS-figma-designs/src/app/tmp-1/`

### 2. TMS API Tools Available
From the TMS tool registry, the following assessment-related tools are available:
- `tms_assign_subscription`: Assign workflow subscription to user
- `tms_get_workflow_process`: Get current workflow state with questions
- `tms_start_workflow`: Begin an assessment
- `tms_update_workflow`: Update assessment progress
- `tms_complete_workflow`: Finalize assessment
- `tms_get_dashboard_subscriptions`: Show available assessments

### 3. Architecture Patterns
- Agents extend `TMSEnabledAgent` which inherits from `KnowledgeEnabledAgent`
- Streaming responses using AI SDK's `streamText`
- Chat interface uses `useChat` hook from `ai/react`
- Collapsible/expandable UI pattern with gradient styling

### 4. Live API Implementation Reference
Analyzed the TeamOS project at `/Users/rowanmccann/Documents/Development/TeamOS/` which has a working implementation with the live TMS API:

#### WorkflowQuestion Component
The `WorkflowQuestion.tsx` component demonstrates how to dynamically render questions based on API response:
- **Type 18**: Seesaw questions (TMP) - forced pair with 2-0, 2-1, 1-2, 0-2 options
- **Type 8**: Yes/No questions
- **Type 4**: Dropdown selections
- **Type 6**: Text field inputs
- **Type 7**: Text area inputs
- **Type 14**: Checkbox
- **Type 16**: Multiple choice (with horizontal/vertical layout options)
- **Type 0**: Heading
- **Type 19/20**: Paragraph/HTML content

Key insights:
- Questions have a `type` field that determines the UI control
- Seesaw questions use values "20", "21", "12", "02" displayed as "2-0", "2-1", "1-2", "0-2"
- Questions can have conditional enable/disable states
- Support for required field validation
- Horizontal layout option for QO2-style questions

## Assessment Workflow Sequence Analysis

Based on the mock TMS API implementation, here's the complete workflow sequence:

### 1. View Available Assessments
- Call `tms_get_dashboard_subscriptions` to retrieve user's assigned assessments
- Shows subscriptions with status: not_started, in_progress, completed
- Returns subscription IDs, workflow IDs, and assessment types

### 2. Start Assessment
- Call `tms_start_workflow` with workflowId and subscriptionId
- Returns first page URL: `/Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}`
- Updates subscription status from "not_started" to "in_progress"

### 3. Get Assessment Questions (Per Page)
- Call `tms_get_workflow_process` with current page parameters
- Returns questions array with type, prompt, options, etc.
- For TMP: 5 seesaw questions per page (type 18)
- Tracks navigation state (next/previous pages)

### 4. Submit Page Answers
- Call `tms_update_workflow` with:
  ```json
  {
    "subscriptionID": 21989,
    "pageID": 2,
    "questions": [
      { "questionID": 20, "value": "20" },  // 2-0
      { "questionID": 21, "value": "12" },  // 1-2
      { "questionID": 22, "value": "21" },  // 2-1
      { "questionID": 23, "value": "02" }   // 0-2
    ]
  }
  ```
- Updates workflow state and progress
- Returns success boolean

### 5. Navigate to Next Page
- Use navigation info from `tms_get_workflow_process` response
- Call `tms_get_workflow_process` with next page parameters
- Repeat steps 3-5 until all pages completed

### 6. Complete Assessment
- When completionPercentage reaches 100%
- Assessment is marked as completed
- Ready for report generation

### 7. Generate Report
- Call `tms_generate_html_report` with subscriptionId and templateId
- Returns HTML report for debrief agent

## Implementation Plan

### Phase 1: Core Implementation

#### 1. Create Assessment Chat Route Structure
```
/app/chat/assessment/
├── page.tsx                      # Main page component
├── AssessmentChatClient.tsx      # Client component with chat logic
├── components/
│   ├── ChatInterface/           # Reuse/adapt from debrief
│   │   ├── ChatInterface.tsx
│   │   ├── CollapsedChat.tsx
│   │   └── ExpandedChat.tsx
│   ├── AssessmentViewer/        # Question display component
│   │   ├── AssessmentViewer.tsx
│   │   ├── QuestionCard.tsx
│   │   └── NavigationMenu.tsx
│   └── AssessmentLayout.tsx     # Split layout component
└── hooks/
    └── useAssessmentChat.ts     # Chat functionality hook
```

#### 2. Create API Route
```
/app/api/chat/assessment/
└── route.ts                     # API endpoint for assessment chat
```

#### 3. Assessment Agent Enhancement
- Update the existing `assessment-agent.ts` with proper system prompts
- Configure tools for workflow management
- Add knowledge base integration

#### 4. Natural Language Command Processing
Create a command parser that understands:
- Answer commands: "answer 2-1 for question 34"
- Navigation: "go to question 5", "previous question"
- Help requests: "explain this question"

### Implementation Steps

#### Step 1: Set up Assessment Page Route
1. Create `/app/chat/assessment/page.tsx` following debrief pattern
2. Create `AssessmentChatClient.tsx` to handle assessment logic
3. Parse URL parameters: `agent`, `assessmentType`, `subscriptionId`

#### Step 2: Create Assessment Layout
1. Create `AssessmentLayout.tsx` with split view (assessment UI + chat)
2. Implement collapsible/expandable chat panel
3. Use gradient styling from Figma mockups

#### Step 3: Build Assessment Viewer
1. Create `AssessmentViewer.tsx` to display questions
2. Create `WorkflowQuestion.tsx` component that dynamically renders based on question type:
   - Adapt from TeamOS implementation but use our design system
   - Support all question types (18, 8, 4, 6, 7, 14, 16, 0, 19/20)
   - Handle seesaw questions with proper value mapping
3. Add `NavigationMenu.tsx` for page navigation
4. Handle different assessment types (TMP, QO2, Team Signals)

#### Step 4: Implement Chat Interface
1. Adapt existing chat components from debrief
2. Create `useAssessmentChat.ts` hook
3. Handle assessment-specific context (current question, progress)

#### Step 5: Create API Route
1. Create `/app/api/chat/assessment/route.ts`
2. Initialize assessment agent
3. Implement streaming response with tool handling
4. Add natural language command processing

#### Step 6: Integrate TMS Workflow Tools
1. Configure agent with TMS tools
2. Implement workflow state management
3. Handle assessment progress tracking
4. Generate report on completion

#### Step 7: Add Natural Language Understanding
1. Create command parser for assessment actions
2. Map text commands to tool calls
3. Provide contextual help based on current question

### Testing Strategy

1. **Manual Testing Flow**:
   - Navigate to `/chat/assessment?agent=AssessmentAgent`
   - System calls `tms_get_dashboard_subscriptions`
   - User selects assessment type
   - Guide through questions with chat support
   - Complete assessment and generate report

2. **Puppeteer Tests**:
   - Test chat expansion/collapse
   - Test natural language commands
   - Test question navigation
   - Test assessment completion

3. **Integration Tests**:
   - Test TMS API integration
   - Test report generation
   - Test handoff to debrief agent

### Phase 2: Voice Interaction (Future)
- Implement using OpenAI GPT-4o Realtime Conversational Speech APIs
- Add voice controls component
- Enable conversational interaction

## Key Technical Decisions

1. **Reuse Existing Components**: Leverage debrief chat components where possible
2. **Tool-Based Architecture**: Use TMS tools for all workflow operations
3. **Streaming Responses**: Use AI SDK streaming for better UX
4. **Context Management**: Track assessment state in conversation context
5. **Natural Language First**: Make commands intuitive and forgiving
6. **Dynamic Question Rendering**: Use question type field from API to render appropriate UI control
7. **Value Mapping**: Properly map seesaw values (20→2-0, 21→2-1, 12→1-2, 02→0-2)

## Acceptance Criteria

1. ✅ Users can view available assessments
2. ✅ Assessment questions display with proper UI
3. ✅ Chat interface collapses/expands smoothly
4. ✅ Natural language commands control assessment
5. ✅ Agent provides helpful context from knowledge base
6. ✅ Assessment progress persists
7. ✅ Completed assessments generate reports
8. ✅ Seamless transition to debrief agent

## Next Steps

1. Create feature branch: `feat/issue-141-assessment-agent`
2. Implement core components following the plan
3. Test thoroughly with Puppeteer
4. Create PR for review