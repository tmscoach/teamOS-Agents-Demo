/**
 * Script to fix suggested values that were stored as strings instead of arrays
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function fixSuggestedValuesFormat() {
  try {
    console.log('Fixing suggested values format...');
    
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
    
    // Check each field
    for (const [fieldName, rule] of Object.entries(extractionRules)) {
      // Fix if it's a string
      if (rule.suggestedValues && typeof rule.suggestedValues === 'string') {
        console.log(`  - Fixing ${fieldName} suggested values from string to array`);
        
        // Try to parse the string as comma-separated values
        const values = rule.suggestedValues
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        
        rule.suggestedValues = values;
        updated = true;
      }
      // Fix if it's an array with a single comma-separated string
      else if (rule.suggestedValues && Array.isArray(rule.suggestedValues) && 
               rule.suggestedValues.length === 1 && 
               typeof rule.suggestedValues[0] === 'string' &&
               rule.suggestedValues[0].includes(',')) {
        console.log(`  - Fixing ${fieldName} suggested values from single-element array to proper array`);
        
        // Split the single string element
        const values = rule.suggestedValues[0]
          .split(',')
          .map((v: string) => v.trim())
          .filter((v: string) => v.length > 0);
        
        rule.suggestedValues = values;
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
      console.log('Fixed suggested values format!');
    } else {
      console.log('No fixes needed');
    }
    
  } catch (error) {
    console.error('Error fixing suggested values:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixSuggestedValuesFormat();