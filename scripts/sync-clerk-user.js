// Script to sync existing Clerk user to database
const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function syncClerkUser() {
  try {
    // Get the Clerk user ID from the API
    const response = await fetch('http://localhost:3002/api/dev/get-clerk-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'manager@bythelight.band' }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Clerk user');
    }

    const { userId } = await response.json();

    // Create or update the user in the database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        email: 'manager@bythelight.band',
        name: 'manager',
        role: 'MANAGER',
      },
      update: {
        email: 'manager@bythelight.band',
        name: 'manager',
        role: 'MANAGER',
      },
    });

    console.log('✅ User synced to database:', user);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncClerkUser();