# Issue #57: Update Sign-In Page Robots Meta Tag

**Issue Link**: https://github.com/[repo]/issues/57

## Problem Summary
The sign-in page needs a robots meta tag with "noindex, follow" directive to prevent search engines from indexing the authentication page while still allowing them to follow links.

## Current Situation
- Sign-in page is located at `/app/sign-in/[[...sign-in]]/page.tsx`
- It's a client component (`"use client"`) which cannot export metadata directly
- No existing robots meta tags or SEO configurations in the project
- The root layout has basic metadata but no robots directives

## Solution Approach
Since the sign-in page is a client component, I'll create a layout file specifically for the sign-in route that exports the required metadata including the robots meta tag.

## Implementation Plan
1. Create a new layout file at `/app/sign-in/layout.tsx` with metadata export
2. Add the robots meta tag with "noindex, follow" directive
3. Ensure the layout inherits from the root layout properly
4. Test that the meta tag appears correctly in the HTML head
5. Verify no conflicts with existing metadata

## Tasks Breakdown
1. **Create sign-in layout file** - Add layout.tsx with metadata configuration
2. **Implement robots meta tag** - Configure "noindex, follow" directive
3. **Test implementation** - Use Puppeteer to verify meta tag presence
4. **Run test suite** - Ensure no regressions
5. **Create PR** - Submit changes for review

## Technical Details
- Use Next.js 13+ app directory metadata API
- Metadata will be merged with parent layout metadata
- The robots directive will only apply to sign-in pages