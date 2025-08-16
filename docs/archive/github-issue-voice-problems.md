# Voice Integration Issues - Follow-up to #171

## Context
This issue documents problems discovered while implementing #171 (Phase 3 Voice Integration for Report Debrief). While basic voice functionality is working, several critical issues remain.

## Current Problems

### 1. Audio Fragmentation/Stuttering
- **Issue**: Voice responses are choppy/fragmented at the start despite multiple buffering attempts
- **Current state**: Tried buffering 3, then 5 chunks, added fade-in, but stuttering persists
- **Root cause**: `isPlaying` flag gets reset when audio queue temporarily empties mid-stream, causing re-buffering

### 2. System Prompt Consistency  
- **Issue**: Voice and chat agents were NOT using the database system prompt from /admin panel
- **Current fix attempted**: 
  - Changed `loadFromConfig: false` to `true` in DebriefAgent
  - Added system prompt loading in TMSEnabledAgent
  - Modified /api/voice/session to fetch and pass database prompt
- **Status**: Partially fixed but needs testing

### 3. Report Data Access in Voice
- **Issue**: Voice agent cannot access report data, returns "technical issue" message
- **Root cause**: Initially tried to use Prisma directly in browser (won't work)
- **Current fix**: Changed to fetch from `/api/reports/json/${subscriptionId}` endpoint
- **Additional issue**: API route had wrong field name (`tmsApiToken` vs `TMSAuthToken`)

### 4. No Initial Greeting
- **Issue**: Voice agent is silent until user speaks first
- **Attempted fix**: Added explicit greeting in instructions, but `response.create` not triggering speech
- **Status**: Not fully resolved

### 5. Architecture Confusion
- **Issue**: Unclear separation between:
  - What runs on server vs client
  - Database config vs hardcoded instructions  
  - Assessment mode vs debrief mode tools
- **Impact**: Duplicate/conflicting implementations

## Code Changes Made So Far

### Files Modified:
1. `/src/lib/agents/implementations/debrief-agent.ts`
   - Changed `loadFromConfig: false` → `true`

2. `/src/lib/agents/implementations/tms-enabled-agent.ts`
   - Added system prompt loading from database config

3. `/app/api/voice/session/route.ts`
   - Added AgentConfigLoader import
   - Loads DebriefAgent config for report context
   - Passes system prompt to client

4. `/app/api/reports/json/[subscriptionId]/route.ts`
   - Fixed field name: `tmsApiToken` → `TMSAuthToken`

5. `/src/lib/services/voice/realtime-connection.ts`
   - Increased audio buffering (3 → 5 chunks)
   - Added fade-in for first chunk
   - Fixed `isPlaying` logic during response generation
   - Changed from direct tool execution to API call for reports
   - Added system prompt from database support

## Recommendations

### Option 1: Minimal Fix (Recommended)
1. Revert audio buffering changes (they're not working)
2. Keep the system prompt fixes
3. Keep the API field name fix
4. Create new issue for remaining problems
5. Submit PR for review

### Option 2: Complete Rewrite
1. Separate voice service from assessment navigation completely
2. Create dedicated voice debrief module
3. Properly implement server-side tool execution
4. Redesign audio streaming architecture

## Next Steps
1. Create this as GitHub issue #XXX
2. Submit current work as PR for #171 with known issues documented
3. Get code review before making more changes
4. Plan proper fix in new sprint

## Testing Checklist
- [ ] Voice agent starts with greeting
- [ ] Audio plays smoothly without stuttering  
- [ ] Voice agent can access report data (major role, etc.)
- [ ] System prompt from /admin is used by both voice and chat
- [ ] No console errors during voice session