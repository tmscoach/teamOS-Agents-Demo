# PR: Enable Agents to Query Organization-Scoped Data (#110)

## Summary

This PR implements the ability for agents to query organization-scoped data and provide natural language responses about team status, assessments, invitations, and more. The implementation respects organization boundaries and role-based access control.

## Changes Made

### 1. Core Services

**OrganizationDataService** (`src/lib/agents/services/organization-data-service.ts`)
- Centralized service for all organization data queries
- Enforces role-based access (MANAGER vs TEAM_MEMBER)
- Methods for querying teams, assessments, members, and progress
- Respects organization boundaries

### 2. Agent Tools

**Data Query Tools** (`src/lib/agents/tools/data-query-tools.ts`)
- `get_organization_overview`: High-level organization summary
- `get_team_assessment_status`: Assessment progress by type/team
- `get_user_journey_progress`: Individual user progress tracking
- `get_team_members`: Member list with assessment status
- `get_invitation_status`: Placeholder for future invitation tracking

### 3. Agent Integration

- Updated `AgentContext` type to include organization fields
- Integrated data query tools into `OrchestratorAgent`
- Enhanced system prompts for proper tool usage

### 4. Streaming Fixes

**Fixed AI SDK streaming with tools** (`app/api/agents/chat-streaming/route.ts`)
- Added `maxSteps` and `experimental_continueSteps` for multi-step processing
- Enhanced system prompt to ensure conversational responses after tool use
- Added fallback logic when model doesn't generate text after tools
- Fixed JavaScript initialization order issue

### 5. Configuration Updates

- Updated OrchestratorAgent configuration with explicit tool usage instructions
- Created script for reloading agent configurations

## Testing

### Unit Tests Created
- `organization-data-service.test.ts`: Service-level access control tests
- `data-query-tools.test.ts`: Tool formatting and error handling tests
- `tool-streaming.test.ts`: Integration tests for streaming with tools

### Manual Testing Performed
1. ✅ Signed in as manager - queried organization data successfully
2. ✅ Verified team counts and assessment status
3. ✅ Confirmed natural language responses after tool use
4. ✅ Tested with multiple follow-up questions

## Technical Details

### Architecture Decision
Implemented a hybrid approach:
- Centralized `OrganizationDataService` for data access logic
- Distributed tools across agents for flexibility
- Shared organization context through `AgentContext`

### Key Fixes
1. **Streaming Issue**: AI SDK wasn't generating text after tool calls
   - Solution: Enhanced prompts + configuration to ensure follow-up responses
2. **Organization Context**: Context wasn't properly propagated
   - Solution: Added organization fields to AgentContext and conversation metadata

## Example Usage

**User**: "How many teams are in my organization?"

**Agent**: "I've checked your organization data. Your organization currently has 1 team, but it doesn't have any members yet. This is a great starting point! Would you like help inviting team members to join?"

## Breaking Changes
None - all changes are additive.

## Database Migrations
None required - uses existing schema.

## Dependencies
No new dependencies added.

## Performance Impact
- Queries are optimized with proper indexes
- No N+1 query issues
- Streaming performance maintained

## Security Considerations
- ✅ Organization isolation enforced at service layer
- ✅ Role-based access control implemented
- ✅ No data leakage between organizations

## Future Enhancements
1. Add CRUD operations for agents to modify data
2. Implement real invitation tracking (currently placeholder)
3. Add time-based filtering for historical queries
4. Add result pagination for large datasets

## Checklist
- [x] Code follows project conventions
- [x] Tests written and passing (where Jest config allows)
- [x] Manual testing completed
- [x] Documentation updated
- [x] No console errors or warnings
- [x] Respects organization boundaries
- [x] Natural language responses working

## Related Issues
Fixes #110