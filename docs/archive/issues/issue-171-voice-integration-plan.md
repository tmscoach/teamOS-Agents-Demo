# Issue 171: Voice Integration for Report Debrief - Implementation Plan

**Issue Link:** https://github.com/tmscoach/teamOS-Agents-Demo/issues/171
**Parent Epic:** #168
**Date:** 2025-08-12

## Overview
Add voice capabilities to the JSON report viewer, enabling users to have voice conversations about their assessment results. The implementation will leverage the existing voice infrastructure from the assessment flow and adapt it for the report debrief context.

## Current State Analysis

### Existing Infrastructure
1. **Voice Components (Assessment):**
   - `VoiceModeEntry` - First-time user prompt
   - `VoiceToggle` - Voice activation button  
   - `VoicePermissionDialog` - Permission request UI
   - `TranscriptDisplay` - Real-time transcript
   - `VoiceCommandHelp` - Command reference
   - `VoiceIndicator` - Visual feedback

2. **Voice Services:**
   - `realtime-connection.ts` - OpenAI Realtime API WebSocket
   - `voice-navigation.service.ts` - Voice command processing
   - `useVoiceNavigation` hook - Voice state management
   - `/api/voice/session/route.ts` - Session token generation

3. **JSON Report Viewer:**
   - `ReportChatWrapper` - UnifiedChat integration (already exists)
   - `JsonReportViewer` - Report display component
   - Report data with vector chunks stored in Supabase
   - DebriefAgent with 14+ tools for report analysis

4. **Unified Chat:**
   - Plugin architecture supporting voice
   - `VoicePlugin` for assessment (needs adaptation)
   - `DebriefPlugin` (skeletal, needs implementation)

## Implementation Tasks

### Phase 1: Voice Plugin Adaptation for Debrief
1. **Create Report Voice Plugin (`report-voice-plugin.tsx`):**
   - Extend existing VoicePlugin for report context
   - Adapt VoiceBanner for report debrief
   - Configure voice commands for report navigation
   - Pass report data to voice session

2. **Update Voice Session API:**
   - Modify `/api/voice/session/route.ts` to accept report context
   - Include report ID and subscription ID in session
   - Add report-specific instructions for OSmos

### Phase 2: Voice Mode Entry & Permissions
1. **Create Report Voice Entry Component:**
   - Adapt `VoiceModeEntry` for report context
   - Show benefits specific to report debrief:
     - "Ask about your major role"
     - "Explore your strengths"
     - "Understand your work preferences"
   - Store preference with report-specific key

2. **Integrate Permission Flow:**
   - Use existing `VoicePermissionDialog`
   - Handle localStorage preferences for reports
   - Show appropriate messaging for report context

### Phase 3: Voice Command Integration
1. **Define Report-Specific Commands:**
   ```typescript
   const reportCommands = {
     'tell me about my major role': 'major_role_query',
     'what are my strengths': 'strengths_query',
     'explain my work preferences': 'preferences_query',
     'what should I work on': 'development_query',
     'navigate to [section]': 'navigate_section',
     'show me the [chart/graph]': 'show_visualization'
   }
   ```

2. **Implement Command Handlers:**
   - Process voice commands in report context
   - Trigger DebriefAgent queries
   - Navigate report sections
   - Display relevant visualizations

### Phase 4: Voice UI Components
1. **Add Voice Toggle to ReportChatWrapper:**
   - Integrate voice toggle button
   - Position appropriately with chat interface
   - Handle expand/collapse states

2. **Real-time Transcript Display:**
   - Show transcript overlay when voice active
   - Display recognized commands
   - Show agent responses

3. **Voice State Indicators:**
   - Listening/thinking/speaking states
   - Audio level visualization
   - Connection status

### Phase 5: Report Context Integration
1. **Enhance Voice Instructions:**
   ```typescript
   const generateReportInstructions = (report) => {
     return `You are OSmos, helping the user understand their ${report.reportType} assessment report.
     The user has completed their assessment and is now reviewing the results.
     
     Key sections in the report:
     - Major Role: ${report.majorRole}
     - Related Roles: ${report.relatedRoles}
     - Strengths and Development Areas
     - Work Preferences
     
     Guide them through understanding their results and how to apply them.`;
   }
   ```

2. **Vector Search Integration:**
   - Pass report chunks to voice context
   - Enable semantic queries about report content
   - Use existing `search-report-chunks-vector` tool

### Phase 6: Testing & Polish
1. **Test Voice Flow:**
   - First-time user experience
   - Permission handling
   - Voice activation/deactivation
   - Command recognition

2. **Cross-browser Testing:**
   - Chrome/Edge (primary)
   - Safari (WebRTC compatibility)
   - Firefox (fallback handling)

3. **Error Handling:**
   - Network failures
   - Permission denials
   - WebSocket disconnections
   - Graceful fallback to text

## Technical Implementation Details

### File Structure
```
app/(dashboard)/reports/json/[subscriptionId]/
├── components/
│   ├── voice/
│   │   ├── ReportVoiceModeEntry.tsx      # NEW
│   │   ├── ReportVoiceCommands.tsx       # NEW
│   │   └── ReportVoiceContext.tsx        # NEW
│   └── ReportChatWrapper.tsx             # MODIFY
│
src/components/unified-chat/plugins/
├── report-voice-plugin.tsx               # NEW
└── debrief-plugin.tsx                    # ENHANCE

app/api/voice/
└── session/
    └── route.ts                          # MODIFY
```

### Key Integration Points

1. **ReportChatWrapper Integration:**
```tsx
// Add voice plugin to UnifiedChat
const plugins = [
  DebriefPlugin,
  ReportVoicePlugin, // NEW
];

// Pass report context to voice
initialContext={{
  ...existing,
  voiceContext: {
    reportId: report.id,
    subscriptionId: report.subscriptionId,
    reportType: report.reportType,
    reportChunks: report.chunks // For vector search
  }
}}
```

2. **Voice Session Enhancement:**
```typescript
// In /api/voice/session/route.ts
if (body.reportId) {
  const reportChunks = await getReportChunks(body.reportId);
  instructions += generateReportContext(reportChunks);
}
```

## Success Criteria
- [ ] Voice mode seamlessly integrates with report viewer
- [ ] First-time users see clear voice onboarding
- [ ] Voice commands navigate report sections
- [ ] Natural conversation about report content works
- [ ] Real-time transcript displays correctly
- [ ] Graceful fallback when voice unavailable
- [ ] All existing report functionality preserved
- [ ] Voice and text modes can be toggled freely

## Testing Checklist
- [ ] Voice permission flow
- [ ] Command recognition accuracy
- [ ] Report navigation via voice
- [ ] Context-aware responses
- [ ] Session management
- [ ] Error recovery
- [ ] Cross-browser compatibility
- [ ] Performance with large reports

## Notes
- Leverage existing voice infrastructure from assessment flow
- Maintain consistency with assessment voice UX
- Report context must be available to voice session
- Vector chunks enable semantic voice queries
- Can develop in parallel with Phase 2 (UI improvements)