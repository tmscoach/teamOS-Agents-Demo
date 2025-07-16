import prisma from '@/lib/db';
import { ENHANCED_EXTRACTION_PATTERNS } from '@/src/lib/agents/extraction/enhanced-patterns';

async function updateNamePatterns() {
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
    
    // Update user_name patterns with the enhanced patterns
    if (extractionRules.user_name) {
      extractionRules.user_name.patterns = ENHANCED_EXTRACTION_PATTERNS.manager_name.patterns;
      console.log('Updated user_name patterns:', extractionRules.user_name.patterns.length, 'patterns');
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

    console.log('Successfully updated name extraction patterns to version', config.version + 1);
  } catch (error) {
    console.error('Error updating patterns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNamePatterns();