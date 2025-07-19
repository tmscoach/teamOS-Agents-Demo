#!/usr/bin/env node

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkUserData(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        journeyPhase: true,
        journeyStatus: true,
        onboardingData: true,
        completedAssessments: true,
        managedTeams: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log('\n=== User Data ===');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Journey Phase:', user.journeyPhase);
    console.log('Journey Status:', user.journeyStatus);
    console.log('\nOnboarding Data:', JSON.stringify(user.onboardingData, null, 2));
    console.log('\nCompleted Assessments:', JSON.stringify(user.completedAssessments, null, 2));
    console.log('\nManaged Teams:', user.managedTeams);

    // Check recent conversations
    const conversations = await prisma.conversation.findMany({
      where: { managerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        currentAgent: true,
        phase: true,
        createdAt: true,
        metadata: true,
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log('\n=== Recent Conversations ===');
    conversations.forEach((conv, index) => {
      console.log(`\nConversation ${index + 1}:`);
      console.log('ID:', conv.id);
      console.log('Agent:', conv.currentAgent);
      console.log('Phase:', conv.phase);
      console.log('Messages:', conv._count.messages);
      console.log('Created:', conv.createdAt);
      console.log('Metadata:', JSON.stringify(conv.metadata, null, 2));
    });

    // Check extracted fields from recent conversation
    const latestConversation = conversations[0];
    if (latestConversation) {
      const extractions = await prisma.variableExtraction.findMany({
        where: { 
          conversationId: latestConversation.id,
          successful: true
        },
        select: {
          fieldName: true,
          extractedValue: true
        }
      });

      console.log('\n=== Extracted Fields from Latest Conversation ===');
      extractions.forEach(ext => {
        console.log(`${ext.fieldName}: ${ext.extractedValue}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2] || 'mccann.rowan@gmail.com';
checkUserData(email);