# Multi-Tenancy Implementation Plan - Issue #109

Issue Link: https://github.com/tmscoach/teamOS-Agents-Demo/issues/109

## Overview

Implement minimum viable multi-tenancy using Clerk Organizations to provide proper data isolation between different companies while maintaining existing functionality.

## Current State Analysis

### Authentication & Authorization
- Email-based role assignment (hardcoded domains)
- Three roles: ADMIN, MANAGER, TEAM_MEMBER
- Super admin: rowan@teammanagementsystems.com
- Test manager domain: @bythelight.band (to be removed)

### Data Model
- No organization concept
- Users linked to teams via teamId
- Teams have a single manager
- Conversations scoped by teamId and managerId
- No multi-tenancy boundaries

### Clerk Integration
- Basic user sync via webhooks
- No organization support enabled
- Simple role assignment on user creation

## Implementation Steps

### Step 1: Database Schema Updates

1. **Add organizationId fields** (nullable for backward compatibility):
   ```prisma
   model User {
     // ... existing fields
     organizationId    String?
     organizationRole  String?  // Store Clerk org role
   }

   model Team {
     // ... existing fields
     organizationId    String?
   }

   model Conversation {
     // ... existing fields
     organizationId    String?
   }
   ```

2. **Create and run migration**

### Step 2: Clerk Organization Setup

1. **Enable Organizations in Clerk Dashboard**
   - Configure organization roles: org:admin, org:member
   - Enable organization creation on signup
   - Configure invitation flow

2. **Update ClerkProvider in app/layout.tsx**
   - Add organization support
   - Include organization switcher UI

### Step 3: Update Authentication Flow

1. **Enhance Webhook Handler** (app/api/webhooks/clerk/route.ts):
   - Handle organization membership events
   - Extract organizationId and role from Clerk data
   - Update user creation to include organization context

2. **Update Role Assignment** (src/lib/auth/role-assignment.ts):
   - Remove @bythelight.band hardcoding
   - Check Clerk organization role for MANAGER vs TEAM_MEMBER
   - Keep super admin check intact

### Step 4: Update Data Access Patterns

1. **Create Organization Context Utilities**:
   ```typescript
   // src/lib/auth/organization.ts
   export async function getOrganizationContext(userId: string) {
     // Get user's organizationId
     // Check if super admin
     // Return context for queries
   }
   ```

2. **Update Core Services**:
   - ConversationStore: Add organization filtering
   - User services: Include organizationId
   - Team services: Scope by organization

3. **Pattern for All Queries**:
   ```typescript
   const { organizationId, isSuperAdmin } = await getOrganizationContext(userId);
   
   const data = await prisma.model.findMany({
     where: {
       ...(isSuperAdmin ? {} : { organizationId }),
       // other filters
     }
   });
   ```

### Step 5: Update API Routes

Priority routes to update:
1. `/api/agents/*` - Add organization context
2. `/api/user/*` - Include organization filtering  
3. `/api/conversations/*` - Scope to organization
4. `/api/teams/*` - Organization-level management

### Step 6: Preserve Existing Functionality

1. **Admin Routes**: Keep /admin/* routes working for super admin
2. **Onboarding Flow**: Ensure it captures organization context
3. **Agent Configuration**: Remains global (no org-specific configs)

## Testing Plan

### Unit Tests
- Organization context utilities
- Role assignment with organizations
- Data filtering logic

### Integration Tests
- Webhook handling with organization events
- API routes with organization context
- Data isolation between organizations

### E2E Tests
- Manager signup creates organization
- Team member invitation flow
- Super admin global access
- Organization data isolation

## Rollback Plan

1. All changes are additive (nullable fields)
2. Feature flag for organization features
3. Keep existing role assignment as fallback
4. Database rollback script prepared

## Success Criteria

- [x] Database schema supports organizations
- [x] Clerk organizations integrated
- [x] Data properly isolated by organization
- [x] Super admin retains global access
- [x] Existing flows continue working
- [x] No regression in current functionality

## Out of Scope

- Organization-specific agent configurations
- Billing/subscription management
- Organization settings UI
- Multiple teams per organization UI
- Organization switching UI

## Notes

- Start with nullable fields for gradual migration
- Test thoroughly with multiple organizations
- Document organization setup process
- Monitor performance with organization filtering