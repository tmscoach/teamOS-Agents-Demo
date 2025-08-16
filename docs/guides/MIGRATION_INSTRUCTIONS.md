# Migration Instructions for Multi-Tenancy Support

## Issue

You're seeing database errors because the code expects `organizationId` columns that don't exist in the database yet.

## Solution

### Option 1: Apply Migration Manually (Recommended for Production)

1. **Backup your database first**

2. **Run the migration SQL**:
   ```bash
   # Connect to your database and run:
   psql $DATABASE_URL < prisma/migrations/20250119_add_organization_support/migration.sql
   ```

3. **Update Prisma client**:
   ```bash
   npx prisma generate
   ```

### Option 2: Use Prisma Migrate (For Development)

1. **Create a proper migration**:
   ```bash
   npx prisma migrate dev --name add_organization_support --create-only
   ```

2. **Review the generated migration** in `prisma/migrations/`

3. **Apply the migration**:
   ```bash
   npx prisma migrate deploy
   ```

### Option 3: Push Schema Directly (Development Only)

**⚠️ Warning: This may cause data loss in production**

```bash
npx prisma db push
```

## After Migration

1. **Enable Organizations in Clerk Dashboard**:
   - Go to your Clerk Dashboard
   - Navigate to Organizations settings
   - Enable the Organizations feature
   - Configure roles: `org:admin` and `org:member`

2. **Test the implementation**:
   - Sign up as a new user (they should become org:admin)
   - Check that users have `organizationId` in the database
   - Verify data isolation works correctly

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove indexes
DROP INDEX IF EXISTS "User_organizationId_idx";
DROP INDEX IF EXISTS "Team_organizationId_idx";
DROP INDEX IF EXISTS "Conversation_organizationId_idx";

-- Remove columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationRole";
ALTER TABLE "Team" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Conversation" DROP COLUMN IF EXISTS "organizationId";
```