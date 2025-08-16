# Issue 183: Clean up and reorganize project documentation and non-code files

**GitHub Issue:** https://github.com/tmscoach/teamOS-Agents-Demo/issues/183

## Problem Summary
The project has accumulated significant clutter with:
- 83 items in the root directory
- Multiple overlapping documentation folders (`.documentation/`, `docs/`, root `.md` files)
- 60+ issue planning documents in `scratchpads/`
- 17 test/debug files scattered in root
- Configuration files mixed with project files in root
- Duplicate or redundant documentation across folders

## Implementation Plan

### Phase 1: Create New Directory Structure
Create the following new directories:
- `docs/guides/` - For user guides and how-tos
- `docs/setup/` - For setup and configuration documentation
- `docs/archive/issues/` - For historical issue planning documents
- `scripts/test/` - For test scripts and utilities
- `scripts/db/` - For database migration and setup scripts
- `config/` - For JavaScript configuration files

### Phase 2: Move Documentation Files
**Root → docs/guides/**
- DEBUGGING-GUIDE.md
- TESTING_GUIDE.md
- KNOWLEDGE_BASE_SEARCH_TIPS.md
- MIGRATION_INSTRUCTIONS.md
- STREAMING_IMPLEMENTATION.md

**Root → docs/setup/**
- CLERK_ORGANIZATION_FIX.md

**Existing docs/ files → docs/setup/**
- docs/CLERK_MAGIC_LINK_SETUP.md
- docs/CLERK_SIGNUP_CONFIGURATION.md
- docs/DATABASE_CONNECTION.md
- docs/DEPLOYMENT_CONFIGURATION.md
- docs/SETUP.md

### Phase 3: Archive Scratchpads
**scratchpads/ → docs/archive/issues/**
Move all 60+ issue planning documents:
- issue-*.md files
- Other planning documents (assessment-test-guide.md, bulk-answer-plan.md, etc.)
- Keep scratchpads/ directory but add .gitkeep with note about temporary work

### Phase 4: Move Test Files
**Root → scripts/test/**
- test-assessment-actions.html
- test-assessment-flow.sh
- test-assessment-tools.js
- test-bulk-command-fix.js
- test-unified-assessment.html
- debug-assessment.js
- check-browser-console.js
- check-extraction-rules.ts

### Phase 5: Move Database Scripts
**Root → scripts/db/**
- add_journey_fields.sql
- update_admin.sql

### Phase 6: Move Configuration Files
**Root → config/**
- jest.config.js
- postcss.config.js
- tailwind.config.js (keep a copy as tailwind.config.ts remains in root for Next.js)

### Phase 7: Clean Up Root Documentation
**Files to keep in root:**
- README.md (main project documentation)
- CLAUDE.md (AI assistant instructions)
- package.json, package-lock.json (npm requirements)
- tsconfig.json (TypeScript config)
- next.config.ts, next-env.d.ts (Next.js requirements)
- middleware.ts (Next.js requirement)
- vercel.json (deployment config)
- components.json (shadcn/ui config)
- tailwind.config.ts (required by Next.js)

**Files to move/remove:**
- orchestrator-system-prompt.md → docs/archive/
- phase-1-completion-summary.md → docs/archive/
- phase-1-test-checklist.md → docs/archive/
- test-json-report-processing.md → docs/archive/
- test-onboarding-flow.md → docs/archive/
- github-issue-voice-problems.md → docs/archive/issues/
- test-results.log → Remove (generated file)
- commit-changes.sh → scripts/
- convert_pdfs.sh → scripts/
- save-orchestrator-config.js → scripts/
- view-pr.sh → scripts/

### Phase 8: Update References
1. **Update components.json** if config files move:
   - Currently references `tailwind.config.ts` (keep in root)

2. **Update package.json scripts** if needed:
   - Jest should auto-detect jest.config.js in config/ folder
   - Or update test scripts to use `--config config/jest.config.js`

3. **Update CLAUDE.md** to reflect new structure:
   - Update project structure section
   - Update file location references

4. **Update .gitignore** if needed:
   - Add `/scratchpads/*` with `!/scratchpads/.gitkeep`

### Phase 9: Verification
1. Run test suite to ensure nothing broke
2. Verify build process still works
3. Check that all imports still resolve correctly
4. Ensure documentation links are updated

## Testing Plan
1. **Before changes:** Run full test suite and save results
2. **After each phase:** 
   - Run affected tests
   - Verify build still works
3. **Final verification:**
   - Full test suite
   - Build production bundle
   - Check all documentation links
   - Verify no broken imports

## Rollback Plan
Since this is primarily file movement:
1. All changes will be in a single branch
2. Can easily revert if issues arise
3. No database or API changes involved

## Expected Outcome
- Root directory reduced from 83 to ~15 essential files
- Clear separation of concerns:
  - `.documentation/` - TMS IP (protected)
  - `docs/` - Project documentation (public)
  - `scripts/` - All utility scripts
  - `config/` - JavaScript configs
- Better discoverability and maintainability
- Historical documents preserved but archived

## Notes
- This is a non-breaking change (no functionality changes)
- Primarily affects developer experience
- Should be done in a single PR to avoid confusion
- Consider adding a CHANGELOG.md entry for this reorganization