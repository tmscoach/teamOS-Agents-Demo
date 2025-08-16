# Issue #147: Enable Assessment Agent to Respond to Bulk Answer Commands

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/147

## Problem Summary

The assessment agent has tools to answer questions and navigate pages, but:
1. The tools execute on the backend but don't update the UI
2. The agent doesn't properly parse bulk commands like "answer 2-0 for all items on this page"
3. The UI radio buttons don't reflect the agent's actions
4. No visual feedback when the agent performs bulk updates

## Technical Analysis

### Current Implementation Issues

1. **Tool Execution Flow**:
   - Server-side tools (`answer_question`, `navigate_page`, `explain_question`) return action objects
   - The actions have a structure like: `{ success: true, message: string, action: { type: 'SET_ANSWER', questionId: number, value: string } }`
   - The client's `onFinish` callback looks for `message.toolInvocations` but the structure might not be properly passed through

2. **Missing Bulk Command Support**:
   - The agent's system prompt mentions natural language commands but doesn't handle bulk operations
   - No parsing logic for commands like "answer all questions with 2-1" or "select 1-2 for questions 3 through 5"

3. **UI State Sync Issues**:
   - Tool invocations happen on the server but UI state (`currentAnswers`) isn't updated
   - No mechanism to handle `navigate_page` tool results to trigger actual navigation

## Implementation Plan

### Phase 1: Fix Tool Invocation Handling

1. **Update AssessmentChatClient.tsx**:
   - Move tool handling from `onFinish` to `onToolCall` callback for better real-time updates
   - Properly handle the tool result structure returned by the server
   - Ensure UI state updates when tools are invoked

2. **Server-Side Tool Response Structure**:
   - Modify the tool execution in `/app/api/chat/assessment/route.ts` to return results that can be properly streamed
   - Enable `experimental_toolCallStreaming` for real-time updates

### Phase 2: Implement Bulk Command Parsing

1. **Enhanced System Prompt**:
   - Add specific instructions for understanding bulk commands
   - Include examples of various bulk command patterns

2. **New Tool: `answer_multiple_questions`**:
   - Create a new tool that can handle bulk operations
   - Support patterns like:
     - "all questions" - answers all visible questions
     - "questions 3-5" - answers a range
     - "rest of the questions" - answers remaining unanswered

3. **Command Parser Logic**:
   - Parse natural language to extract:
     - Target questions (all, range, specific numbers)
     - Answer value to apply
     - Navigation intent

### Phase 3: Visual Feedback

1. **Loading States**:
   - Show spinner/loading indicator on questions being updated
   - Animate the radio button selection changes

2. **Progress Indicator**:
   - Show a progress bar when updating multiple questions
   - Display "Updating question X of Y" message

3. **Confirmation Messages**:
   - Agent confirms actions taken: "✅ Updated 5 questions with answer 2-0"
   - Show which questions were updated

## Technical Implementation Details

### 1. Update AssessmentChatClient Tool Handling

```typescript
// Move from onFinish to proper tool handling
const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
  api: '/api/chat/assessment',
  body: chatBody,
  // Add onToolCall for client-side handling
  onToolCall: async ({ toolCall }) => {
    console.log('Tool called:', toolCall);
    
    if (toolCall.toolName === 'answer_question') {
      const { questionId, value } = toolCall.args;
      handleAnswerChange(questionId, value);
      return { success: true };
    }
    
    if (toolCall.toolName === 'answer_multiple_questions') {
      const { questionIds, value } = toolCall.args;
      // Update multiple questions with visual feedback
      for (const qId of questionIds) {
        handleAnswerChange(qId, value);
        // Add delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { success: true, count: questionIds.length };
    }
    
    if (toolCall.toolName === 'navigate_page') {
      const { direction } = toolCall.args;
      if (direction === 'next') {
        await submitCurrentPage();
      }
      return { success: true };
    }
  },
  experimental_onToolCall: true, // Enable experimental features
  // ... rest of config
});
```

### 2. Server-Side Tool Updates

```typescript
// Add new bulk answer tool
tools.answer_multiple_questions = tool({
  description: 'Answer multiple questions at once with the same value',
  parameters: z.object({
    questionIds: z.array(z.number()).describe('Array of question IDs to answer'),
    value: z.string().describe('The answer value to apply to all questions')
  }),
  execute: async ({ questionIds, value }) => {
    const valueMap: Record<string, string> = {
      '2-0': '20',
      '2-1': '21', 
      '1-2': '12',
      '0-2': '02'
    };
    
    const mappedValue = valueMap[value] || value;
    
    return {
      success: true,
      message: `Setting ${questionIds.length} questions to ${value}`,
      updates: questionIds.map(id => ({
        questionId: id,
        value: mappedValue
      }))
    };
  }
});
```

### 3. Enhanced System Prompt

```typescript
// Add to the system message
const bulkCommandInstructions = `
BULK COMMAND UNDERSTANDING:
You MUST parse and execute these types of bulk commands:

1. "answer all questions with X" or "respond X for all items"
   → Use answer_multiple_questions with ALL question IDs on the current page
   
2. "answer questions 3-5 with X" or "select X for items 3 through 5" 
   → Use answer_multiple_questions with the specified range
   
3. "complete this page with X then next"
   → First use answer_multiple_questions for all unanswered questions
   → Then use navigate_page with direction: 'next'
   
4. "answer the rest with X"
   → Use answer_multiple_questions for all unanswered questions only

Examples:
- "respond 2-0 for all items on this page then hit next"
  → answer_multiple_questions(all questions, "2-0") then navigate_page("next")
- "answer all questions with 2-1"
  → answer_multiple_questions(all questions, "2-1")
- "select 1-2 for questions 3 through 5"
  → answer_multiple_questions([3,4,5], "1-2")
`;
```

### 4. Visual Feedback Components

```typescript
// Add to AssessmentChatClient state
const [updatingQuestions, setUpdatingQuestions] = useState<Set<number>>(new Set());

// Enhanced handleAnswerChange with visual feedback
const handleAnswerChangeWithFeedback = useCallback((questionId: number, value: string) => {
  setUpdatingQuestions(prev => new Set(prev).add(questionId));
  
  setTimeout(() => {
    setCurrentAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    setUpdatingQuestions(prev => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
  }, 200); // Small delay for visual effect
}, []);
```

## Testing Strategy

1. **Unit Tests**:
   - Test bulk command parsing logic
   - Test tool invocation handling
   - Test UI state updates

2. **Integration Tests**:
   - Test full flow from command to UI update
   - Test page navigation after bulk answers
   - Test error handling for invalid commands

3. **Puppeteer E2E Tests**:
   - Test "answer all with 2-0" command
   - Test range selection "questions 3-5"
   - Test "complete and navigate" flow
   - Verify visual feedback appears

## Acceptance Criteria Checklist

- [ ] User can say "answer 2-0 for all questions" and all radio buttons update
- [ ] User can say "answer 2-1 for questions 2-4" and specific questions update
- [ ] User can say "complete this page with 1-2 then next" and page completes and navigates
- [ ] UI provides visual feedback during bulk updates (loading states)
- [ ] Agent confirms what actions were taken with clear messages
- [ ] All existing functionality continues to work
- [ ] Tests pass for all new features