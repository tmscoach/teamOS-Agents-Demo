# Authentication Setup Guide

This guide explains how to set up authentication for the TeamOS platform.

## Overview

TeamOS uses Clerk for authentication with the following features:
- Email/password authentication
- Google OAuth
- Microsoft OAuth
- Role-based access control (Admin, Team Manager, Team Member)
- Journey tracking for onboarding

## Initial Setup

### 1. Configure Clerk

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Enable the following authentication methods:
   - Email/Password
   - Google OAuth
   - Microsoft OAuth

### 2. Set Environment Variables

Copy `.env.example` to `.env` and fill in your Clerk keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-publishable-key"
CLERK_SECRET_KEY="your-secret-key"
CLERK_WEBHOOK_SECRET="your-webhook-secret"
```

### 3. Configure Clerk Webhook

1. In Clerk Dashboard, go to Webhooks
2. Create a new endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Select the following events:
   - user.created
   - user.updated
   - user.deleted
4. Copy the webhook secret to your `.env` file

### 4. Run Database Migrations

```bash
npm run db:generate
npm run db:migrate
```

## User Roles

### Admin User
- Email: `rowan@teammanagementsystems.com`
- Password: `1.Teamwork!`
- Automatically assigned ADMIN role on signup
- Access to `/admin/*` routes

### Team Manager
- Default role for all new signups
- Access to team transformation tools
- Goes through onboarding flow on first login

### Team Member
- Created by Team Managers (future feature)
- Limited access to team tools

## Authentication Flow

### New User Registration
1. User signs up via `/sign-up`
2. Clerk creates user account
3. Webhook syncs user to database with TEAM_MANAGER role
4. User is redirected to `/onboarding`
5. Orchestrator agent guides through onboarding steps

### Existing User Login
1. User signs in via `/sign-in`
2. Middleware checks user's journey status
3. If onboarding incomplete → redirect to `/onboarding`
4. If onboarding complete → redirect to `/dashboard`

### Admin Access
1. Admin signs in with designated email
2. Middleware verifies ADMIN role
3. Access granted to `/admin/*` routes

## Onboarding Journey

The onboarding flow consists of 5 steps:

1. **Welcome & Introduction** - Introduction to TeamOS
2. **Team Context** - Gather team information
3. **Goals Setting** - Define transformation goals
4. **Initial Assessment** - Complete Team Signals baseline
5. **Transformation Plan** - Review customized plan

Progress is tracked in the database and users can resume where they left off.

## Testing

### Test User Creation
1. Sign up with any email to create a team manager account
2. Use `rowan@teammanagementsystems.com` to create an admin account

### Test Journey Tracking
1. Start onboarding as a new user
2. Log out mid-process
3. Log back in - should resume at last step

### Test Role-Based Access
1. Try accessing `/admin` as team manager - should redirect
2. Access `/admin` as admin user - should succeed

## Troubleshooting

### Webhook Not Working
- Verify webhook secret is correct
- Check webhook endpoint URL
- Ensure database is accessible
- Check server logs for webhook errors

### User Not Syncing
- Verify Clerk webhook events are configured
- Check database connection
- Ensure Prisma client is generated

### OAuth Not Working
- Verify OAuth providers are enabled in Clerk
- Check redirect URLs are configured
- Ensure production URLs are whitelisted