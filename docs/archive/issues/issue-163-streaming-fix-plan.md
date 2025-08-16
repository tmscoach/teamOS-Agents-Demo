# Issue #163: Fix OnboardingAgent Streaming Not Working in Browser

Issue link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/163

## Problem Analysis

After investigating the codebase and error logs, I've identified the following issues:

### Primary Issue
The OnboardingAgent's streaming responses are failing to reach the browser client. The server shows a successful 200 response, but the client receives an error:
```
Chat error: Error: An error occurred.
    at onErrorPart (index.mjs:1155:13)
    at processDataStream (index.mjs:854:49)
```

### Root Cause Analysis

1. **Streaming Response Issue**: The error occurs in the Vercel AI SDK's stream processing on the client side, but the server shows the stream is being returned successfully.

2. **Server Logs Show Success**: 
   - `[Streaming] Starting AI stream with: { model: 'gpt-4o-mini', hasTools: true, toolCount: 9 }`
   - `[Streaming] Returning stream response`
   - `POST /api/agents/chat-streaming 200 in 4767ms`

3. **Client Cannot Process Stream**: The `useChat` hook in `ChatClientOptimized.tsx` is receiving an error when trying to process the stream.

### Potential Causes

1. **Response Format Issue**: The server might not be returning the stream in the exact format expected by the `useChat` hook.

2. **Tool Execution Problem**: The OnboardingAgent has 9 tools, and the error might be related to tool execution or tool response streaming.

3. **Error Handling in streamText**: There might be an unhandled error within the `streamText` call that's causing it to return an error stream.

4. **Missing Error Details**: The generic "An error occurred" message suggests the actual error is being swallowed somewhere.

## Implementation Plan

### Phase 1: Add Comprehensive Error Logging

1. **Enhance Error Handling in route.ts**
   - Wrap the entire `streamText` call in a try-catch block
   - Add detailed error logging before returning error responses
   - Log the full error stack trace, not just the message
   - Add logging for tool execution failures

2. **Add Client-Side Error Details**
   - Enhance the onError handler in ChatClientOptimized to log full error details
   - Check if error has additional properties beyond just the message

### Phase 2: Fix Streaming Response

1. **Verify Stream Response Format**
   - Ensure the stream response includes all required headers
   - Check that the stream is properly formatted for the AI SDK
   - Verify tool results are properly serialized

2. **Add Fallback for Tool Errors**
   - If a tool execution fails, ensure it doesn't break the entire stream
   - Return a user-friendly error message instead of failing silently

3. **Test Without Tools First**
   - Temporarily disable tools for OnboardingAgent to isolate if the issue is tool-related
   - If it works without tools, gradually add them back to identify the problematic tool

### Phase 3: Add Comprehensive Tests

1. **Test OnboardingAgent Streaming**
   - Create a specific test for OnboardingAgent initial greeting
   - Test with and without tools
   - Test error scenarios

2. **Integration Test**
   - Test the full flow from client to server and back
   - Verify the stream format matches what useChat expects

### Phase 4: Fix Identified Issues

Based on the testing and logging, implement the actual fixes:

1. **If tool-related**: Fix tool execution or serialization
2. **If format-related**: Adjust the stream response format
3. **If error-handling related**: Properly handle and report errors

## Key Files to Modify

1. `/app/api/agents/chat-streaming/route.ts` - Main streaming endpoint
2. `/app/chat/ChatClientOptimized.tsx` - Client-side chat component
3. `/app/api/agents/chat-streaming/__tests__/onboarding-streaming.test.ts` - New test file
4. `/src/lib/agents/implementations/onboarding-agent.ts` - OnboardingAgent implementation

## Testing Strategy

1. **Manual Testing**:
   - Test OnboardingAgent at http://localhost:3000/chat?agent=OnboardingAgent&new=true
   - Monitor both browser console and server logs
   - Test with different user inputs

2. **Automated Testing**:
   - Unit tests for streaming response
   - Integration tests for full flow
   - Error scenario tests

## Success Criteria

1. OnboardingAgent responses stream properly to the browser
2. No console errors during streaming
3. Tests cover the streaming scenario to prevent regression
4. Error messages are informative rather than generic