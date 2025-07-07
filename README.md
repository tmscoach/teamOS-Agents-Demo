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
   cp .env.example .env.local
   ```
   Update `.env.local` with your actual credentials.

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

## Deployment

The project is configured for automatic deployment to Vercel. Merging to `main` triggers a production deployment.

## License

Private - All rights reserved