# Project Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Clerk account for authentication (free tier available)

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd teamOS-Agents-Demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables Setup**
   
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

   **IMPORTANT**: You must update the Clerk authentication keys in `.env` with actual values to avoid runtime errors.

   ### Getting Clerk Keys
   1. Sign up for a free account at [https://clerk.com](https://clerk.com)
   2. Create a new application in the Clerk dashboard
   3. Navigate to API Keys in your Clerk dashboard
   4. Copy your keys and update these values in `.env`:
      - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your publishable key (starts with `pk_`)
      - `CLERK_SECRET_KEY`: Your secret key (starts with `sk_`)

   Without valid Clerk keys, you will encounter the following runtime errors:
   - "Error: Publishable key not valid"
   - Missing vendor chunks errors

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Runtime Errors on Dashboard/Sign-in Pages

If you encounter errors like:
- `Error: Cannot find module './vendor-chunks/next.js'`
- `Error: Cannot find module './vendor-chunks/swr.js'`
- `Error: Publishable key not valid`

**Solution:**
1. Ensure your `.env` file exists and contains all required variables from `.env.example`
2. Verify Clerk keys are valid (not placeholder values)
3. Clean build cache and reinstall dependencies:
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run dev
   ```

### Build Errors

For production builds, you must have valid Clerk API keys. The build process will fail with placeholder values.

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Project README](../README.md)