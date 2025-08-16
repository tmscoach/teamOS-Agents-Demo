# Issue #132: Fix TMP Report Image Loading and DebriefAgent Issues - Implementation Plan

Issue Link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/132

## Overview
This issue addresses two critical problems:
1. TMP report images are not loading due to malformed URLs in the HTML template
2. DebriefAgent is experiencing system message truncation

## Detailed Analysis

### Problem 1: TMP Report Image Loading
- **Root Cause**: Backslashes in URLs and extra quotes in img tags
- **Impact**: 400/500 errors when loading images through the proxy
- **Files Affected**: 
  - `src/lib/mock-tms-api/report-templates/tmp-report.html`
  - `app/chat/debrief/components/ReportViewer/report-styles.css`

### Problem 2: DebriefAgent System Message Truncation
- **Root Cause**: String replacement in `buildSystemMessage` causing formatting issues
- **Impact**: Agent may not function correctly with incomplete instructions
- **Files Affected**: 
  - `src/lib/agents/implementations/openai-debrief-agent.ts`

## Implementation Plan

### Task 1: Fix TMP HTML Template URLs (High Priority)
1. Open `src/lib/mock-tms-api/report-templates/tmp-report.html`
2. Fix lines 1033, 1036, 1039, 1307, 1310, 1313:
   - Replace `/Asset\Get\` with `/Asset/Get/`
   - Replace `""/>` with `"/>`
3. Verify no other backslash URLs exist
4. Commit: "fix: Correct malformed URLs in TMP report template"

### Task 2: Add CSS Styles for TMP Images (Medium Priority)
1. Open `app/chat/debrief/components/ReportViewer/report-styles.css`
2. Add styles for:
   - `.imgholder img` - 120px circular images for major role
   - `.imgholder2 img` - 100px circular images for related roles
   - `.graphwheel` and `.graphwheel2` - proper wheel positioning
3. Commit: "feat: Add CSS styles for TMP role images and wheels"

### Task 3: Fix DebriefAgent System Message (High Priority)
1. Open `src/lib/agents/implementations/openai-debrief-agent.ts`
2. Review the `buildSystemMessage` override (lines 147-171)
3. Options:
   a. Fix the string replacement logic to be more robust
   b. Remove the override and handle logic in `processMessage` only
4. Test that the system message is complete
5. Commit: "fix: Resolve DebriefAgent system message truncation"

### Task 4: Handle HTML Entities (Optional - if still needed)
1. Check if HTML entities are still causing issues after URL fixes
2. If needed, update `ReportSection.tsx` to decode entities
3. Commit: "fix: Handle HTML entities in report image URLs"

### Task 5: Testing
1. Start dev server and navigate to `/chat/debrief`
2. Test TMP report loading with various profiles
3. Verify all images load correctly:
   - Role circle images
   - Wheel charts
   - GetGraph images with query parameters
4. Test DebriefAgent functionality:
   - Initial message handling
   - Subscription checking
   - Full debrief flow
5. Use Puppeteer to capture screenshots for visual verification

### Task 6: Add Tests
1. Create tests for:
   - Image URL processing
   - HTML entity handling
   - DebriefAgent message processing
2. Run full test suite

## Success Criteria
- All TMP report images load without 400/500 errors
- Images display with correct sizing and styling
- DebriefAgent system message is complete and functional
- Debrief flow works from start to finish
- All tests pass

## Notes
- The debrief interface was recently implemented in PR #131
- Image proxy has security validation that must be maintained
- The legacy system screenshot shows the expected visual layout