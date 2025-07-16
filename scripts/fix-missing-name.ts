import prisma from '@/lib/db';

async function fixMissingName(conversationId: string, userName: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        contextData: true
      }
    });
    
    if (!conversation) {
      console.log('Conversation not found');
      return;
    }
    
    const context = conversation.contextData as any;
    if (!context.metadata) context.metadata = {};
    if (!context.metadata.onboarding) context.metadata.onboarding = {};
    
    const metadata = context.metadata.onboarding;
    
    // Add the missing name
    if (!metadata.capturedFields) metadata.capturedFields = {};
    metadata.capturedFields.user_name = userName;
    
    // Update required fields status
    if (!metadata.requiredFieldsStatus) metadata.requiredFieldsStatus = {};
    metadata.requiredFieldsStatus.user_name = true;
    
    // Check if all fields are now complete
    const allFieldsCaptured = Object.values(metadata.requiredFieldsStatus).every(status => status === true);
    if (allFieldsCaptured && Object.keys(metadata.requiredFieldsStatus).length === 5) {
      metadata.isComplete = true;
      console.log('Onboarding is now complete!');
    }
    
    // Save back to database
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        contextData: context
      }
    });
    
    console.log(`Fixed conversation ${conversationId}:`);
    console.log(`- Added user_name: ${userName}`);
    console.log(`- Captured fields:`, metadata.capturedFields);
    console.log(`- Progress: ${Object.values(metadata.requiredFieldsStatus).filter(Boolean).length} of ${Object.keys(metadata.requiredFieldsStatus).length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: npx tsx scripts/fix-missing-name.ts <conversationId> <userName>
const conversationId = process.argv[2];
const userName = process.argv[3];

if (!conversationId || !userName) {
  console.log('Usage: npx tsx scripts/fix-missing-name.ts <conversationId> <userName>');
  process.exit(1);
}

fixMissingName(conversationId, userName);