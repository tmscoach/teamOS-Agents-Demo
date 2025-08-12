# Phase 2: Report Access Control Requirements

## Current State (Development Mode)
- Any authenticated user can view any report by navigating to `/reports/json/{subscriptionId}`
- Temporary user fallback allows testing without proper user records
- No role-based or ownership checks are enforced

## Production Requirements

### 1. User-Level Access
- **Individual Users**: Can only view their own reports
  - Check: `report.userId === currentUser.id`
  - Enforce in database query WHERE clause

### 2. Team-Level Access
- **Team Managers**: Can view reports for their direct team members
  - Check: User has MANAGER role AND shares organizationId with report owner
  - May need to add team/hierarchy relationships to User model

### 3. Organization-Level Access
- **Organization Admins**: Can view all reports within their organization
  - Check: User has ADMIN role AND `report.user.organizationId === currentUser.organizationId`
  - Full access to all reports in their org

### 4. System-Level Access
- **Super Admins**: Can view any report (for support/debugging)
  - Check: User has SUPER_ADMIN role
  - Should be logged/audited

## Implementation Checklist

### Database Schema Updates
- [ ] Add `userId` field to UserReport table (link to report owner)
- [ ] Add `organizationId` to UserReport for efficient org-level queries
- [ ] Consider adding `teamId` for team-based access control
- [ ] Add audit log table for tracking report access

### Code Changes Required

1. **`/app/(dashboard)/reports/json/[subscriptionId]/page.tsx`**
   - Remove development fallback (lines 40-103)
   - Update query at lines 111-128 to include access control:
   ```typescript
   const report = await prisma.userReport.findFirst({
     where: {
       subscriptionId,
       OR: [
         { userId: user.id }, // User owns the report
         { 
           user: { 
             organizationId: user.organizationId,
             // Additional role checks
           }
         }
       ]
     }
   })
   ```

2. **Access Control Service**
   - Create `/src/lib/services/access-control/report-access.service.ts`
   - Implement `canUserViewReport(userId, reportId)` method
   - Handle different role-based permissions

3. **API Routes**
   - Update `/app/api/reports/json/[subscriptionId]/route.ts` (if exists)
   - Add middleware for access control checks
   - Return 403 Forbidden for unauthorized access

### Security Considerations
1. **URL Guessing**: SubscriptionIds should not be sequential or predictable
2. **Audit Logging**: Track who views which reports and when
3. **Data Leakage**: Ensure error messages don't reveal report existence
4. **Rate Limiting**: Prevent enumeration attacks on report IDs

### Testing Requirements
1. Test user can view own reports
2. Test user cannot view others' reports
3. Test manager can view team reports
4. Test admin can view org reports
5. Test proper 403 responses for unauthorized access
6. Test audit logging functionality

## Migration Path
1. **Phase 1**: Add TODOs and documentation (COMPLETE)
2. **Phase 2**: Implement database schema changes
3. **Phase 3**: Add access control service
4. **Phase 4**: Update all report viewing endpoints
5. **Phase 5**: Remove development fallbacks
6. **Phase 6**: Deploy with feature flag for gradual rollout

## Notes
- Current implementation is intentionally permissive for development/testing
- Must be addressed before production deployment with real user data
- Consider implementing row-level security in Supabase for additional protection