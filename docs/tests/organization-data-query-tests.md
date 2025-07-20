# Organization Data Query Tests

This document describes the high-level tests for the organization data query functionality implemented for issue #110.

## Feature Overview

Agents can now query organization-scoped data and provide natural language responses while respecting organization boundaries. The implementation includes:

1. **OrganizationDataService**: Centralized service for organization-scoped data access
2. **Data Query Tools**: Agent tools that wrap the data service
3. **Streaming Integration**: AI SDK integration with proper tool response handling

## Test Categories

### 1. Organization Data Service Tests

**Purpose**: Verify the core data access service respects organization boundaries and role permissions.

#### Test Cases:

1. **Organization Overview Access**
   - ✅ Managers can see all organization teams and members
   - ✅ Team members see only their assigned teams
   - ✅ Error thrown when no organization context exists
   - ✅ Correct aggregation of team counts, member counts, and assessment progress

2. **Team List Access**
   - ✅ Managers retrieve all teams in their organization
   - ✅ Team members retrieve only accessible teams
   - ✅ Team details include manager name and member count
   - ✅ Teams from other organizations are excluded

3. **Assessment Status Queries**
   - ✅ Assessment counts grouped by type (TMP, QO2, WOW, LLP)
   - ✅ Assessment counts grouped by team
   - ✅ Filtering by specific assessment type
   - ✅ Filtering by specific team
   - ✅ Correct status aggregation (completed, in-progress, not-started)

4. **User Journey Progress**
   - ✅ Managers can query any user in their organization
   - ✅ Team members can only query themselves
   - ✅ Returns null for inaccessible users
   - ✅ Includes current phase, completed steps, and next actions

5. **Member List Access**
   - ✅ Managers see all organization members
   - ✅ Team members see only teammates
   - ✅ Member details include assessment status
   - ✅ Activity tracking (last active date)

### 2. Agent Tool Integration Tests

**Purpose**: Verify tools properly format responses for natural language presentation.

#### Test Cases:

1. **Tool Response Formatting**
   - ✅ `get_organization_overview` returns natural language summary
   - ✅ Singular vs plural formatting (1 team vs 2 teams)
   - ✅ Percentage calculations for completion rates
   - ✅ Metadata includes source and access level

2. **Error Handling**
   - ✅ Missing organization context returns appropriate error
   - ✅ Service errors are caught and returned gracefully
   - ✅ Tools never throw uncaught exceptions

3. **Data Transformation**
   - ✅ Raw data preserved in `output.raw`
   - ✅ Summary data in `output.summary`
   - ✅ Natural language in `output.naturalLanguage`

### 3. Streaming Integration Tests

**Purpose**: Verify the AI SDK properly handles tool calls and generates responses.

#### Test Cases:

1. **Tool Execution Flow**
   - ✅ Tools are available in the streaming context
   - ✅ Tool calls are executed with proper context
   - ✅ Tool results are returned to the model
   - ✅ Model generates natural language response after tool use

2. **System Prompt Enhancement**
   - ✅ Tool usage instructions added when tools available
   - ✅ Critical instructions for conversational responses
   - ✅ Organization context passed to tools

3. **Fallback Behavior**
   - ✅ When model doesn't generate text, tool result used as fallback
   - ✅ Assistant message saved even without model text
   - ✅ Appropriate default messages for edge cases

4. **Multi-Step Processing**
   - ✅ First step: Tool execution
   - ✅ Second step: Text generation
   - ✅ Proper streaming of both steps to client

### 4. End-to-End Integration Tests

**Purpose**: Verify the complete flow from user question to response.

#### Test Scenarios:

1. **"How many teams in my organization?"**
   - User asks question
   - OrchestratorAgent receives message with organization context
   - `get_organization_overview` tool is called
   - Tool returns data (e.g., "1 team with 0 members")
   - Model generates conversational response
   - Response streamed to client UI

2. **"Show me assessment progress"**
   - User asks about assessments
   - `get_team_assessment_status` tool is called
   - Tool returns structured data
   - Model formats into readable summary
   - Includes breakdown by type and team

3. **"Who are my team members?"**
   - User asks about team members
   - `get_team_members` tool is called with team context
   - Tool respects access permissions
   - Returns member list with assessment status
   - Model presents in friendly format

## Security and Access Control Tests

### Organization Isolation
- ✅ Users can never access data from other organizations
- ✅ Organization ID is always validated
- ✅ Null organization ID handled gracefully

### Role-Based Access
- ✅ Managers have organization-wide access
- ✅ Team members have team-scoped access
- ✅ Role permissions enforced at service layer

## Performance Considerations

1. **Query Optimization**
   - Database queries use proper indexes
   - Aggregations done efficiently
   - No N+1 query problems

2. **Streaming Performance**
   - Tool execution doesn't block streaming
   - Responses start streaming immediately
   - Large result sets handled gracefully

## Manual Testing Checklist

1. [ ] Sign in as a manager with an organization
2. [ ] Ask "How many teams in my organization?"
3. [ ] Verify response includes team count
4. [ ] Ask "What's the assessment progress?"
5. [ ] Verify breakdown by assessment type
6. [ ] Sign in as a team member
7. [ ] Ask same questions
8. [ ] Verify limited scope to assigned teams
9. [ ] Test with user without organization
10. [ ] Verify appropriate error messages

## Known Limitations

1. **Invitation Status**: Currently returns placeholder as invitation system not yet implemented
2. **Historical Data**: No time-based filtering yet implemented
3. **Pagination**: Large result sets not paginated

## Future Enhancements

1. Add CRUD operations for agents to create/update data
2. Add time-based filtering for historical queries
3. Add pagination for large result sets
4. Implement real invitation tracking
5. Add caching for frequently accessed data