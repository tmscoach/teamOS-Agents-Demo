import prisma from '@/lib/db';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';

async function fixExistingConversations() {
  try {
    console.log('=== Fixing Existing Conversation Metadata ===\n');
    
    // Get all active OnboardingAgent conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        currentAgent: 'OnboardingAgent',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        id: true,
        contextData: true,
        metadata: true
      }
    });
    
    console.log(`Found ${conversations.length} OnboardingAgent conversations to check`);
    
    // Get required fields from configuration
    const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    if (!config) {
      console.error('Could not load OnboardingAgent configuration');
      return;
    }
    
    const requiredFields = Object.entries(config.extractionRules)
      .filter(([_, rule]: [string, any]) => rule.required === true)
      .map(([field]) => field);
    
    console.log('Required fields:', requiredFields);
    
    let fixedCount = 0;
    
    for (const conversation of conversations) {
      const context = conversation.contextData as any;
      const metadata = context?.metadata?.onboarding || {};
      
      // Check if requiredFieldsStatus needs fixing
      const currentStatus = metadata.requiredFieldsStatus || {};
      const currentFieldCount = Object.keys(currentStatus).length;
      
      if (currentFieldCount < requiredFields.length) {
        console.log(`\nFixing conversation ${conversation.id}:`);
        console.log(`- Current field count: ${currentFieldCount}`);
        console.log(`- Required field count: ${requiredFields.length}`);
        
        // Initialize all required fields
        const newRequiredFieldsStatus: Record<string, boolean> = {};
        for (const field of requiredFields) {
          // Preserve existing status or set to false
          newRequiredFieldsStatus[field] = currentStatus[field] || false;
          
          // Check if field is actually captured
          if (metadata.capturedFields && metadata.capturedFields[field]) {
            newRequiredFieldsStatus[field] = true;
          }
        }
        
        // Update the context
        if (!context.metadata) context.metadata = {};
        if (!context.metadata.onboarding) context.metadata.onboarding = {};
        
        context.metadata.onboarding = {
          ...metadata,
          requiredFieldsStatus: newRequiredFieldsStatus
        };
        
        // Save back to database
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            contextData: context
          }
        });
        
        console.log(`- Fixed! New field count: ${Object.keys(newRequiredFieldsStatus).length}`);
        fixedCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Total conversations checked: ${conversations.length}`);
    console.log(`Conversations fixed: ${fixedCount}`);
    
  } catch (error) {
    console.error('Error fixing conversations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingConversations();