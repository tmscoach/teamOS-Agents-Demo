# Issue #130: Create Specialized Debrief Agent Interface - Implementation Plan

Issue Link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/130

## Overview
Create a specialized debrief interface that combines a full-page report viewer with a collapsible chat interface, matching the Figma mockup design.

## Analysis Summary

### Current State
- DebriefAgent uses the generic `/chat` interface like all other agents
- When clicking "Test in Chat" from `/admin/agents/config`, it redirects to `/chat?agent=DebriefAgent&new=true`
- Reports are loaded via `tms_generate_html_report` tool which returns HTML content
- No visual report display, just conversational interaction

### Target State
- New route `/chat/debrief` with specialized UI
- Full-page report viewer showing TMP/QO2/Team Signals reports
- Collapsible chat interface at bottom with rainbow gradient theme
- Context-aware chat that knows which report section is visible

### Key Technical Findings
1. **Figma Mockup Structure** (from teamOS-figma-designs):
   - **DbHeader**: Fixed header (108px height) with "Team Management Profile" title and "Done" button
   - **MainCard**: Congratulations card with "+5000 credits and a new badge" notification
   - **NavigationMenu**: Profile card showing "Creator Innovator" with gradient background image and detailed description
   - **Frame**: Two cards side-by-side:
     - Suggested reading: "Creative Leadership"
     - Based on goals: "2x Weekly challenges"
   - **DbMainCard**: Detailed insights list with key points
   - **Chat Interface**: 
     - Fixed position: `top-[712px] left-[424px]`
     - Rainbow gradient background with 5px backdrop blur
     - "Ask Oskar about your profile" prompt
     - Complex gradient border using mask technique

2. **Report Data Flow**:
   - `tms_generate_html_report` returns full HTML report
   - Need to parse HTML and extract structured data
   - Template IDs differ by report type (TMP, QO2, etc.)

3. **Chat Integration**:
   - Current chat uses `useChat` hook from 'ai/react'
   - Streaming responses via `/api/agents/chat-streaming`
   - Need to pass report context to agent

## Implementation Plan

### Phase 1: Route and Basic Layout (Day 1)

#### 1.1 Create New Route Structure
```
app/chat/debrief/
├── page.tsx
├── layout.tsx
└── components/
    ├── DebriefLayout.tsx
    ├── ReportViewer/
    │   └── index.tsx
    └── ChatInterface/
        └── index.tsx
```

#### 1.2 Update Admin Config Redirect
- Modify `/admin/agents/config/page.tsx` line 554:
  - If agent is DebriefAgent, redirect to `/chat/debrief` instead of `/chat`
  - Pass additional params: `&reportType=TMP&subscriptionId=XXX`

#### 1.3 Create Basic Layout Components
- Fixed header matching Figma DbHeader
- Scrollable content area
- Fixed bottom chat interface (collapsed by default)

### Phase 2: Report Viewer Components (Day 2-3)

#### 2.1 HTML Report Parser
```typescript
interface ParsedReport {
  title: string;
  subtitle: string;
  profileType: string;
  majorRole: string;
  relatedRoles: string[];
  scores: Record<string, number>;
  insights: string[];
  recommendations: {
    reading?: string;
    goals?: string;
  };
  images: {
    profileCard?: string;
    charts?: string[];
  };
}
```

#### 2.2 Report Section Components
- **ProfileCard**: Visual profile with gradient background
- **InsightsCard**: Key points list
- **NavigationMenu**: Profile summary
- **Frame**: Recommendations cards

#### 2.3 Report Type Handlers
- TMPReport.tsx: Parse TMP-specific HTML structure
- QO2Report.tsx: Parse QO2 format
- TeamSignalsReport.tsx: Parse Team Signals format

### Phase 3: Chat Interface (Day 4)

#### 3.1 Collapsible Chat Component
```typescript
interface ChatState {
  isExpanded: boolean;
  height: number; // 60px collapsed, 50-70% expanded
  messages: Message[];
}
```

#### 3.2 Rainbow Gradient Styling (Exact from Figma)
```css
/* Chat container styling */
.chat-container {
  position: fixed;
  top: 712px;
  left: 424px;
  padding: 24px;
  border-radius: 6px 6px 0px 0px;
  border: 1px solid var(--shadcn-ui-border);
  box-shadow: 0px 4px 6px -4px #0000001a, 0px 10px 15px -3px #0000001a;
  backdrop-filter: blur(5px) brightness(100%);
  -webkit-backdrop-filter: blur(5px) brightness(100%);
  background: linear-gradient(158deg,
    rgba(255,243,3,0.05) 0%,
    rgba(251,169,61,0.05) 15%,
    rgba(237,1,145,0.05) 30%,
    rgba(167,99,173,0.05) 45%,
    rgba(1,133,198,0.05) 60%,
    rgba(2,181,230,0.05) 75%,
    rgba(1,161,114,0.05) 90%,
    rgba(162,211,111,0.05) 100%
  );
}

/* Chat input with gradient border */
.chat-input {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2px;
    border-radius: var(--shadcn-ui-radius-md);
    background: linear-gradient(152deg,
      rgba(255,243,3,1) 0%,
      rgba(251,169,61,1) 15%,
      rgba(237,1,145,1) 30%,
      rgba(167,99,173,1) 45%,
      rgba(1,133,198,1) 60%,
      rgba(2,181,230,1) 75%,
      rgba(1,161,114,1) 90%,
      rgba(162,211,111,1) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, 
                  linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: 1;
    pointer-events: none;
  }
}
```

#### 3.3 Animation and Interactions
- Smooth expand/collapse transition (300ms ease-in-out)
- Click header to toggle expand/collapse
- Maintain scroll position in messages
- Auto-scroll to bottom on new message

### Phase 4: Integration (Day 5)

#### 4.1 Report Loading Flow
1. Page loads with URL params
2. Fetch report using `tms_generate_html_report`
3. Parse HTML into structured data
4. Render report sections
5. Initialize chat with report context

#### 4.2 Context Passing to Agent
```typescript
interface DebriefContext {
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  subscriptionId: string;
  visibleSection: string;
  scrollPosition: number;
  reportData: ParsedReport;
}
```

#### 4.3 Modified Chat Initialization
- Pass report context in initial message
- Include visible section updates as user scrolls
- Agent can reference specific sections in responses

### Phase 5: Polish and Testing (Day 6)

#### 5.1 Loading States
- Skeleton loaders for report sections
- Progressive loading of images
- Chat loading indicator

#### 5.2 Error Handling
- Failed report load fallback
- Network error recovery
- Invalid subscription handling

#### 5.3 Responsive Design
- Mobile: Full screen report, overlay chat
- Tablet: Adjusted layout proportions
- Desktop: Full Figma mockup layout

## Technical Considerations

### State Management
```typescript
// Use React Context for shared state
const DebriefContext = createContext<{
  report: ParsedReport | null;
  chat: ChatState;
  context: DebriefContext;
}>();
```

### Performance Optimizations
1. Lazy load report images
2. Virtualize long insight lists
3. Cache parsed report data
4. Debounce scroll position updates

### Accessibility
- Keyboard navigation for chat expand/collapse
- Screen reader announcements for new messages
- Proper ARIA labels for all interactive elements
- High contrast mode support

## Testing Strategy

### Unit Tests
- Report parser functions
- Component rendering
- State management hooks

### Integration Tests
- Report loading flow
- Chat message sending
- Context updates

### E2E Tests (Puppeteer)
1. Navigate to debrief interface
2. Verify report loads
3. Expand chat interface
4. Send message and verify response
5. Test different report types

## Rollout Plan

1. **Feature Flag**: Add `NEXT_PUBLIC_DEBRIEF_UI_ENABLED` flag
2. **Gradual Rollout**: 
   - Dev/staging first
   - 10% production users
   - Full rollout after validation
3. **Fallback**: Keep existing chat interface as fallback

## Success Metrics
- Page load time < 2s
- Chat response time < 5s (maintained from PR #129)
- Report parsing success rate > 99%
- User engagement with report sections
- Chat interaction quality

## Future Enhancements
1. Report annotations and notes
2. Export conversation + annotated report
3. Multi-report comparison view
4. Team debrief sessions
5. Report section deep-linking

## Dependencies
- PR #129 (DebriefAgent performance optimization) - MERGED
- Figma mockup components
- TMS API for report generation
- Existing chat infrastructure

## Risks and Mitigations
1. **HTML Parsing Complexity**: Create robust parser with fallbacks
2. **Performance Impact**: Implement progressive loading
3. **Browser Compatibility**: Test gradient/backdrop-filter support
4. **State Synchronization**: Use proven patterns (Context + reducers)

## Implementation Order
1. Basic route and layout
2. Report viewer (static mockup first)
3. Chat interface UI
4. Integration with real data
5. Context passing and agent integration
6. Polish and testing

This plan provides a systematic approach to implementing the specialized debrief interface while maintaining the performance improvements from PR #129.