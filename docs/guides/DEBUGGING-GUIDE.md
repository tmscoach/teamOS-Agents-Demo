# Assessment Actions & Voice Debugging Guide

## Overview
This guide explains how to debug the assessment action flow and voice commands that broke after the unified chat architecture migration.

## The Problem
After implementing the unified chat architecture (GitHub issue #156), two critical features broke:
1. **Assessment Actions**: Commands like "update all questions and answer 1-2" no longer update the radio buttons
2. **Voice Commands**: Voice input for assessment navigation is broken

## Debugging Infrastructure

### 1. Server-Side Logging

#### Assessment Agent (`src/lib/agents/implementations/assessment-agent.ts`)
- Enhanced logging in `answer_question` and `answer_multiple_questions` tools
- Logs include:
  - Timestamp of execution
  - Full parameters and context metadata
  - Generated action tags
  - Validation that action tags are present in output

#### Streaming API (`app/api/agents/chat-streaming/route.ts`)
- Logs tool execution details
- Tracks action tag presence in responses
- Monitors tool results

### 2. Client-Side Logging

#### UnifiedChat Component (`src/components/unified-chat/UnifiedChat.tsx`)
- Logs in `onFinish` callback when messages complete
- Detects and processes `[ASSESSMENT_ACTION:` tags
- Dispatches custom events for detected actions
- Comprehensive logging of action processing

#### Assessment Chat Wrapper (`app/chat/assessment/components/AssessmentChatWrapper.tsx`)
- Event listener for `assessment-action-detected` events
- DOM polling fallback (checks every 500ms)
- Handles action execution (updating questions, navigation)

#### Assessment Actions Plugin (`src/components/unified-chat/plugins/assessment-actions.tsx`)
- Processes messages for action tags
- Dispatches events for detected actions
- Cleans action tags from displayed messages

### 3. Voice Debugging

#### Voice Navigation Service (`src/lib/services/voice/voice-navigation.service.ts`)
- Logs transcript receipt and processing
- Command parsing details
- Session state tracking

#### Voice Hook (`app/chat/assessment/hooks/useVoiceNavigation.ts`)
- Transcript and command logging
- State change monitoring

## Testing Tools

### 1. Browser Console Script (`scripts/debug-assessment-flow.js`)
Load this script in the browser console while on the assessment page:

```javascript
// Copy and paste the entire script into browser console
// Then use these commands:

window.testAssessmentAction('answer_question', '1:2-0')  // Test single answer
window.sendTestMessage('Update all questions and answer 2')  // Test chat message
window.debugSummary()  // Show debug summary
window.checkPlugins()  // Check registered plugins
```

### 2. HTML Test Dashboard (`test-assessment-actions.html`)
Open this file in a browser alongside the assessment page:
- Visual monitoring of events
- Quick test buttons
- Event statistics
- Log download capability

### 3. Quick Test Commands

```bash
# Test the assessment page directly
npm run dev
# Navigate to http://localhost:3000/chat/assessment

# Open test dashboard in another tab
open test-assessment-actions.html

# Monitor server logs
npm run dev 2>&1 | grep -E "AssessmentAgent|ASSESSMENT_ACTION|UnifiedChat"
```

## Common Issues & Solutions

### Issue 1: Action Tags Not Generated
**Check**: Server logs for `[AssessmentAgent] ==== ANSWER_QUESTION TOOL CALLED ====`
- If missing: Tool not being called properly
- If present but no action tag: Check tool execution logic

### Issue 2: Action Tags Not Reaching Client
**Check**: Browser console for `[UnifiedChat] ==== MESSAGE FINISHED ====`
- Look for `Has ASSESSMENT_ACTION: true/false`
- If false: Streaming might be stripping the tags

### Issue 3: Events Not Being Dispatched
**Check**: Browser console for `[AssessmentActionsPlugin] Dispatching action:`
- If missing: Plugin not processing messages
- If present: Event dispatch problem

### Issue 4: Events Not Being Handled
**Check**: Browser console for `[AssessmentChatWrapper] Received assessment action:`
- If missing: Event listener not attached or wrapper not mounted
- If present: Action execution logic problem

### Issue 5: Voice Commands Not Working
**Check**: Browser console for `[VoiceNavigationService] ==== TRANSCRIPT RECEIVED ====`
- If missing: Voice service not connected
- If present: Command parsing issue

## Action Flow Diagram

```
User Input → AssessmentAgent Tool → [ASSESSMENT_ACTION:] tag
    ↓
Streaming API → Tool Result with Tag
    ↓
UnifiedChat onFinish → Detect Tag → Dispatch Event
    ↓
AssessmentActionsPlugin → Process & Clean Message
    ↓
AssessmentChatWrapper → Handle Event → Update UI
```

## Key Breakpoints for Debugging

1. **Server-side**:
   - `assessment-agent.ts:115` - Tool execution start
   - `assessment-agent.ts:129` - Action tag generation

2. **Client-side**:
   - `UnifiedChat.tsx:98` - Action tag detection
   - `assessment-actions.tsx:31` - Plugin processing
   - `AssessmentChatWrapper.tsx:50` - Event handling

## Testing Checklist

- [ ] Server generates action tags (check logs)
- [ ] Tags appear in streaming response
- [ ] UnifiedChat detects tags in onFinish
- [ ] Plugin processes and dispatches events
- [ ] Wrapper receives and handles events
- [ ] UI updates correctly
- [ ] Voice transcripts are received
- [ ] Voice commands are parsed
- [ ] Voice actions trigger UI updates

## Next Steps

1. Run through the testing checklist
2. Identify where in the flow things break
3. Focus debugging on that specific component
4. Consider reverting to the working implementation if fixes are too complex

## Rollback Option

If the unified architecture proves too complex to fix quickly:
```bash
git checkout main  # Or the last known working commit
git checkout -b fix/assessment-actions-hotfix
# Cherry-pick only the essential changes
```