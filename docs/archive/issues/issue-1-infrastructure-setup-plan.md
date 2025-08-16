# Infrastructure Setup Plan - Issue #1

**Issue**: [#1 - Setup project infrastructure and development environment](https://github.com/tmscoach/teamOS-Agents-Demo/issues/1)

## Overview
This plan outlines the steps to set up the initial project infrastructure for the TMS (Team Management Systems) transformation platform.

## Tech Stack Requirements
- **Frontend**: React, Next.js, Tailwind CSS, Shadcn UI, Lucide Icons, Sonner Toast
- **Backend**: Prisma, Supabase, Vercel
- **Authentication**: Clerk Auth
- **Development**: TypeScript, ESLint, Prettier

## Implementation Plan

### 1. Initialize Next.js Project
- Use `create-next-app` with TypeScript and Tailwind CSS
- Configure App Router (Next.js 14+)
- Set up TypeScript configuration

### 2. Configure Shadcn UI
- Install Shadcn UI CLI
- Initialize Shadcn configuration
- Install basic components (Button, Card, Form, etc.)

### 3. Set up Prisma with Supabase
- Install Prisma CLI and client
- Configure Prisma schema
- Set up connection to Supabase
- Create initial database schema based on project requirements:
  - Users table
  - Teams table
  - Assessment tables (as per TMS methodology)

### 4. Configure Clerk Authentication
- Install Clerk SDK
- Set up authentication middleware
- Create sign-in/sign-up pages
- Configure user management

### 5. Development Tools
- Configure ESLint for Next.js
- Set up Prettier with consistent formatting rules
- Add pre-commit hooks with Husky

### 6. Environment Variables
- Create `.env.example` template
- Set up variables for:
  - Database connection (Supabase)
  - Clerk authentication keys
  - API endpoints
  - Environment settings

### 7. Project Structure
```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Auth-related pages
│   └── (dashboard)/      # Main app pages
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities and helpers
│   ├── db/              # Database utilities
│   └── utils/           # General utilities
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
└── .github/              # GitHub Actions workflows
```

### 8. CI/CD Pipeline
- GitHub Actions workflow for:
  - Linting and type checking on PR
  - Running tests
  - Auto-deploy to Vercel on merge to main

## Order of Implementation
1. Initialize Next.js project first
2. Add UI libraries (Tailwind, Shadcn)
3. Set up database layer (Prisma, Supabase)
4. Add authentication (Clerk)
5. Configure development tools
6. Set up CI/CD

## Notes
- Each step will be committed separately for clear history
- Will create a feature branch for this work
- Testing will be done after each major component is added