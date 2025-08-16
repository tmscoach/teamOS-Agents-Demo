# Issue #126: DebriefAgent Enhancement Implementation Plan

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/126

## Overview
Enhance DebriefAgent with auto-detection of available reports, assessment-specific debrief flows, variable extraction, and journey tracker integration.

## Implementation Plan

### Phase 1: Foundation (Priority: High)

#### 1.1 Create Report Availability Detection
- **Option A**: Create new tool `check_available_reports`
- **Option B** (Preferred): Enhance existing `tms_get_dashboard_subscriptions` tool usage
- Filter for status "Completed"
- Cross-reference with `viewedDebriefs` to avoid re-debriefing

#### 1.2 Update DebriefAgent System Prompt
- Add proactive checking behavior on conversation start
- Include logic to offer debrief when reports are available
- Maintain backward compatibility for manual subscription ID entry

#### 1.3 Add Report Detection to OpenAIDebriefAgent
- Execute dashboard check on initialize or first message
- Store available reports in agent context
- Trigger appropriate flow based on assessment type

### Phase 2: Assessment-Specific Flows (Priority: High)

#### 2.1 Update Flow Configuration Structure
- Modify `simplified-agent-configs.ts` to support dynamic flows
- Add assessment type detection
- Create flow branching logic

#### 2.2 Implement TMP Debrief Flow (10 steps)
1. report_check - Check for available reports
2. tmp_report_load - Load TMP report and profile
3. tmp_profile_display - Display Major/Related roles and scores
4. tmp_objectives - Gather debrief objectives
5. tmp_highlights - Identify 3 highlights
6. tmp_communication - Communication suggestions
7. tmp_support - Support needs
8. tmp_summary - Summarize captured insights
9. debrief_complete - Mark debrief complete and update journey

#### 2.3 Implement QO2 Debrief Flow
- Focus on organizational culture
- Extract: $CULTURE_TYPE, $ALIGNMENT_GAPS, $ACTION_ITEMS

#### 2.4 Implement Team Signals Debrief Flow
- Review team health metrics
- Extract: $TEAM_STRENGTHS, $IMPROVEMENT_AREAS, $PRIORITY_ACTIONS

### Phase 3: Variable Extraction (Priority: Medium)

#### 3.1 Enhance Extraction Rules
- Add TMP-specific patterns for objectives, highlights, communication, support
- Add QO2-specific patterns for culture insights
- Add Team Signals patterns for team metrics

#### 3.2 Test Variable Extraction
- Create test conversations for each assessment type
- Verify extraction accuracy
- Handle edge cases

### Phase 4: Journey Integration (Priority: Medium)

#### 4.1 Add Journey Tracker Calls
- Import JourneyTracker in DebriefAgent
- Call `markDebriefViewed()` on completion
- Update journey phase when all debriefs complete

#### 4.2 Track Debrief Progress
- Store extracted variables in debrief metadata
- Update user's viewedDebriefs record
- Check for phase transition eligibility

### Phase 5: Testing & Refinement (Priority: High)

#### 5.1 Unit Tests
- Test report availability detection
- Test flow selection logic
- Test variable extraction
- Test journey updates

#### 5.2 Integration Tests
- Full TMP debrief flow
- Full QO2 debrief flow
- Full Team Signals flow
- Journey phase transitions

#### 5.3 Manual Testing with Puppeteer
- Test UI interactions
- Verify auto-detection works
- Test flow transitions
- Confirm variable capture

## Technical Decisions

### 1. Report Detection Approach
Use existing `tms_get_dashboard_subscriptions` rather than creating new tool:
- Already returns completion status
- Includes assessment type information
- Reduces API surface area

### 2. Flow Configuration Strategy
Extend existing flow config rather than complete rewrite:
- Add `assessmentType` field to flow states
- Use conditional transitions based on assessment type
- Maintain backward compatibility

### 3. Variable Storage
Store in existing conversation metadata:
- Use structured format for each assessment type
- Enable retrieval for later analysis
- Support reporting requirements

## Implementation Order

1. **Start with TMP flow** - Most documented, clear requirements
2. **Add report detection** - Foundation for all flows
3. **Implement variable extraction** - Critical for value delivery
4. **Add journey integration** - Complete the loop
5. **Extend to other assessments** - QO2, Team Signals

## Risk Mitigation

1. **Backward Compatibility**: Keep manual subscription ID flow working
2. **Graceful Degradation**: If auto-detection fails, fall back to manual
3. **Data Validation**: Verify report completeness before debrief
4. **Error Handling**: Clear messages if reports unavailable

## Success Metrics

1. Zero manual subscription ID entries needed
2. 100% of completed assessments trigger debrief offer
3. All required variables extracted correctly
4. Journey phase transitions work automatically
5. No regression in existing functionality

## Files to Modify

1. `/src/lib/agents/config/simplified-agent-configs.ts` - Flow configuration
2. `/src/lib/agents/implementations/openai-debrief-agent.ts` - Core implementation
3. `/src/lib/agents/implementations/debrief-agent.ts` - Base implementation
4. `/lib/orchestrator/journey-tracker.ts` - Journey integration
5. Various test files for comprehensive coverage

## Next Steps

1. Create feature branch: `feat/issue-126-debrief-agent-enhancement`
2. Start with Phase 1.2 - Update system prompt (quickest win)
3. Implement Phase 1.1 - Report detection
4. Test basic auto-detection before moving to flows