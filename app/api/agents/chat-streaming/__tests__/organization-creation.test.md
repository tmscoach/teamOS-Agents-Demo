# Organization Creation Tests

## High-Level Test Cases for Multi-Tenancy Implementation

### 1. Organization Creation on Onboarding Completion

**Test: Manager completes onboarding with organization name**
- Given: A new manager signs up and goes through onboarding
- When: They provide all required fields including organization name
- Then:
  - Organization is created in Clerk with the provided name
  - Manager is added as org:admin
  - Database is updated with organizationId and organizationRole
  - Journey phase transitions to ASSESSMENT

**Test: Manager completes onboarding without organization name**
- Given: A new manager signs up and goes through onboarding
- When: They complete onboarding but organization field is empty
- Then:
  - No organization is created in Clerk
  - Journey phase still transitions to ASSESSMENT
  - User can create organization later

### 2. Organization Membership via Webhook

**Test: User signs up with existing organization invitation**
- Given: An organization exists in Clerk
- When: A new user signs up via organization invitation
- Then:
  - Webhook captures organization membership
  - User is created with correct organizationId and role
  - User is associated with the organization's teams

**Test: First user in organization becomes manager**
- Given: A new organization is created
- When: The first user joins the organization
- Then:
  - User role is set to MANAGER
  - User has org:admin role in Clerk

### 3. Data Isolation

**Test: Organization-scoped data access**
- Given: Multiple organizations exist with their own data
- When: A user from Organization A queries data
- Then:
  - Only sees teams from Organization A
  - Only sees conversations from Organization A
  - Cannot access data from Organization B

**Test: Super admin global access**
- Given: User with email rowan@teammanagementsystems.com
- When: They access the system
- Then:
  - Can see data from all organizations
  - Has isSuperAdmin flag set to true
  - No organization filtering applied

### 4. Team Creation with Organization

**Test: Manager creates team**
- Given: A manager with organizationId set
- When: They create a new team
- Then:
  - Team is created with the manager's organizationId
  - Team is only visible to users in the same organization

### 5. Edge Cases

**Test: Organization name conflicts**
- Given: Organization "Acme Corp" already exists
- When: Another user tries to create "Acme Corp"
- Then:
  - Clerk handles the conflict (may append numbers)
  - Both organizations remain separate
  - Users are isolated to their respective organizations

**Test: User without organization**
- Given: A user exists without organizationId (legacy data)
- When: They access the system
- Then:
  - They can still use the system
  - Their data is not organization-scoped
  - They can optionally create/join an organization later

## Integration Test Flow

1. **Full onboarding flow**
   - Sign up as manager1@example.com
   - Complete onboarding with organization "Test Corp"
   - Verify organization created in Clerk
   - Verify database updated
   - Verify journey phase is ASSESSMENT

2. **Team member invitation flow**
   - Manager invites member1@example.com
   - Member signs up via invitation link
   - Verify member has correct organization
   - Verify member role is TEAM_MEMBER
   - Verify data isolation works

3. **Multi-organization test**
   - Create Organization A with manager A
   - Create Organization B with manager B
   - Create teams in each organization
   - Verify complete data isolation
   - Verify super admin can see all data