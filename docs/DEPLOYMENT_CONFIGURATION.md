# Deployment Configuration

## Overview

This project is configured to deploy to Vercel only when changes are merged to the `main` branch. Pull requests and pushes to other branches will NOT trigger automatic deployments.

## Configuration Details

### 1. Vercel Configuration (`vercel.json`)

The `git.deploymentEnabled` setting controls which branches trigger deployments:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
```

This configuration:
- ✅ Enables deployments for the `main` branch
- ❌ Disables deployments for all other branches
- ❌ Disables preview deployments for pull requests

### 2. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

The deployment workflow is configured to only run on pushes to the main branch:

```yaml
on:
  push:
    branches: [main]
```

## Additional Vercel Settings

You may also want to configure these settings in your Vercel project dashboard:

1. Go to your project settings in Vercel
2. Navigate to "Git" settings
3. Disable "Preview Deployments" for all branches except main
4. Disable "Comments on Pull Requests" if you don't want Vercel bot comments

## How It Works

1. Developer creates a pull request → No deployment
2. PR is reviewed and approved → No deployment
3. PR is merged to main → Deployment triggered
4. Direct push to main → Deployment triggered

## Benefits

- Reduces unnecessary deployments and build minutes
- Prevents preview URLs from being created for every PR
- Ensures only reviewed and approved code is deployed
- Simplifies deployment management

## Troubleshooting

If deployments are still happening for non-main branches:

1. Check your Vercel project settings in the dashboard
2. Ensure the `vercel.json` file is committed and deployed
3. Verify that no branch protection rules are overriding these settings
4. Check if there are any Vercel integrations that might be triggering deployments