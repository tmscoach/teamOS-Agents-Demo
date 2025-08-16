# Clerk Magic Link Authentication Setup

This guide explains how to enable magic link authentication in your Clerk dashboard for local development.

## Prerequisites

1. A Clerk account and application (sign up at https://clerk.com)
2. Your Clerk API keys in the `.env` file

## Steps to Enable Magic Link Authentication

### 1. Access Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Sign in to your account
3. Select your application

### 2. Configure Email Authentication
1. Navigate to **User & Authentication** → **Email, Phone, Username**
2. Under **Contact Information**, ensure **Email address** is enabled
3. Under **Authentication strategies**, enable **Email verification link**
4. Disable **Password** if you only want magic link authentication

### 3. Configure Email Templates (Optional)
1. Go to **Customization** → **Email templates**
2. Select **Sign in** template
3. Customize the email content if desired
4. Ensure the magic link URL is properly configured

### 4. Configure Redirect URLs
1. Go to **Paths** in the dashboard
2. Ensure these URLs are set correctly:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### 5. Development Environment Settings
1. Go to **API Keys**
2. Ensure you're using the correct environment (Development/Production)
3. Copy the correct keys to your `.env` file

### 6. Test Email Delivery
1. For local development, Clerk sends real emails even in development mode
2. Check your spam folder if emails don't arrive
3. Consider using a service like Mailtrap for testing

## Troubleshooting

### Error: "strategy_not_allowed"
This means email link authentication is not enabled in your Clerk dashboard. Follow step 2 above.

### Emails Not Arriving
1. Check spam/junk folder
2. Verify email address is correct
3. Check Clerk dashboard logs for email sending errors
4. Ensure your Clerk application is not in a suspended state

### Redirect Issues
1. Ensure `NEXT_PUBLIC_APP_URL` in `.env` is set correctly
2. For local development: `http://localhost:3000`
3. For production: Your actual domain

### Session Not Persisting
1. Check that cookies are enabled in your browser
2. Ensure you're not in incognito/private mode
3. Verify middleware.ts is properly configured

## Local Development Tips

1. Use a real email address for testing
2. Keep the browser console open to see any errors
3. The magic link expires in 15 minutes
4. Each magic link can only be used once

## Alternative: Password Authentication

If magic links don't work for your use case, you can revert to password authentication:
1. Enable **Password** in authentication strategies
2. Update the sign-in page to include password field
3. Use the original `signIn.create()` method with password

## Need Help?

- Clerk Documentation: https://clerk.com/docs
- Clerk Support: https://clerk.com/support
- Check the Clerk dashboard logs for detailed error messages