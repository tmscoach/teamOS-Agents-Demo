import { PrismaClient } from '../lib/generated/prisma';
import { ConversationStore } from '../src/lib/agents/persistence';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function testDirectMessageSave() {
  try {
    const conversationStore = new ConversationStore(prisma);
    
    // Find a test user
    const user = await prisma.user.findFirst();

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

    // Create a new conversation
    const conversationId = await conversationStore.createConversation(
      team.id,
      user.id,
      {
        initialAgent: 'OnboardingAgent',
        metadata: { test: true }
      }
    );

    console.log('Created conversation:', conversationId);

    // Test adding messages directly
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: 'Test message from script',
      timestamp: new Date()
    };

    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant' as const,
      content: 'Test response from assistant',
      agent: 'OnboardingAgent',
      timestamp: new Date()
    };

    console.log('\nAdding user message...');
    await conversationStore.addMessage(conversationId, userMessage);
    
    console.log('Adding assistant message...');
    await conversationStore.addMessage(conversationId, assistantMessage);

    // Check if messages were saved
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' }
    });

    console.log(`\nFound ${messages.length} messages in database:`);
    messages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.role}${msg.agent ? ` - ${msg.agent}` : ''}]: ${msg.content}`);
    });

    // Load conversation to verify
    const loaded = await conversationStore.loadConversation(conversationId);
    console.log(`\nLoaded conversation has ${loaded?.messages.length || 0} messages in messageHistory`);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectMessageSave();