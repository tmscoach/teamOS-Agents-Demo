# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TMS (Team Management Systems) transformation platform that analyzes 40+ years of intellectual property to design an intelligent team transformation system. The system uses a multi-agent architecture to autonomously manage the entire team transformation process.

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS, Shadcn UI, Lucide Icons, Sonner Toast
- **Backend**: Prisma, Supabase, Vercel, Stripe, Clerk Auth
- **Development**: Node.js, TypeScript

## Project Structure

- `/.documentation/` - Contains TMS IP documents and project overview
  - Accreditation Handbooks (HET framework, TMP, QO2, WoWV, LLP)
  - Questionnaire Content (Team Signals, TMP, QO2, WoW, LLP)
  - Finished Report Examples
  - Research Manuals
- `/scratchpads/` - Temporary working files (gitignored)
- `/marker-env/` - Python virtual environment for PDF processing (gitignored)

## Development Commands

Since this is a new project, the following commands will need to be set up:

```bash
# Initialize Next.js project (if not done)
npx create-next-app@latest . --typescript --tailwind --app

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

## Key Implementation Notes

1. **Multi-Agent System Design**: The agent architecture should emerge from analysis of TMS IP documents. Don't impose predetermined structures.

2. **Data Integrity**: All mock data must be extracted directly from IP documents. Never invent data.

3. **IP Traceability**: Every system decision must be traceable to source IP documents.

4. **Communication Simulation**: Phase 1 logs all communications; Phase 2 implements actual sending via cron jobs.

5. **Authentication**: Uses Clerk Auth for user management.

6. **Database**: Supabase with Prisma ORM for data management.

## Project Phases

1. **Phase 1**: Deep IP Analysis - Analyze all TMS documents to discover methodology
2. **Phase 2**: System Design - Design multi-agent system based on findings
3. **Phase 3**: Mock Implementation - Build functional mock system with IP-derived data

## Reference Implementation

Can reference `../openai-cs-agents-demo` for agent triage, guardrails, and LangChain patterns, but adapt to the specified tech stack.

## Git Permissions

The project has Git permissions configured in `.claude/settings.local.json` for repository initialization and management.