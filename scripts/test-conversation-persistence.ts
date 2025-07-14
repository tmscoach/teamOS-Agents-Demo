/**
 * Test script to verify conversation persistence functionality
 */

import { ConversationStore } from '@/src/lib/agents/persistence';
import { prisma } from '@/lib/db/prisma';

async function testConversationPersistence() {
  console.log('Testing conversation persistence...\n');

  const conversationStore = new ConversationStore(prisma);

  try {
    // 1. Create a test conversation
    console.log('1. Creating test conversation...');
    const conversationId = await conversationStore.createConversation(
      'test-team-id',
      'test-manager-id',
      {
        initialAgent: 'OnboardingAgent',
        metadata: { test: true }
      }
    );
    console.log(`✓ Created conversation: ${conversationId}`);

    // 2. Add some messages
    console.log('\n2. Adding test messages...');
    await conversationStore.addMessage(conversationId, {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, I need help getting started',
      timestamp: new Date(),
    });

    await conversationStore.addMessage(conversationId, {
      id: 'msg-2',
      role: 'assistant',
      content: 'Welcome! I\'m here to help you get started with TeamOS.',
      agent: 'OnboardingAgent',
      timestamp: new Date(),
    });
    console.log('✓ Added 2 messages');

    // 3. Load the conversation
    console.log('\n3. Loading conversation...');
    const loadedConversation = await conversationStore.loadConversation(conversationId);
    
    if (!loadedConversation) {
      throw new Error('Failed to load conversation');
    }

    console.log('✓ Loaded conversation successfully');
    console.log(`  - Current Agent: ${loadedConversation.context.currentAgent}`);
    console.log(`  - Phase: ${loadedConversation.context.transformationPhase}`);
    console.log(`  - Messages: ${loadedConversation.messages.length}`);

    // 4. Verify messages
    console.log('\n4. Verifying messages...');
    if (loadedConversation.messages.length !== 2) {
      throw new Error(`Expected 2 messages, got ${loadedConversation.messages.length}`);
    }

    const [userMsg, assistantMsg] = loadedConversation.messages;
    if (userMsg.role !== 'user' || assistantMsg.role !== 'assistant') {
      throw new Error('Message roles are incorrect');
    }
    console.log('✓ Messages verified correctly');

    // 5. Update context
    console.log('\n5. Updating conversation context...');
    await conversationStore.updateContext(conversationId, {
      currentAgent: 'DiscoveryAgent',
      transformationPhase: 'discovery',
    });
    console.log('✓ Context updated');

    // 6. Verify update
    const updatedConversation = await conversationStore.loadConversation(conversationId);
    if (updatedConversation?.context.currentAgent !== 'DiscoveryAgent') {
      throw new Error('Context update failed');
    }
    console.log('✓ Update verified');

    // 7. Clean up
    console.log('\n7. Cleaning up test data...');
    await conversationStore.deleteConversation(conversationId);
    console.log('✓ Test conversation deleted');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConversationPersistence();