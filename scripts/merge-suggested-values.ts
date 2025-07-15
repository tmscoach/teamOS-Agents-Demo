/**
 * Script to merge FIELD_SUGGESTIONS into existing OnboardingAgent configurations
 * This ensures existing configurations get the suggested values without losing customizations
 */

import { PrismaClient } from '../lib/generated/prisma';
import { FIELD_SUGGESTIONS } from '../src/lib/agents/extraction/suggested-options';

const prisma = new PrismaClient();

async function mergeSuggestedValues() {
  try {
    console.log('Starting merge of suggested values...');
    
    // Find all OnboardingAgent configurations
    const configs = await prisma.agentConfiguration.findMany({
      where: {
        agentName: 'OnboardingAgent'
      },
      orderBy: {
        version: 'desc'
      }
    });
    
    console.log(`Found ${configs.length} OnboardingAgent configurations`);
    
    for (const config of configs) {
      const extractionRules = config.extractionRules as Record<string, any>;
      let updated = false;
      
      // Check each field in FIELD_SUGGESTIONS
      for (const [fieldName, suggestions] of Object.entries(FIELD_SUGGESTIONS)) {
        if (extractionRules[fieldName]) {
          // Only update if the field doesn't already have suggested values
          if (!extractionRules[fieldName].suggestedValues) {
            extractionRules[fieldName].suggestedValues = suggestions.options;
            if (suggestions.helpText) {
              extractionRules[fieldName].helpText = suggestions.helpText;
            }
            updated = true;
            console.log(`  - Added suggested values to ${fieldName}`);
          } else {
            console.log(`  - ${fieldName} already has suggested values, skipping`);
          }
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
        console.log(`Updated configuration version ${config.version}`);
      } else {
        console.log(`No updates needed for configuration version ${config.version}`);
      }
    }
    
    console.log('Merge completed successfully!');
    
  } catch (error) {
    console.error('Error merging suggested values:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the merge
mergeSuggestedValues();