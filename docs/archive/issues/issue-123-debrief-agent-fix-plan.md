# Issue #123: DebriefAgent Fix Plan

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/123

## Problem Summary
1. DebriefAgent cannot load reports - "Invalid user ID format" error
2. Module import error in debrief-guardrails.ts
3. Knowledge base search not returning results

## Root Causes
1. User ID validation regex doesn't accept database-generated IDs (CUIDs)
2. Dynamic import path using `@/lib` alias failing in guardrails
3. Knowledge base search potentially not being invoked correctly

## Fix Plan

### Step 1: Fix User ID Validation
- Update regex in `report-context-service.ts` line 1285
- Add support for CUID format (e.g., `cmcujg1nf0000smqd9rtnrfcp`)
- Keep backward compatibility with existing formats

### Step 2: Fix Import Path
- Change dynamic import in `debrief-guardrails.ts` line 101
- Use relative import instead of alias: `../../mock-tms-api/mock-data-store`

### Step 3: Debug Knowledge Base Search
- Check if knowledge base tools are properly loaded
- Verify search is being called with correct parameters
- Test search functionality independently

### Step 4: Testing
- Test report loading with subscription ID 21989
- Test knowledge base search for ICAF
- Run existing test suites
- Use Puppeteer to test UI if needed

### Step 5: Create PR
- Commit changes with descriptive messages
- Create PR with test results
- Reference issue #123