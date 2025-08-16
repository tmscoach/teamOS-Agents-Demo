# Multi-Tenancy Implementation Test Plan

## Manual Testing Checklist

### 1. Database Migration
- [ ] Run `npx prisma generate` to generate updated Prisma client
- [ ] Create migration script to add organizationId fields
- [ ] Test migration on a development database

### 2. User Signup & Organization Creation
- [ ] Enable Organizations in Clerk Dashboard
- [ ] Sign up as a new manager
- [ ] Verify user is created with organizationId in database
- [ ] Verify user has org:admin role in Clerk
- [ ] Verify first user in org gets MANAGER role

### 3. Team Creation
- [ ] Create a team as a manager
- [ ] Verify team is created with correct organizationId
- [ ] Verify team is associated with the manager's organization

### 4. Data Isolation
- [ ] Create conversations as a manager
- [ ] Verify conversations have organizationId
- [ ] Create a second organization with different manager
- [ ] Verify managers can only see their org's data
- [ ] Verify team members can only see their team's data

### 5. Super Admin Access
- [ ] Login as super admin (TEST_ADMIN_EMAIL)
- [ ] Verify super admin can see all organizations' data
- [ ] Verify admin screens at /admin/* still work
- [ ] Verify agent configuration remains global

### 6. Team Member Invitations
- [ ] Manager invites team member to organization
- [ ] Team member signs up via invitation
- [ ] Verify team member gets org:member role
- [ ] Verify team member has correct organizationId
- [ ] Verify team member role is TEAM_MEMBER

### 7. API Endpoints
- [ ] Test /api/agents/chat creates conversations with organizationId
- [ ] Test /api/agents/chat/recent filters by organization
- [ ] Test conversation queries respect organization boundaries
- [ ] Test team queries respect organization boundaries

### 8. Existing Functionality
- [ ] Onboarding flow still works
- [ ] Chat interface functions correctly
- [ ] Agent interactions work as expected
- [ ] Admin can still configure agents globally

## Automated Test Requirements

### 1. Unit Tests Needed
- `getRoleAssignment` with organization context
- `getOrganizationContext` utility
- `buildOrganizationWhere` utility
- `canAccessResource` permission checks

### 2. Integration Tests Needed
- Clerk webhook with organization data
- ConversationStore with organization filtering
- API routes with organization context
- Team creation with organization association

### 3. E2E Tests Needed
- Manager signup creates organization
- Team member invitation flow
- Data isolation between organizations
- Super admin global access

## Performance Testing
- Query performance with organization indexes
- Large dataset filtering by organization
- Multiple organization switching

## Security Testing
- Verify no cross-organization data access
- Test organization boundary enforcement
- Validate all queries include org filtering
- Ensure super admin bypass works correctly