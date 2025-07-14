import { prisma } from '../lib/db/prisma';

async function checkUserConversations() {
  try {
    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        email: 'manager1@bythelight.band'
      },
      select: {
        id: true,
        email: true,
        journeyStatus: true,
        role: true
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User:', user);

    // Find all conversations for this user
    const conversations = await prisma.conversation.findMany({
      where: {
        managerId: user.id
      },
      select: {
        id: true,
        currentAgent: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log('\nConversations found:', conversations.length);
    conversations.forEach((conv, i) => {
      console.log(`\nConversation ${i + 1}:`);
      console.log('ID:', conv.id);
      console.log('Current Agent:', conv.currentAgent);
      console.log('Created:', conv.createdAt);
      console.log('Updated:', conv.updatedAt);
      console.log('Metadata:', JSON.stringify(conv.metadata, null, 2));
    });

    // Check for OnboardingAgent conversations specifically
    const onboardingConvs = conversations.filter(c => c.currentAgent === 'OnboardingAgent');
    console.log('\nOnboardingAgent conversations:', onboardingConvs.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserConversations();