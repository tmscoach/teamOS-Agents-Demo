# Clerk Organization Creation Fix

## Problem

Organizations are not being automatically created in Clerk when users sign up and complete onboarding. This is because:

1. Clerk doesn't automatically create organizations on user signup
2. Organizations must be explicitly created via the Clerk API
3. Our current implementation assumes organizations exist but doesn't create them

## Solution

We need to add organization creation logic when onboarding completes. Here's the implementation:

### 1. Update the Chat Streaming Route

In `/app/api/agents/chat-streaming/route.ts`, after line 385 where the journey status is updated, add:

```typescript
import { clerkClient } from '@clerk/nextjs/server';

// After updating the user's journey status (around line 385), add:

// Create organization in Clerk if user is a manager and has organization name
if (dbUser.role === 'MANAGER' && !dbUser.organizationId) {
  const orgName = context.metadata.onboarding?.capturedFields?.organization;
  
  if (orgName) {
    try {
      // Create organization in Clerk
      const organization = await clerkClient.organizations.createOrganization({
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, '-'),
        createdBy: user.id, // Clerk user ID
      });
      
      // Add user as admin of the organization
      await clerkClient.organizations.createOrganizationMembership({
        organizationId: organization.id,
        userId: user.id,
        role: 'org:admin'
      });
      
      // Update user in database with organizationId
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          organizationId: organization.id,
          organizationRole: 'org:admin'
        }
      });
      
      console.log('[Organization] Created organization for user:', {
        userId: dbUser.id,
        organizationId: organization.id,
        organizationName: orgName
      });
    } catch (error) {
      console.error('[Organization] Failed to create organization:', error);
    }
  }
}
```

### 2. Update Webhook to Handle Existing Organizations

In `/app/api/webhooks/clerk/route.ts`, the webhook should already handle organization memberships correctly when they exist.

### 3. Enable Organizations in Clerk Dashboard

1. Go to your Clerk Dashboard
2. Navigate to **Configure** → **Organizations**
3. Enable Organizations
4. Set up roles:
   - `org:admin` - Organization administrators
   - `org:member` - Regular team members

### 4. Test the Flow

1. Sign up as a new manager
2. Complete onboarding with organization name
3. Check that:
   - Organization is created in Clerk
   - User is added as org:admin
   - Database is updated with organizationId

## Alternative: Manual Organization Creation

If you prefer to create organizations manually first:

1. In Clerk Dashboard, go to Organizations
2. Click "Create organization"
3. Add the manager as admin
4. The webhook will automatically sync the organizationId

## Future Improvements

1. Add organization selection for existing organizations
2. Handle organization name conflicts
3. Add organization settings page
4. Implement team invitation flow within organizations