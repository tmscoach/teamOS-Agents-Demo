import prisma from '@/lib/db';

async function debugConversation(conversationId: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        contextData: true,
        currentAgent: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!conversation) {
      console.log('Conversation not found');
      return;
    }
    
    const context = conversation.contextData as any;
    const metadata = context?.metadata?.onboarding || {};
    
    console.log('=== Conversation Debug ===');
    console.log('ID:', conversation.id);
    console.log('Agent:', conversation.currentAgent);
    console.log('Created:', conversation.createdAt);
    console.log('Updated:', conversation.updatedAt);
    console.log('\n=== Onboarding Metadata ===');
    console.log('Captured Fields:', metadata.capturedFields || {});
    console.log('Required Fields Status:', metadata.requiredFieldsStatus || {});
    console.log('Is Complete:', metadata.isComplete);
    
    // Count fields
    const requiredFields = metadata.requiredFieldsStatus || {};
    const captured = Object.values(requiredFields).filter(Boolean).length;
    const total = Object.keys(requiredFields).length;
    
    console.log(`\nProgress: ${captured} of ${total} fields captured`);
    
    // Show which fields are missing
    const missing = Object.entries(requiredFields)
      .filter(([_, captured]) => !captured)
      .map(([field]) => field);
      
    if (missing.length > 0) {
      console.log('Missing fields:', missing);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get conversation ID from command line
const conversationId = process.argv[2];
if (!conversationId) {
  console.log('Usage: npx tsx scripts/debug-conversation.ts <conversationId>');
  process.exit(1);
}

debugConversation(conversationId);