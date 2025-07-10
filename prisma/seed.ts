import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Note: The actual admin user will be created through Clerk authentication
  // This seed file is for documentation purposes and future enhancements
  
  // When the admin user (rowan@teammanagementsystems.com) signs up through Clerk,
  // the webhook will automatically assign them the ADMIN role based on their email
  
  console.log(`
    Admin User Setup Instructions:
    1. Ensure CLERK_WEBHOOK_SECRET is set in your .env file
    2. Sign up with email: rowan@teammanagementsystems.com
    3. Use password: 1.Teamwork!
    4. The webhook will automatically assign ADMIN role
    5. Admin will have access to /admin routes
  `)

  // You can add other seed data here if needed
  // For example, sample teams, assessments, etc.

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })