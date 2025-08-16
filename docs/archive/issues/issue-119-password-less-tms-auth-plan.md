# Issue #119: Password-less TMS User Creation Implementation Plan

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/119

## Overview

Implement password-less user creation in TMS Global to integrate with Clerk authentication. Since Clerk handles all authentication, TMS should trust Clerk's auth and issue JWT tokens without requiring separate passwords.

## Current State Analysis

### Existing Authentication Flow
1. **tms_create_org**: Creates organization + facilitator with password
2. **tms_facilitator_login**: Password-based login for facilitators
3. **respondent login**: Password-based login at `/Authenticate`
4. **MockUser**: Requires password field

### Key Files to Modify
- `/src/lib/mock-tms-api/mock-data-store.ts` - User interface and storage
- `/src/lib/mock-tms-api/endpoints/auth.ts` - Authentication endpoints
- `/src/lib/agents/tools/tms-tool-registry.ts` - Tool definitions
- `/src/lib/mock-tms-api/types.ts` - Type definitions

## Implementation Plan

### Phase 1: Update Data Models

1. **MockUser Interface Updates**
   ```typescript
   interface MockUser {
     id: string;
     email: string;
     password?: string;  // Make optional
     clerkUserId?: string;  // New field
     firstName: string;
     lastName: string;
     userType: 'Facilitator' | 'Respondent';
     organizationId: string;
     token?: string;
     respondentName?: string;  // For respondents
   }
   ```

2. **MockDataStore Updates**
   - Add `getUserByClerkId(clerkUserId: string)` method
   - Add `clerkIdToUser: Map<string, string>` for quick lookups
   - Modify `createUser()` to accept optional password

### Phase 2: Create New Endpoints

1. **POST /api/v1/auth/create-respondent**
   - Accept clerkUserId, email, names, organizationId
   - Create user without password
   - Return JWT token

2. **POST /api/v1/auth/create-facilitator**
   - Similar to respondent but with facilitator role
   - Used when adding facilitators to existing orgs

3. **POST /api/v1/auth/token-exchange**
   - Exchange Clerk user ID for TMS JWT
   - For existing users who need new tokens

### Phase 3: Update Existing Endpoints

1. **Update tms_create_org**
   - Add optional `clerkUserId` parameter
   - Make `password` optional
   - If clerkUserId provided, use password-less flow
   - Maintain backward compatibility

2. **Update JWT Claims**
   - Add `clerkUserId` to JWT claims
   - Use for future token validation

### Phase 4: Create New TMS Tools

1. **tms_create_respondent**
   - Tool definition for creating respondents
   - Maps to new endpoint

2. **tms_create_facilitator**  
   - Tool definition for creating facilitators
   - Maps to new endpoint

3. **tms_token_exchange**
   - Get new JWT for existing Clerk users

### Phase 5: Security Implementation

1. **System Authentication**
   - Add `X-API-Key` header validation for create-user endpoints
   - Use environment variable for API key
   - Prevent unauthorized user creation

2. **Audit Trail**
   - Log user creation source (Clerk vs password)
   - Track which system created users

## Testing Strategy

1. **Unit Tests**
   - Test new MockDataStore methods
   - Test password-less user creation
   - Test backward compatibility

2. **Integration Tests**
   - Test full flow: Clerk ID → TMS user → JWT
   - Test tool execution with new endpoints
   - Test mixed mode (some users with passwords, some without)

3. **E2E Tests**
   - Test agent onboarding with Clerk auth
   - Test subscription assignment to Clerk users

## Migration Considerations

1. **Existing Users**
   - Add migration tool to link existing users to Clerk IDs
   - Optional - can be done gradually

2. **Backward Compatibility**
   - Keep password-based flows working
   - Allow both auth methods during transition

## Security Considerations

1. **API Key Protection**
   - Store in environment variables
   - Rotate regularly
   - Different keys for dev/staging/prod

2. **Clerk ID Validation**
   - Option to validate with Clerk API
   - Cache validations for performance

3. **Rate Limiting**
   - Limit user creation requests
   - Prevent abuse

## Success Criteria

1. Can create TMS users without passwords
2. JWT tokens work for all TMS operations
3. Backward compatibility maintained
4. All tests passing
5. Security measures in place