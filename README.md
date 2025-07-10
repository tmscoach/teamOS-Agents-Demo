# TeamOS Agents Demo

TMS (Team Management Systems) transformation platform - An intelligent multi-agent system for team transformation based on 40+ years of TMS intellectual property.

## Tech Stack

- **Frontend**: React, Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Lucide Icons
- **Notifications**: Sonner Toast
- **Backend**: Prisma ORM, Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Deployment**: Vercel
- **Payments**: Stripe (configured for future use)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Clerk account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/tmscoach/teamOS-Agents-Demo.git
   cd teamOS-Agents-Demo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   **Important**: Update `.env` with your actual Clerk credentials to avoid runtime errors. See [Setup Guide](./docs/SETUP.md) for detailed instructions.

4. Set up the database:

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

**Note**: For troubleshooting runtime errors and detailed setup instructions, please refer to the [Setup Guide](./docs/SETUP.md).

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   └── (dashboard)/       # Protected dashboard routes (to be implemented)
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── features/         # Feature-specific components
├── lib/                   # Utilities and helpers
│   ├── db/              # Database utilities (Prisma, Supabase)
│   └── utils/           # General utilities
├── prisma/               # Prisma schema and migrations
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for required environment variables.

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` and `npm run type-check`
4. Commit your changes
5. Create a pull request

## CI/CD and GitHub Notifications

### Continuous Integration

The project uses GitHub Actions for CI with the following checks:

- ESLint for code quality
- TypeScript type checking
- Prettier formatting validation
- Build verification

### Pre-commit Hooks

To prevent CI failures, pre-commit hooks are configured using Husky and lint-staged:

- Automatically runs ESLint and Prettier on staged files
- Prevents commits with linting or formatting errors
- Ensures code quality before pushing to GitHub

### Managing GitHub Notifications

To reduce email notifications from CI workflow failures:

1. **Configure Repository Watch Settings**
   - Go to the repository page on GitHub
   - Click the "Watch" button dropdown
   - Select "Custom" and uncheck "Actions" to disable workflow notifications
   - Or select "Participating and @mentions" to only get notifications for PRs you're involved in

2. **Configure Personal Notification Settings**
   - Go to GitHub Settings → Notifications
   - Under "Actions", uncheck "Failed workflows only" if you don't want failure emails
   - Consider setting up email filters for GitHub Actions emails

3. **Email Filtering (Recommended)**
   - Create email filters for GitHub Actions notifications
   - Filter sender: `notifications@github.com`
   - Filter subject containing: `[teamOS-Agents-Demo] Run failed:`
   - Action: Skip inbox, apply label, or move to folder

### Best Practices

- Always run `npm run lint` and `npm run type-check` before pushing
- Fix all linting errors before creating a PR
- The pre-commit hooks will help catch issues early
- Keep your local `main` branch up to date to avoid merge conflicts

## Deployment

The project is configured for automatic deployment to Vercel. Merging to `main` triggers a production deployment.

## License

Private - All rights reserved
