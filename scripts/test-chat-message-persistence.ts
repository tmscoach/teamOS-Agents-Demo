import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testChatMessagePersistence() {
  try {
    // Find a test user
    const user = await prisma.user.findFirst({
      where: { 
        email: 'rowan@tmscoach.com'
      }
    });

    if (!user) {
      console.error('Test user not found');
      return;
    }

    // Find the user's team
    const team = await prisma.team.findFirst({
      where: {
        OR: [
          { managerId: user.id },
          { members: { some: { id: user.id } } }
        ]
      }
    });

    if (!team) {
      console.error('Team not found for user');
      return;
    }

    console.log('Test user:', user.email);
    console.log('Team ID:', team.id);

    // Create a test conversation ID
    const testConversationId = `test-${Date.now()}`;

    // First, create a conversation in the database
    const conversation = await prisma.conversation.create({
      data: {
        id: testConversationId,
        teamId: team.id,
        managerId: user.id,
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        contextData: {
          teamId: team.id,
          managerId: user.id,
          conversationId: testConversationId,
          currentAgent: 'OnboardingAgent',
          transformationPhase: 'onboarding',
          messageHistory: [],
          metadata: {}
        }
      }
    });

    console.log('Created conversation:', conversation.id);

    // Now test the chat API
    const chatResponse = await fetch('http://localhost:3001/api/agents/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // We need to simulate Clerk auth - this won't work without proper auth
      },
      body: JSON.stringify({
        conversationId: testConversationId,
        message: 'Hello, I need help getting started with the system'
      })
    });

    if (!chatResponse.ok) {
      console.error('Chat API error:', chatResponse.status, await chatResponse.text());
      return;
    }

    const chatResult = await chatResponse.json();
    console.log('Chat response:', chatResult);

    // Check if messages were saved
    const messages = await prisma.message.findMany({
      where: { conversationId: testConversationId },
      orderBy: { timestamp: 'asc' }
    });

    console.log(`\nFound ${messages.length} messages in database:`);
    messages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.role}${msg.agent ? ` - ${msg.agent}` : ''}]: ${msg.content.substring(0, 100)}...`);
    });

    // Check guardrail checks
    const guardrailChecks = await prisma.guardrailCheck.findMany({
      where: { conversationId: testConversationId }
    });

    console.log(`\nFound ${guardrailChecks.length} guardrail checks`);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testChatMessagePersistence();