/**
 * Script to update the active configuration with complete suggested values from FIELD_SUGGESTIONS
 */

import { PrismaClient } from '../lib/generated/prisma';
import { FIELD_SUGGESTIONS } from '../src/lib/agents/extraction/suggested-options';

const prisma = new PrismaClient();

async function updateWithCompleteSuggestions() {
  try {
    console.log('Updating configuration with complete suggested values...');
    
    // Find the latest active OnboardingAgent configuration
    const config = await prisma.agentConfiguration.findFirst({
      where: {
        agentName: 'OnboardingAgent',
        active: true
      },
      orderBy: {
        version: 'desc'
      }
    });
    
    if (!config) {
      console.log('No active OnboardingAgent configuration found');
      return;
    }
    
    console.log(`Found active configuration version ${config.version}`);
    
    const extractionRules = config.extractionRules as Record<string, any>;
    let updated = false;
    
    // Update each field with complete suggested values from FIELD_SUGGESTIONS
    for (const [fieldName, suggestions] of Object.entries(FIELD_SUGGESTIONS)) {
      if (extractionRules[fieldName]) {
        console.log(`  - Updating ${fieldName} with ${suggestions.options.length} suggested values`);
        extractionRules[fieldName].suggestedValues = suggestions.options;
        
        if (suggestions.helpText) {
          extractionRules[fieldName].helpText = suggestions.helpText;
        }
        
        updated = true;
      }
    }
    
    if (updated) {
      // Update the configuration
      await prisma.agentConfiguration.update({
        where: {
          id: config.id
        },
        data: {
          extractionRules: extractionRules
        }
      });
      console.log('Updated configuration with complete suggested values!');
    } else {
      console.log('No updates needed');
    }
    
  } catch (error) {
    console.error('Error updating suggested values:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateWithCompleteSuggestions();