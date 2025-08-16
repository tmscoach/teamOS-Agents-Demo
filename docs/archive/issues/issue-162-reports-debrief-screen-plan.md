# Issue 162: Reports/Debrief Screen Implementation Plan

**Issue Link**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/162

## Executive Summary

Implement a Reports screen accessible from the dashboard that displays completed assessment reports with integrated debrief chat and voice capabilities using the UnifiedChat architecture. The implementation will reuse existing components while maintaining backward compatibility.

## Analysis & Context

### Existing Components to Reuse
1. **UnifiedChat** (`/src/components/unified-chat/UnifiedChat.tsx`) - Main chat component with plugin system
2. **DebriefAgent** (`/src/lib/agents/implementations/debrief-agent.ts`) - Agent implementation
3. **Report Viewers** (`/app/chat/debrief/components/`) - StyledReportViewer, RawReportViewer
4. **Voice Infrastructure** - Already integrated in UnifiedChat via plugins
5. **Database Tables** - UserReport, ReportChunk, ReportImage already exist in Prisma schema

### Key Integration Points
- Dashboard navigation structure at `/app/(dashboard)/`
- UnifiedChat architecture with plugin system
- Existing debrief components at `/app/chat/debrief/`
- Database has UserReport table with processingStatus field for completed reports
- Report chunks in ReportChunk table for semantic search

## Implementation Plan

### Phase 1: Create Reports List Page (Day 1)

#### 1.1 Create Route Structure
```
/app/(dashboard)/reports/
  ├── page.tsx                    # Reports list page
  ├── ReportsClient.tsx            # Client component for list
  └── [reportId]/
      └── page.tsx                 # Individual report viewer
```

#### 1.2 Add Navigation Link
- Update `/app/(dashboard)/dashboard/page.tsx` to add "Reports" button in left sidebar
- Add icon (FileText from lucide-react)
- Position after "Team Dashboard" button

#### 1.3 Implement Reports List Component
```typescript
// ReportsClient.tsx
- Fetch completed reports from UserReport table
- Filter by userId and processingStatus = 'COMPLETED'
- Display as cards with:
  - Report type (TMP, QO2, etc.)
  - Creation date
  - Assessment name
  - Click to view action
```

#### 1.4 Database Query
```typescript
const reports = await prisma.userReport.findMany({
  where: {
    userId: user.id,
    processingStatus: 'COMPLETED'
  },
  orderBy: {
    createdAt: 'desc'
  },
  select: {
    id: true,
    reportType: true,
    subscriptionId: true,
    metadata: true,
    createdAt: true
  }
});
```

### Phase 2: Individual Report Viewer (Day 1-2)

#### 2.1 Create Report Detail Page
```typescript
// /app/(dashboard)/reports/[reportId]/page.tsx
- Server component to fetch report data
- Pass to client component for rendering
```

#### 2.2 Implement Report Layout
```typescript
// ReportViewerLayout.tsx
<div className="flex h-screen">
  {/* Left Panel - Report HTML */}
  <div className="flex-1 overflow-auto">
    <ReportViewer 
      reportHtml={report.processedHtml || report.rawHtml}
      displayMode={displayMode} // 'summary' | 'full'
    />
  </div>
  
  {/* Right Panel - UnifiedChat */}
  <div className="w-[400px] border-l">
    <UnifiedChat
      mode="debrief"
      agent="DebriefAgent"
      position="right-sidebar"
      defaultOpen={true}
      initialContext={{
        metadata: {
          reportId: report.id,
          subscriptionId: report.subscriptionId,
          assessmentType: report.reportType
        }
      }}
      plugins={[DebriefPlugin, VoicePlugin]}
    />
  </div>
</div>
```

#### 2.3 Reuse Existing Report Viewer
- Import and use `StyledReportViewer` from `/app/chat/debrief/components/`
- Support summary/full toggle functionality
- Ensure proper styling and scrolling

### Phase 3: UnifiedChat Integration (Day 2)

#### 3.1 Configure Debrief Plugin
```typescript
// Create or update debrief plugin
const DebriefPlugin: ChatPlugin = {
  name: 'debrief',
  compatibleModes: ['debrief'],
  components: {
    header: DebriefHeader,
    footer: DebriefFooter
  },
  handlers: {
    onInit: async (context) => {
      // Load report chunks for semantic search
      const chunks = await loadReportChunks(context.metadata.reportId);
      return { reportChunks: chunks };
    }
  },
  tools: [
    'search-report-chunks',
    'search-tms-knowledge'
  ]
};
```

#### 3.2 Ensure Report Context
- Pass reportId to UnifiedChat via metadata
- Ensure DebriefAgent has access to report chunks
- Verify search-report-chunks tool works with reportId

#### 3.3 Chat API Integration
- Verify `/api/agents/chat-streaming` handles debrief mode
- Ensure report context is passed to agent
- Test chunk search functionality

### Phase 4: Voice Capabilities (Day 2-3)

#### 4.1 Enable Voice Plugin
```typescript
plugins={[DebriefPlugin, VoicePlugin]}
```

#### 4.2 Voice Configuration
- Reuse existing voice infrastructure from assessment
- Configure for report reading capability
- Add voice toggle in chat header

#### 4.3 Voice Features
- Read report summary aloud
- Interactive Q&A about report
- Natural conversation about insights
- Use existing OpenAI Realtime API integration

### Phase 5: Summary/Full Toggle (Day 3)

#### 5.1 Add Toggle UI
```typescript
// In report viewer header
<ToggleGroup value={displayMode} onValueChange={setDisplayMode}>
  <ToggleGroupItem value="summary">Summary</ToggleGroupItem>
  <ToggleGroupItem value="full">Full Report</ToggleGroupItem>
</ToggleGroup>
```

#### 5.2 Fetch Different Report Versions
- If summary requested, call `tms_generate_html_summary` endpoint
- Cache summary version for performance
- Default to full report if summary not available

### Phase 6: Testing & Polish (Day 3-4)

#### 6.1 Test Scenarios
- [ ] Navigate from dashboard to reports list
- [ ] View list of completed reports
- [ ] Click report to view details
- [ ] Report HTML displays correctly
- [ ] UnifiedChat loads with debrief agent
- [ ] Chat provides contextual responses
- [ ] Voice can read report summary
- [ ] Voice Q&A works correctly
- [ ] Summary/full toggle works
- [ ] Responsive layout on different screen sizes

#### 6.2 Performance Optimization
- Lazy load report chunks
- Cache report HTML
- Optimize UnifiedChat initialization
- Test with large reports

#### 6.3 Error Handling
- Handle missing reports gracefully
- Show loading states
- Handle API errors
- Provide user feedback

## File Changes Summary

### New Files
1. `/app/(dashboard)/reports/page.tsx` - Reports list page
2. `/app/(dashboard)/reports/ReportsClient.tsx` - Client component
3. `/app/(dashboard)/reports/[reportId]/page.tsx` - Report detail page
4. `/app/(dashboard)/reports/[reportId]/ReportViewerLayout.tsx` - Layout component

### Modified Files
1. `/app/(dashboard)/dashboard/page.tsx` - Add Reports navigation link
2. `/src/components/unified-chat/plugins/registry.ts` - Ensure debrief plugin registered

### Reused Components
- UnifiedChat from `/src/components/unified-chat/`
- StyledReportViewer from `/app/chat/debrief/components/`
- DebriefAgent from `/src/lib/agents/implementations/`
- Voice infrastructure from existing implementation

## API Endpoints Used
- `/api/agents/chat-streaming` - For UnifiedChat
- `/api/mock-tms/generate-html-summary` - For summary reports
- Existing Supabase queries via Prisma

## Success Metrics
- Reports list loads within 2 seconds
- Report viewer renders HTML correctly
- UnifiedChat initializes with proper context
- Debrief agent provides relevant responses
- Voice capabilities work as expected
- No breaking changes to existing functionality

## Risk Mitigation
- Reuse existing components to minimize new code
- Maintain backward compatibility with existing debrief routes
- Test thoroughly with mock TMP data
- Implement proper error boundaries
- Add loading states for better UX

## Timeline
- Day 1: Reports list and basic report viewer
- Day 2: UnifiedChat integration and debrief functionality
- Day 3: Voice capabilities and summary toggle
- Day 4: Testing, polish, and bug fixes

Total estimated time: 4 days