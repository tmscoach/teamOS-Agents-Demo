import prisma from '@/lib/db';
import { ADDITIONAL_PATTERNS } from '@/src/lib/agents/extraction/enhanced-patterns';

async function addUserRoleField() {
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
    
    // Check if user_role already exists
    if (extractionRules.user_role) {
      console.log('user_role field already exists');
      return;
    }
    
    // Add user_role field
    extractionRules.user_role = {
      type: 'string',
      description: 'Extract the user/manager role or title',
      required: true,
      patterns: ADDITIONAL_PATTERNS.manager_role.patterns,
      useLLMFallback: true,
      suggestedValues: [
        'Engineering Manager',
        'Product Manager',
        'Team Lead',
        'Project Manager',
        'Department Head',
        'Director',
        'VP',
        'CEO/Founder'
      ]
    };
    
    console.log('Added user_role field with suggested values');

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

    console.log('Successfully added user_role field to version', config.version + 1);
    console.log('Total required fields:', Object.entries(extractionRules)
      .filter(([_, rule]: [string, any]) => rule.required)
      .map(([field]) => field));
  } catch (error) {
    console.error('Error adding user_role field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addUserRoleField();