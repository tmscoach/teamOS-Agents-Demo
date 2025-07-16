# Clerk Sign-Up Configuration Guide

This guide helps you configure Clerk to enable magic link sign-up for new users.

## Quick Setup for Magic Link Sign-Up

### 1. Access Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Sign in and select your application
3. Make sure you're in the correct environment (Development/Production)

### 2. Enable Email Authentication
1. Navigate to **User & Authentication** → **Email, Phone, Username**
2. Under **Contact information**, ensure:
   - ✅ **Email address** is toggled ON
   - Set as "Required"

### 3. Enable Email Verification
1. Still in **Email, Phone, Username** settings
2. Under **Authentication strategies**, enable ONE of these:
   - **Email verification link** (recommended for magic links)
   - **Email verification code** (6-digit code)
   
   Note: The app will try email_link first, then fall back to email_code

### 4. Configure Sign-Up Settings
1. Go to **User & Authentication** → **Restrictions**
2. Make sure:
   - Sign-ups are allowed
   - No domain restrictions (or add your test domains)

### 5. Email Provider Configuration
1. Go to **Customization** → **Email & SMS**
2. For development, Clerk's default email provider works fine
3. For production, configure your own email provider (SendGrid, etc.)

## Testing Your Configuration

### Option 1: Test with Real Email
1. Go to http://localhost:3000/sign-up
2. Enter `manager2@bythelight.band`
3. Click "Continue with Email"
4. Check your email for the verification link/code

### Option 2: Use Dev Login (No Email Required)
1. Go to http://localhost:3000/dev-login
2. Enter any email address
3. Instant access without email verification

## Common Issues and Solutions

### Error: "is invalid"
This means email verification is not enabled in Clerk:
- Check that either "Email verification link" or "Email verification code" is enabled
- Make sure your Clerk API keys in `.env` are correct

### Error: "form_param_format_invalid"
- Verify that "Email address" is enabled as a contact method
- Check that your Clerk instance is properly initialized

### No Email Received
1. Check spam/junk folder
2. In Clerk dashboard, go to **Logs** to see if emails were sent
3. Verify email provider is configured correctly

### Error: "strategy_not_allowed"
- The authentication strategy (email_link or email_code) is not enabled
- Enable at least one email verification method in Clerk dashboard

## Clerk Dashboard Quick Links

- [User & Authentication Settings](https://dashboard.clerk.com/apps/YOUR_APP_ID/user-authentication/email-phone-username)
- [Email Templates](https://dashboard.clerk.com/apps/YOUR_APP_ID/customization/email-templates)
- [Logs](https://dashboard.clerk.com/apps/YOUR_APP_ID/logs)

Replace `YOUR_APP_ID` with your actual Clerk application ID.

## Alternative: Password-Based Sign-Up

If you prefer password authentication:
1. Enable **Password** under authentication strategies
2. The sign-up form will need to be modified to include password fields
3. No email verification required for immediate access

## Need Help?

- Clerk Documentation: https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options
- Clerk Support: https://clerk.com/support