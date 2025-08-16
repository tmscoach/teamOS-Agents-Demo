# Implementation Plan: HTML Summary Endpoint

## Issue #160: Add tms_generate_html_summary endpoint
https://github.com/tmscoach/teamOS-Agents-Demo/issues/160

## Overview
Implement a condensed 1-2 page HTML summary report endpoint that provides quick overviews of TMS assessments.

## Technical Analysis

### Existing Infrastructure
1. **Report Generation Pattern** (`src/lib/mock-tms-api/report-generators.ts`)
   - `generateHTMLReport()` - Main entry point that routes by assessment type
   - `generateTMPReport()`, `generateQO2Report()`, etc. - Type-specific generators
   - `loadTemplate()` - Template loader with placeholder replacement
   - `calculateTMPResults()` - Score calculation logic

2. **Template System** (`src/lib/mock-tms-api/report-templates/`)
   - Uses HTML templates with `{{PLACEHOLDER}}` syntax
   - Templates include embedded CSS and JavaScript
   - Image URLs point to `/GetGraph` endpoints

3. **Mock API Client** (`src/lib/mock-tms-api/mock-api-client.ts`)
   - Routes requests to appropriate handlers
   - JWT authentication validation
   - Already handles `/Report/Get/{subscriptionId}` for full reports

4. **Test Page UI** (`app/admin/tms-api-test/page.tsx`)
   - Organized by tool categories (Assessment, Debrief, etc.)
   - Quick Test dropdowns for common scenarios
   - Manual subscription ID input fields

### Summary Template Structure (from documentation)
The summary HTML should include:
- Main wheel graphic with major/related roles
- Profile summary table (Major Role, Related Roles, Net Scores)
- Work preferences bar chart
- Key characteristics (3-5 bullet points)
- Minimal CSS for mobile responsiveness

## Implementation Steps

### Phase 1: Create Summary Generator Functions
1. **File: `src/lib/mock-tms-api/summary-generators.ts`** (NEW)
   - Export `generateHTMLSummary()` - Main entry point
   - `generateTMPSummary()` - TMP-specific summary
   - `generateQO2Summary()` - QO2-specific summary
   - `generateTeamSignalsSummary()` - Team Signals summary
   - Reuse existing calculation logic from `report-generators.ts`

### Phase 2: Create Summary Templates
1. **File: `src/lib/mock-tms-api/report-templates/tmp-summary.html`** (NEW)
   ```html
   <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
     <h2>Team Management Profile Summary</h2>
     <h3>{{RESPONDENT_NAME}}</h3>
     
     <table style="width: 100%; background: white; border: 1px solid #ddd;">
       <tr>
         <td style="width: 40%; vertical-align: top; padding: 20px;">
           <img src="{{BASE_URL}}/GetGraph?CreateTMPQWheel&mr={{MAJOR_ROLE_SCORE}}&rr1={{RELATED_ROLE_1_SCORE}}&rr2={{RELATED_ROLE_2_SCORE}}&clear=yes" 
                style="width: 100%; max-width: 300px;">
         </td>
         <td style="vertical-align: middle; padding: 20px;">
           <table style="width: 100%;">
             <tr><td><b>Major Role:</b></td><td>{{MAJOR_ROLE}}</td></tr>
             <tr><td><b>1st Related Role:</b></td><td>{{RELATED_ROLE_1}}</td></tr>
             <tr><td><b>2nd Related Role:</b></td><td>{{RELATED_ROLE_2}}</td></tr>
             <tr><td><b>Organization:</b></td><td>{{ORGANIZATION_NAME}}</td></tr>
           </table>
         </td>
       </tr>
     </table>
     
     <h3>Work Preferences</h3>
     <div style="background: white; padding: 20px; border: 1px solid #ddd;">
       <!-- Work preference bar chart will go here -->
       <img src="{{BASE_URL}}/GetGraph?CreateTMPQPreferenceWheel" style="width: 100%; max-width: 400px;">
     </div>
     
     <h3>Key Characteristics</h3>
     <ul>
       <li>Strong preference for {{MAJOR_ROLE}} activities</li>
       <li>Secondary strength in {{RELATED_ROLE_1}} tasks</li>
       <li>Effective at balancing structure with flexibility</li>
     </ul>
     
     <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
       Generated: {{REPORT_DATE}} | Template: Summary v1.0
     </div>
   </div>
   ```

2. **Similar templates for QO2 and Team Signals**

### Phase 3: Add API Endpoint
1. **File: `src/lib/mock-tms-api/endpoints/reports.ts`**
   - Add new endpoint handler:
   ```typescript
   '/Report/GetSummary/{subscriptionId}': async (params) => {
     const { subscriptionId } = params;
     // Validate subscription exists
     // Generate summary HTML
     // Return HTML string
   }
   ```

2. **File: `src/lib/mock-tms-api/mock-api-client.ts`**
   - Add routing for `/Report/GetSummary/{subscriptionId}`

### Phase 4: Add Tool Registry Entry
1. **File: `src/lib/agents/tools/tms-tool-registry.ts`**
   ```typescript
   'tms_generate_html_summary': {
     name: 'tms_generate_html_summary',
     description: 'Generate a condensed HTML summary for a completed assessment',
     endpoint: '/Report/GetSummary/{subscriptionId}',
     method: 'GET',
     requiresAuth: true,
     category: 'debrief',
     parameters: {
       subscriptionId: {
         type: 'string',
         description: 'The subscription ID',
         required: true
       },
       templateId: {
         type: 'string',
         description: 'Template version (default: 6)',
         required: false
       }
     }
   }
   ```

### Phase 5: Update Test Page UI
1. **File: `app/admin/tms-api-test/page.tsx`**
   - Add new tool UI in Debrief section after `tms_generate_html_report`
   - Include Quick Test dropdown with same subscriptions
   - Include manual subscription ID input
   - Display HTML response in preview area

### Phase 6: Testing
1. Test all subscription IDs (21989, 21990, 21991 for TMP)
2. Verify HTML renders correctly
3. Check image URLs resolve
4. Test mobile responsiveness
5. Verify no vision processing triggered
6. Confirm < 100KB size
7. Test with Puppeteer for visual validation

## Key Decisions
1. **Reuse existing calculation logic** - Don't duplicate the scoring algorithms
2. **Separate summary generators** - Keep them distinct from full report generators
3. **Simple HTML structure** - No complex JavaScript, minimal CSS
4. **Static key points** - For MVP, use template-based key characteristics
5. **No vision processing** - Summaries should be instant

## Success Criteria
- [ ] Endpoint returns valid HTML for all test subscriptions
- [ ] HTML size < 100KB
- [ ] Renders correctly on mobile (375px width)
- [ ] All images load properly
- [ ] Generates in < 500ms
- [ ] JWT authentication works
- [ ] Test page UI functional

## Notes
- Future enhancement: Dynamic key characteristics based on scores
- Future enhancement: Add "View Full Report" link
- Consider caching summaries since mock data is static