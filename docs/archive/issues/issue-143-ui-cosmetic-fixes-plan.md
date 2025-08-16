# Issue #143: Fix Assessment UI - Collapsed Chat and Progress Bar Issues

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/143

## Problem Analysis

After reviewing the code and understanding the issues:

1. **Collapsed Chat Text**: Currently shows "Ask OSmos about your questionnaire" but should show "Ask Oskar about your profile"
2. **Draggable Chat**: Currently fixed at bottom-6 left-6, needs to be draggable
3. **Progress Bar**: Shows 0% even when questions are answered
4. **Page Navigation**: Visual states are inconsistent

## Root Causes

1. **Progress Bar Issue**: The completion percentage is calculated in `WorkflowStateManager` based on answered questions, but the state might not be properly synced when loading
2. **Page States**: The page status logic in NavigationMenu might not accurately reflect the actual completed pages
3. **Chat Text**: Simple text change needed
4. **Draggable**: Need to implement drag functionality

## Implementation Plan

### Step 1: Fix Collapsed Chat Text
- Update `/app/chat/assessment/components/ChatInterface/CollapsedChat.tsx`
- Change "Ask OSmos about your questionnaire" to "Ask Oskar about your profile"

### Step 2: Implement Draggable Functionality
- Add state to track chat position
- Implement mouse/touch event handlers for dragging
- Store position in localStorage for persistence
- Ensure click events still work for expanding chat

### Step 3: Fix Progress Bar Calculation
- Debug why completionPercentage is 0 when questions are answered
- Check if workflow state is properly loaded from the API
- Ensure state updates are propagated to UI components

### Step 4: Fix Page Navigation States
- Review the `getPageStatus` logic in NavigationMenu
- Ensure it correctly identifies completed vs current vs upcoming pages
- Make sure the visual states match the actual progress

## Technical Considerations

1. **Draggable Implementation**:
   - Use React state to track position
   - Add mousedown/touchstart, mousemove/touchmove, mouseup/touchend handlers
   - Use CSS transform for positioning
   - Prevent drag when clicking the expand button

2. **Progress Calculation**:
   - Trace data flow from API → AssessmentChatClient → NavigationMenu
   - Check if initial load properly fetches answered questions
   - Verify state updates after answering questions

3. **Page Status Logic**:
   - Review how currentPage is determined
   - Check if completed pages are tracked separately
   - Ensure consistency between progress % and page checkmarks

## Testing Plan

1. Manual testing with Puppeteer:
   - Verify chat text change
   - Test dragging functionality across screen
   - Confirm progress bar updates when answering questions
   - Check page navigation visual states

2. Unit tests:
   - Update existing tests for new chat text
   - Add tests for drag functionality
   - Verify progress calculation logic

## Files to Modify

1. `/app/chat/assessment/components/ChatInterface/CollapsedChat.tsx` - Text change and draggable
2. `/app/chat/assessment/components/NavigationMenu.tsx` - Page status logic
3. `/app/chat/assessment/AssessmentChatClient.tsx` - Debug state loading
4. Possibly `/src/lib/mock-tms-api/workflow-state-manager.ts` - If progress calculation needs fixing

## Acceptance Criteria

- [ ] Collapsed chat shows "Ask Oskar about your profile"
- [ ] Chat can be dragged around the screen
- [ ] Chat position persists on page reload
- [ ] Progress bar shows correct percentage based on answered questions
- [ ] Page navigation shows correct visual states (checkmarks, highlights)
- [ ] All existing functionality remains intact