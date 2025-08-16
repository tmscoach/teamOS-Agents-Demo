# Issue 101 - Manager Dashboard Implementation Plan

**GitHub Issue**: [#101 - Manager Dashboard](https://github.com/tmscoach/teamOS-Agents-Demo/issues/101)

## Overview

Implement a Manager Dashboard at `/dashboard` that users are redirected to after completing the onboarding process at `/chat?agent=OnboardingAgent`. The dashboard should reflect the user's journey status as 'Assessment' and follow the design mockup provided.

## Requirements

1. **Post-Onboarding Redirect**: Managers who complete onboarding should land on `/dashboard`
2. **Journey Tracking Integration**: Display current journey phase (Assessment) after onboarding
3. **Design Implementation**: Match the Figma design mockup from `/Users/rowanmccann/Documents/Development/teamOS-figma-designs/src/app/dashboard-1/page.tsx`
4. **Dynamic Data**: Show user's name and team information captured during onboarding
5. **No Breaking Changes**: Ensure existing functionality remains intact

## Technical Analysis

### Current State
- Basic dashboard exists at `/app/(dashboard)/dashboard/page.tsx`
- Dashboard currently redirects users in ONBOARDING status to `/chat?agent=OnboardingAgent`
- Journey tracking system uses phases: ONBOARDING → ASSESSMENT → DEBRIEF → CONTINUOUS_ENGAGEMENT
- Onboarding completion triggers `journeyTracker.completeOnboarding()` which sets phase to ASSESSMENT

### Design Components Needed
From the mockup, we need:
- **Sidebar Navigation**: Team Dashboard, Craft Messages, Learning Pathways, Settings
- **Header**: Search bar with "Ask Oskar", credits display, user avatar dropdown
- **Main Content**: Team visualization with manager profile and team member placeholders
- **CTA Section**: "Complete Your First Profile" prompt for TMP assessment

### Icons Required
- Bell (notifications)
- Users (team dashboard)
- Pencil (craft messages)
- Book (learning pathways)
- Settings
- Focus
- Plus (add team members)
- Coins (credits)
- ChevronDown (dropdown)
- Oscar1 (already exists in `/app/chat/components/icons/Oscar1.tsx`)

## Implementation Strategy

### Phase 1: Icon Setup
- Use Lucide React icons where available (project already uses lucide-react)
- Import Oscar1 from existing location
- Create any custom icons if needed

### Phase 2: Layout Structure
1. Replace current dashboard content with new design
2. Implement responsive grid layout
3. Add sidebar navigation component
4. Create header with search and user menu
5. Build team visualization area

### Phase 3: Data Integration
1. Fetch user's onboarding data to display name
2. Check journey phase to confirm Assessment status
3. Prepare for future team member data
4. Mock credits system (5000 credits as shown)

### Phase 4: Navigation & Routing
1. Wire up sidebar links (some may be placeholder routes)
2. Implement "Complete Your First Profile" to route to assessment
3. Ensure proper redirect logic for different journey phases

### Phase 5: Testing
1. Manual testing with Puppeteer for UI verification
2. Test onboarding → dashboard flow
3. Unit tests for journey transition
4. Integration tests for data fetching

## Key Considerations

1. **Journey Phase Handling**: 
   - Users in ONBOARDING phase should still redirect to chat
   - Users in ASSESSMENT phase should see the dashboard
   - Admin users should still redirect to /admin

2. **Data Availability**:
   - User name from Clerk/database
   - Onboarding data from user.onboardingData
   - Team structure (future enhancement)
   - Credits system (needs clarification - mock for now)

3. **Component Reusability**:
   - Create reusable sidebar component
   - Modular team member cards
   - Consistent button styles with existing UI

4. **Future Enhancements**:
   - Actual team member data integration
   - Real credits/points system
   - Analytics and reports tabs functionality
   - Working search with "Ask Oskar" AI assistant

## Success Criteria

1. ✅ Dashboard renders with new design matching mockup
2. ✅ Users completing onboarding land on dashboard
3. ✅ Journey status shows as Assessment phase
4. ✅ User's name displayed from onboarding data
5. ✅ CTA button routes to assessment flow
6. ✅ No regression in existing functionality
7. ✅ All tests pass
8. ✅ PR created with comprehensive documentation

## References

- Issue #98: Onboarding enhancements with "Go to Dashboard" button
- Issue #30: Onboarding agent implementation details
- Issue #54: LangGraph flow system with journey tracking
- Journey phases: `/lib/orchestrator/journey-phases.ts`
- Journey tracker: `/lib/orchestrator/journey-tracker.ts`
- Design mockup: `/Users/rowanmccann/Documents/Development/teamOS-figma-designs/src/app/dashboard-1/page.tsx`