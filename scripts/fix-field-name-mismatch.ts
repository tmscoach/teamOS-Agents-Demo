import prisma from '@/lib/db';
import { ENHANCED_EXTRACTION_PATTERNS } from '@/src/lib/agents/extraction/enhanced-patterns';

async function fixFieldNameMismatch() {
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
    console.log('Current extraction rules fields:', Object.keys(extractionRules));
    
    // Check if we have manager_name instead of user_name
    if (extractionRules.manager_name && !extractionRules.user_name) {
      console.log('Found manager_name field, adding user_name as alias...');
      
      // Copy manager_name to user_name
      extractionRules.user_name = {
        ...extractionRules.manager_name,
        description: 'Extract the user/manager name'
      };
      
      // Remove manager_name to avoid duplication
      delete extractionRules.manager_name;
      
      console.log('Migrated manager_name to user_name');
    }
    
    // Check if we have manager_role instead of user_role
    if (extractionRules.manager_role && !extractionRules.user_role) {
      console.log('Found manager_role field, adding user_role as alias...');
      
      // Copy manager_role to user_role
      extractionRules.user_role = {
        ...extractionRules.manager_role,
        description: 'Extract the user/manager role or title'
      };
      
      // Remove manager_role to avoid duplication
      delete extractionRules.manager_role;
      
      console.log('Migrated manager_role to user_role');
    }
    
    // Add missing suggested values for user_role if not present
    if (extractionRules.user_role && !extractionRules.user_role.suggestedValues) {
      extractionRules.user_role.suggestedValues = [
        'Engineering Manager',
        'Product Manager',
        'Team Lead',
        'Project Manager',
        'Department Head',
        'Director',
        'VP',
        'CEO/Founder'
      ];
      console.log('Added suggested values for user_role');
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

    console.log('Successfully fixed field name mismatches to version', config.version + 1);
    console.log('Final extraction rules fields:', Object.keys(extractionRules));
  } catch (error) {
    console.error('Error fixing field names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFieldNameMismatch();