# Issue #110: Enable Agents to Query Organization-Scoped Data

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/110

## Overview

This implementation enables agents to query underlying database structures and provide natural language responses about team status, assessments, invitations, and other organizational data while respecting organization boundaries.

## Architecture Design

### Hybrid Approach
We're implementing a hybrid architecture that combines:
1. Centralized data service layer for consistency
2. Distributed tools across agents for contextual relevance
3. Optional specialized DataAssistant agent for complex operations

### System Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   UI Components     │     │   Agent Layer       │
│  (Future dual-mode) │     │  (Chat interface)   │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           ▼                           ▼
    ┌─────────────┐            ┌──────────────┐
    │   API       │            │ Agent Tools  │
    │  Routes     │            │ (Query/CRUD) │
    └──────┬──────┘            └──────┬───────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
         ┌────────────────────────────┐
         │ OrganizationDataService    │
         │ - Permission Checking      │
         │ - Audit Logging           │
         │ - Data Formatting         │
         └────────────┬───────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
 ┌──────────────┐          ┌──────────────────┐
 │   Local DB   │          │ TMS Global API   │
 │  (Supabase)  │          │ (Future via MCP) │
 └──────────────┘          └──────────────────┘
```

## Implementation Plan

### Phase 1: Core Data Service & Read-Only Tools (Week 1)

#### 1. OrganizationDataService (`src/lib/agents/services/organization-data-service.ts`)

```typescript
interface OrganizationDataService {
  // Organization Overview
  getOrganizationOverview(context: OrganizationContext): Promise<OrganizationOverview>
  
  // Team Management
  getTeamList(context: OrganizationContext): Promise<Team[]>
  getTeamDetails(context: OrganizationContext, teamId: string): Promise<TeamDetails>
  
  // Assessment Tracking
  getAssessmentStatus(context: OrganizationContext, options?: AssessmentOptions): Promise<AssessmentStatus>
  
  // Member Management
  getInvitationStatus(context: OrganizationContext, teamId?: string): Promise<InvitationStatus>
  getMemberList(context: OrganizationContext, teamId?: string): Promise<TeamMember[]>
  
  // Journey Tracking
  getUserJourneyProgress(context: OrganizationContext, userId?: string): Promise<JourneyProgress>
}
```

#### 2. Data Query Tools (`src/lib/agents/tools/data-query-tools.ts`)

Initial tools to implement:
- `get_organization_overview` - Basic stats and health metrics
- `get_team_assessment_status` - Assessment completion by team
- `get_invitation_status` - Pending invitations and acceptance rates
- `get_user_journey_progress` - Individual or team journey status

#### 3. Enhanced Agent Context

Update `AgentContext` interface:
```typescript
interface AgentContext {
  // Existing fields...
  
  // Organization context
  organizationId: string;
  organizationRole: string | null;
  userRole: 'ADMIN' | 'MANAGER' | 'TEAM_MEMBER';
  teamIds: string[];
  isSuperAdmin: boolean;
}
```

### Phase 2: Agent Integration (Week 1-2)

#### 1. Update Agents with Tools

**OrchestratorAgent** (Managers):
- All read tools
- Future: Team creation, member invitation

**AssessmentAgent**:
- Assessment status tools
- Future: Create/update assessments via TMS API

**ProgressMonitor**:
- All read tools for comprehensive reporting

#### 2. Natural Language Formatting

Tools return structured data, agents format naturally:
```typescript
// Tool returns:
{
  totalTeams: 3,
  totalMembers: 24,
  activeAssessments: 12,
  completionRate: 0.67
}

// Agent responds:
"You have 3 teams with a total of 24 members. Currently, 12 assessments 
are in progress with an overall completion rate of 67%."
```

### Phase 3: CRUD Operations (Week 2)

Add write capabilities:
- `create_team_member` - Add new team members
- `update_team_details` - Modify team information
- `send_invitation_reminder` - Re-send invitations

### Phase 4: Complex Operations & DataAssistant (Week 3)

Create specialized agent for:
- Bulk imports
- Cross-team analytics
- Complex reports
- Data migrations

## Security Considerations

### 1. Role-Based Access Control

```typescript
class OrganizationDataService {
  private async validateAccess(
    context: OrganizationContext, 
    resource: Resource
  ): Promise<boolean> {
    // Super admin can access everything
    if (context.isSuperAdmin) return true;
    
    // Managers can access all teams in their org
    if (context.userRole === 'MANAGER') {
      return resource.organizationId === context.organizationId;
    }
    
    // Team members only access their team data
    if (context.userRole === 'TEAM_MEMBER') {
      return context.teamIds.includes(resource.teamId);
    }
    
    return false;
  }
}
```

### 2. Audit Logging

```typescript
interface AuditLog {
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  timestamp: Date;
  source: 'UI' | 'AGENT';
  metadata?: Record<string, any>;
}
```

## Testing Strategy

### 1. Unit Tests
- OrganizationDataService methods
- Individual tool functions
- Permission checking logic

### 2. Integration Tests
- Agent + Tool integration
- Organization boundary enforcement
- Role-based access scenarios

### 3. E2E Tests (Puppeteer)
- Manager queries organization data
- Team member limited access
- Natural language response quality

## Success Metrics

### Week 1 Deliverables
- [ ] OrganizationDataService with 3+ query methods
- [ ] 3+ working data query tools
- [ ] OrchestratorAgent using tools successfully
- [ ] Basic test coverage
- [ ] Organization isolation verified

### Week 2 Deliverables
- [ ] All read-only tools implemented
- [ ] 3+ agents integrated with tools
- [ ] CRUD operations for team management
- [ ] Comprehensive test suite

### Week 3 Deliverables
- [ ] DataAssistant agent (if needed)
- [ ] Complex query capabilities
- [ ] Performance optimization
- [ ] Production-ready code

## Future Considerations

### TMS Global API Integration
When TMS API becomes available:
1. Add TMSAPIService layer
2. Implement MCP tools for agents
3. Handle dual data sources (local + TMS)
4. Implement sync strategies

### UI/Agent Dual Mode
Both interfaces will use the same OrganizationDataService:
- UI calls via API routes
- Agents call via tools
- Consistent business logic
- Unified audit trail

## Technical Decisions

### 1. Return Type Consistency
All data service methods return typed interfaces for consistency.

### 2. Error Handling
- Graceful degradation when data unavailable
- User-friendly error messages
- Retry logic for transient failures

### 3. Caching Strategy
- Phase 1: No caching (keep simple)
- Phase 2: Add Redis for frequently accessed data
- Consider TTL based on data type

### 4. Natural Language Templates
Create consistent patterns for formatting data:
- Numbers: "You have X teams"
- Percentages: "67% complete"
- Lists: "Your teams are: A, B, and C"
- Empty states: "No assessments in progress"

## Open Questions

1. Should we implement pagination for large datasets immediately?
2. What's the preferred format for dates in natural language?
3. How detailed should the initial audit logs be?
4. Should we use a state machine for complex workflows?

## References

- Issue #109: Multi-tenancy implementation
- Existing organization context utilities
- Current agent architecture patterns
- TMS assessment types and workflows