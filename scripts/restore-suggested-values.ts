import prisma from '@/lib/db';
import { FIELD_SUGGESTIONS } from '@/src/lib/agents/extraction/suggested-options';

async function restoreSuggestedValues() {
  try {
    // Get current configuration
    const config = await prisma.agentConfiguration.findFirst({
      where: {
        agentName: 'OnboardingAgent',
        active: true
      }
    });

    if (!config) {
      console.log('No active OnboardingAgent configuration found');
      return;
    }

    const extractionRules = config.extractionRules as any;
    console.log('Current fields:', Object.keys(extractionRules));
    
    // Update each field with suggested values from FIELD_SUGGESTIONS
    let updatedCount = 0;
    for (const [fieldName, rule] of Object.entries(extractionRules)) {
      if (FIELD_SUGGESTIONS[fieldName]) {
        const suggestions = FIELD_SUGGESTIONS[fieldName];
        rule.suggestedValues = suggestions.options;
        if (suggestions.helpText) {
          rule.helpText = suggestions.helpText;
        }
        console.log(`Added ${suggestions.options.length} suggested values to ${fieldName}`);
        updatedCount++;
      }
    }
    
    if (updatedCount === 0) {
      console.log('No fields needed suggested values update');
      return;
    }

    // Update the configuration
    await prisma.agentConfiguration.update({
      where: {
        id: config.id
      },
      data: {
        extractionRules: extractionRules,
        version: config.version + 1
      }
    });

    console.log(`\nSuccessfully updated ${updatedCount} fields with suggested values`);
    console.log('New version:', config.version + 1);
    
    // Show which fields now have suggested values
    console.log('\nFields with suggested values:');
    for (const [fieldName, rule] of Object.entries(extractionRules)) {
      if (rule.suggestedValues && rule.suggestedValues.length > 0) {
        console.log(`- ${fieldName}: ${rule.suggestedValues.length} options`);
      }
    }
    
  } catch (error) {
    console.error('Error restoring suggested values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreSuggestedValues();