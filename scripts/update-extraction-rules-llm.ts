import prisma from '../lib/db';
import { AgentConfigurationService } from '../src/lib/services/agent-configuration';

async function updateExtractionRulesToUseLLM() {
  try {
    // Get current OnboardingAgent configuration
    const config = await AgentConfigurationService.getActiveConfiguration('OnboardingAgent');
    
    if (!config) {
      console.error('No active configuration found for OnboardingAgent');
      return;
    }

    console.log('Current extraction rules:', JSON.stringify(config.extractionRules, null, 2));

    // Update extraction rules to prefer LLM for name fields
    const updatedRules = config.extractionRules as Record<string, any>;
    
    // Update manager_name field
    if (updatedRules.manager_name) {
      updatedRules.manager_name.preferLLM = true;
      updatedRules.manager_name.useLLMFallback = true;
      updatedRules.manager_name.description = "The manager's full name";
      updatedRules.manager_name.examples = ["John Smith", "Sarah Johnson", "Michael Chen"];
    }

    // Update user_name field if it exists
    if (updatedRules.user_name) {
      updatedRules.user_name.preferLLM = true;
      updatedRules.user_name.useLLMFallback = true;
      updatedRules.user_name.description = "The user's full name";
      updatedRules.user_name.examples = ["John Smith", "Sarah Johnson", "Michael Chen"];
    }

    // Update name field if it exists
    if (updatedRules.name) {
      updatedRules.name.preferLLM = true;
      updatedRules.name.useLLMFallback = true;
      updatedRules.name.description = "The person's full name";
      updatedRules.name.examples = ["John Smith", "Sarah Johnson", "Michael Chen"];
    }

    // Create new configuration version with updated rules
    const newConfig = await AgentConfigurationService.updateConfiguration(
      'OnboardingAgent',
      {
        extractionRules: updatedRules
      },
      'script-update'
    );

    console.log(`\nSuccessfully updated extraction rules to use LLM-first for name fields`);
    console.log(`New configuration version: ${newConfig.version}`);
    console.log('\nUpdated rules:', JSON.stringify(updatedRules, null, 2));
    
    console.log('\nDon\'t forget to restart your dev server to ensure the .env.local changes are loaded!');
  } catch (error) {
    console.error('Error updating extraction rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateExtractionRulesToUseLLM();