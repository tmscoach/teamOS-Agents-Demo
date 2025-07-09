#!/usr/bin/env node

/**
 * Script to link your Clerk user to the database
 * Run this after signing in to create the necessary database records
 */

import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function linkClerkUser() {
  // Get the Clerk ID from command line argument
  const clerkId = process.argv[2];
  
  if (!clerkId) {
    console.error('❌ Please provide your Clerk ID as an argument');
    console.log('\nUsage: npx tsx scripts/link-clerk-user.ts <your-clerk-id>');
    console.log('\nTo find your Clerk ID:');
    console.log('1. Sign in to the application');
    console.log('2. Open browser developer tools');
    console.log('3. Go to Application/Storage > Cookies');
    console.log('4. Look for __session cookie or check Network tab for API calls');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      console.log('✅ User already exists in database:', existingUser.name);
      return;
    }

    // Check if demo team exists
    const demoTeam = await prisma.team.findFirst({
      where: { id: 'demo-team-1' },
    });

    if (!demoTeam) {
      console.log('Creating demo team...');
      // Create a minimal user first to be the manager
      const tempManager = await prisma.user.create({
        data: {
          id: 'temp-manager-' + Date.now(),
          clerkId: 'temp-' + Date.now(),
          email: 'temp@example.com',
          name: 'Temporary Manager',
          role: 'MANAGER',
        },
      });

      await prisma.team.create({
        data: {
          id: 'demo-team-1',
          name: 'Demo Engineering Team',
          department: 'Engineering',
          managerId: tempManager.id,
          transformationStatus: 'active',
        },
      });
    }

    // Create the new user linked to Clerk
    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkId,
        email: `user-${clerkId}@teamos.ai`, // You can update this later
        name: 'Your Name', // You can update this later
        role: 'MANAGER',
        managedTeams: {
          connect: { id: 'demo-team-1' }
        }
      },
    });

    // Update the team to have this user as manager
    await prisma.team.update({
      where: { id: 'demo-team-1' },
      data: { managerId: newUser.id },
    });

    console.log('✅ Successfully linked your Clerk user to the database!');
    console.log('📝 User details:');
    console.log('   - Database ID:', newUser.id);
    console.log('   - Clerk ID:', newUser.clerkId);
    console.log('   - Role:', newUser.role);
    console.log('   - Managing team:', 'Demo Engineering Team');
    console.log('\n🎉 You can now use the chat interface at /chat');

  } catch (error) {
    console.error('❌ Error linking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkClerkUser();