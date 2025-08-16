# Issue #56: Fix CI Workflow Failures and Configure Notification Settings

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/56

## Problem Summary
The CI workflow is failing on pull requests due to linting and type checking errors, causing unnecessary GitHub email notifications. There are no pre-commit hooks to catch these issues before pushing.

## Current CI Failures (from PR #55)
- `@typescript-eslint/no-require-imports`: Test files using require()
- `@typescript-eslint/no-unused-vars`: Unused imports in admin pages
- `@typescript-eslint/no-explicit-any`: Several any types used
- `react/no-unescaped-entities`: Unescaped apostrophes in JSX
- `react-hooks/exhaustive-deps`: Missing dependencies in useEffect

## Implementation Plan

### Phase 1: Fix Immediate CI Failures
1. **Fix linting errors**
   - Convert require() to ES imports in test files
   - Remove unused imports from admin pages
   - Replace `any` types with proper TypeScript types
   - Escape apostrophes in JSX or use curly braces
   - Add missing dependencies to useEffect hooks

2. **Run comprehensive checks**
   - `npm run lint` and fix all errors
   - `npm run type-check` and fix all TypeScript errors
   - `npm run format:check` and fix formatting issues

### Phase 2: Add Pre-commit Hooks
1. **Install dependencies**
   - Install husky for git hooks
   - Install lint-staged for running checks on staged files

2. **Configure husky**
   - Initialize husky
   - Add pre-commit hook

3. **Configure lint-staged**
   - Run ESLint on TypeScript/JavaScript files
   - Run Prettier on all files
   - Run type-check on TypeScript files

### Phase 3: Documentation
1. **Create notification settings guide**
   - Add section to README about GitHub notifications
   - Document recommended watch settings
   - Provide email filtering instructions

### Phase 4: CI Optimizations
1. **Optimize workflow**
   - Run lint and type-check in parallel
   - Improve dependency caching
   - Consider running checks only on changed files

## Commits Strategy
1. Fix all linting errors (commit after each category of fixes)
2. Set up pre-commit hooks
3. Add documentation
4. Optimize CI workflow

## Testing Plan
- Verify all lint/type errors are fixed
- Test pre-commit hooks work correctly
- Ensure CI passes on the PR
- Verify documentation is clear and helpful