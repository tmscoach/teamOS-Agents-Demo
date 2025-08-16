# Bulk Answer Command Implementation Plan

## Overview
Enable the assessment agent to process bulk answer commands and update the UI accordingly. Users should be able to say things like "answer 2-0 for all questions on this page" and see the UI update in real-time.

## Current State Analysis

### What's Working:
1. Agent has the tools: `answer_question`, `navigate_page`, `explain_question`
2. Tools execute successfully on the backend
3. `workflowState` contains all questions on the current page
4. `currentAnswers` tracks answers

### What's Not Working:
1. UI doesn't update when agent uses tools
2. Agent only answers one question at a time
3. No visual feedback during updates
4. Tool invocations don't trigger UI actions

## Implementation Steps

### Step 1: Fix Tool Invocation Handling in AssessmentChatClient
The `onFinish` callback is processing tool invocations but the `handleAnswerChange` function isn't updating the UI properly.

```typescript
// Current code in AssessmentChatClient.tsx
if (invocation.state === 'result' && invocation.result?.action) {
  const action = invocation.result.action;
  
  switch (action.type) {
    case 'SET_ANSWER':
      // This needs to actually update the UI
      if (action.questionId !== undefined) {
        handleAnswerChange(action.questionId, action.value);
      }
      break;
```

### Step 2: Enhance Agent System Prompt for Bulk Commands
Add instructions to parse bulk commands:

```
When users give bulk answer commands:
- "answer 2-0 for all questions" → Loop through all questions and call answer_question for each
- "respond 2-1 for questions 2-4" → Call answer_question for questions 2, 3, and 4
- "complete page with 1-2 then next" → Answer all unanswered questions then navigate

Always confirm bulk actions with a summary.
```

### Step 3: Update Answer Question Tool
Modify the tool to support bulk operations:

```typescript
// Add a bulk variant or enhance existing tool
tools.answer_multiple_questions = tool({
  description: 'Answer multiple questions at once',
  parameters: z.object({
    answers: z.array(z.object({
      questionId: z.number(),
      value: z.string()
    }))
  }),
  execute: async ({ answers }) => {
    const results = [];
    for (const answer of answers) {
      results.push({
        type: 'SET_ANSWER',
        questionId: answer.questionId,
        value: answer.value
      });
    }
    return { success: true, actions: results };
  }
});
```

### Step 4: Connect handleAnswerChange to UI State
The handleAnswerChange function needs to:
1. Update the currentAnswers state
2. Trigger a re-render of the assessment viewer
3. Update the radio button selection visually

### Step 5: Add Visual Feedback
- Show loading spinner on questions being updated
- Animate radio button selection changes
- Display confirmation message after bulk update

### Step 6: Implement Navigation Integration
When navigate_page tool is used:
1. Save current answers
2. Call submitCurrentPage()
3. Show page transition animation

## Files to Modify

1. `/app/chat/assessment/AssessmentChatClient.tsx`
   - Fix onFinish handler
   - Ensure handleAnswerChange updates UI state

2. `/app/api/chat/assessment/route.ts`
   - Enhance system prompt for bulk commands
   - Add bulk answer tool or enhance existing

3. `/app/chat/assessment/components/AssessmentViewer.tsx`
   - Ensure it re-renders when currentAnswers changes
   - Add visual feedback for updates

4. `/app/chat/assessment/types.ts`
   - May need to add types for bulk operations

## Testing Plan

1. Test single answer: "answer 2-0 for question 1"
2. Test all questions: "answer 2-0 for all questions"
3. Test range: "answer 1-2 for questions 2 through 4"
4. Test with navigation: "complete page with 2-1 and go next"
5. Test visual feedback during updates
6. Test error cases (invalid question IDs, etc.)

## Success Metrics
- UI updates immediately when agent answers questions
- Bulk commands work reliably
- Users see clear feedback during operations
- Navigation works seamlessly after bulk answers