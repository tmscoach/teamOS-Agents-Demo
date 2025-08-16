# Issue #44: Fix /admin errors

GitHub Issue: https://github.com/teamOS-Agents-Demo/issues/44

## Problem Summary
The admin pages (`/admin/guardrails` and `/admin/variables`) are failing with "Module not found" errors because the import paths for services are incorrect.

### Error Details:
- Import path used: `@/lib/services/guardrail-tracking`
- Import path used: `@/lib/services/variable-extraction`
- Actual location: `/src/lib/services/`
- tsconfig.json maps `@/*` to `./*`

## Root Cause
The services are located in `/src/lib/services/` but the imports are trying to resolve from `@/lib/services/`. Based on the tsconfig.json configuration, the correct import path should be `@/src/lib/services/`.

## Files to Fix
1. `/app/api/admin/guardrails/stats/route.ts` - Fix import for GuardrailTrackingService
2. `/app/api/admin/guardrails/route.ts` - Fix import for GuardrailTrackingService
3. `/app/api/admin/variables/stats/route.ts` - Fix import for VariableExtractionService
4. `/app/api/admin/variables/route.ts` - Fix import for VariableExtractionService
5. `/app/api/admin/agents/config/route.ts` - Fix import for AgentConfigurationService
6. `/app/api/admin/agents/config/test/route.ts` - Fix import for AgentConfigurationService

## Implementation Plan
1. Create a new branch: `fix/issue-44-admin-import-errors`
2. Update all incorrect import paths from `@/lib/services/` to `@/src/lib/services/`
3. Verify the fix by running the development server and accessing the admin pages
4. Run the test suite to ensure no regressions
5. Create a PR with the fixes

## Testing Plan
1. Start the development server
2. Navigate to `/admin/guardrails` - should load without errors
3. Navigate to `/admin/variables` - should load without errors
4. Navigate to `/admin/agents/config` - should load without errors
5. Verify all API endpoints are working correctly
6. Run the full test suite