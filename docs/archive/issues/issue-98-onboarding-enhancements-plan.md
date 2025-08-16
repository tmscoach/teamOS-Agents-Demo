# Issue #98: Manager Onboarding Screen Enhancements Plan

Issue Link: [GitHub Issue #98](https://github.com/tmscoach/teamOS-Agents-Demo/issues/98)

## Overview
Enhance the onboarding agent chat screens to dynamically update the right panel as the agent extracts information (manager name, role, team size). The system should display extracted information in real-time and show appropriate visualizations (like team charts) based on the collected data.

## Key Requirements
1. Update right panel dynamically as agent extracts:
   - Manager name 
   - User's role (don't assume they're always a manager)
   - Team size (with visualization)
2. Create a team organization chart when team size is extracted
3. Present a "Go to Dashboard" button when onboarding is complete
4. Use existing Figma mockups as visual reference
5. **Dynamic Completion**: Agent should know when to wrap up based on extraction rules from `/admin/agents/config`, not hard-coded fields
6. **Fix Admin Display**: The captured variables shown in `/admin/conversations` should pull from the agent's configured extraction rules, not show legacy fields

## Current State Analysis
- **Chat Layout**: `app/chat/components/ChatLayout.tsx` has static right panel with user avatar
- **Chat Client**: `app/chat/ChatClient.tsx` manages conversation state
- **Onboarding Agent**: `src/lib/agents/implementations/onboarding-agent.ts` has extraction capabilities
- **Extraction Processor**: `src/lib/agents/extraction/extraction-processor.ts` handles variable extraction
- **API Routes**: Chat messages handled via `/api/agents/chat-simple`

## Additional Requirements Details

### Dynamic Completion Logic
- The onboarding agent currently has extraction rules configured in the database via `/admin/agents/config`
- Current required fields: `team_size`, `manager_name`, `manager_role`, `organization`, `primary_challenge`
- These fields can be added/removed by admins at any time
- The agent must dynamically check if all required fields from its current configuration have been extracted
- Once all required fields are captured, the agent should present the completion screen

### Fix Admin Conversations Display
- The `/admin/conversations/[id]` page currently shows hard-coded legacy fields
- It should instead:
  1. Fetch the agent's extraction rules from the database
  2. Display only the fields that are configured for that agent
  3. Show the actual field names and descriptions from the configuration
  4. Properly indicate which fields are required vs optional

## Implementation Plan

### Phase 1: Enhance State Management
1. Extend ChatClient state to track extracted variables:
   - Add `extractedData` state object
   - Track: `userName`, `userRole`, `teamSize`
   - Pass this state down to ChatLayout

2. Modify message handling to capture extracted data:
   - Parse agent responses for extracted variables
   - Update state when variables are detected

### Phase 2: Create Dynamic Right Panel Components
1. Create new components:
   - `ProfileDisplay` - Shows avatar, name, and role
   - `TeamVisualization` - Shows team org chart
   - `OnboardingProgress` - Shows completion status

2. Implement conditional rendering in ChatLayout:
   - Show profile info when name/role extracted
   - Show team chart when team size extracted
   - Show completion state when all data collected

### Phase 3: Enhance Agent Response Format
1. Modify onboarding agent to return structured data:
   - Include extracted variables in response metadata
   - Add completion status flag based on dynamic extraction rules
   - Signal when ready for dashboard transition
   - Check against current extraction configuration, not hard-coded fields

2. Update API response handling:
   - Parse structured response data
   - Extract variables and status
   - Update UI state accordingly

### Phase 3.5: Fix Admin Conversations Display
1. Update `/app/admin/conversations/[id]/page.tsx`:
   - Fetch agent's extraction rules from database
   - Display fields based on actual configuration
   - Show proper field names and descriptions
   - Indicate required vs optional fields

2. Create new API endpoint or service method:
   - Get extraction rules for specific agent
   - Format for display in admin UI

### Phase 4: Implement Visual Components
1. Profile visualization:
   - Dynamic name display
   - Role label under name
   - Keep existing avatar style

2. Team chart visualization:
   - Manager at top
   - Team members below with connecting lines
   - Use colors from mockups (#f8dcb8, #edbbd2, #cfbcd9, #a7c0e3)
   - Grid background pattern

3. Completion state:
   - "Go to Team Dashboard" button
   - Success message from agent
   - Navigate to `/dashboard` on click

### Phase 5: Real-time Updates
1. Implement smooth transitions:
   - Animate panel updates
   - Show loading states during extraction
   - Provide visual feedback for updates

2. Handle edge cases:
   - Multiple extractions of same field
   - Corrections to previously extracted data
   - Incomplete extraction scenarios

## Technical Approach

### 1. Message Structure Enhancement
```typescript
interface ExtractedData {
  userName?: string;
  userRole?: string;
  teamSize?: number;
  isComplete?: boolean;
}

interface EnhancedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  extractedData?: ExtractedData;
}
```

### 2. Component Structure
```
ChatClient
├── ChatLayout
│   ├── LeftPanel (Chat Messages)
│   └── RightPanel (Dynamic Content)
│       ├── ProfileDisplay
│       ├── TeamVisualization
│       └── CompletionActions
```

### 3. Data Flow
1. User sends message → API call
2. Agent processes → Extracts variables
3. API returns response + extracted data
4. Client updates state → UI reflects changes
5. Right panel updates based on extracted data

## Files to Modify
1. `app/chat/ChatClient.tsx` - Add extracted data state management
2. `app/chat/components/ChatLayout.tsx` - Make right panel dynamic
3. Create new components in `app/chat/components/`:
   - `ProfileDisplay.tsx`
   - `TeamVisualization.tsx`
   - `OnboardingCompletion.tsx`
4. `app/api/agents/chat-simple/route.ts` - Return extracted data
5. `src/lib/agents/implementations/onboarding-agent.ts` - Dynamic completion check
6. `app/admin/conversations/[id]/page.tsx` - Fix captured variables display
7. Create new service method to fetch agent extraction rules for admin display

## Testing Strategy
1. Test extraction of each variable type
2. Verify UI updates correctly for each extraction
3. Test completion flow and navigation
4. Ensure backwards compatibility
5. Test edge cases (corrections, multiple values)

## Success Criteria
- Right panel updates in real-time as data is extracted
- Visual design matches Figma mockups
- Smooth user experience with clear feedback
- Successful navigation to dashboard on completion
- All extracted data is properly displayed