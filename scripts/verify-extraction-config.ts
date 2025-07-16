import prisma from '@/lib/db';
import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';

async function verifyExtractionConfig() {
  try {
    console.log('=== Verifying Extraction Configuration ===\n');
    
    // 1. Check database configuration
    const dbConfig = await prisma.agentConfiguration.findFirst({
      where: {
        agentName: 'OnboardingAgent',
        active: true
      },
      select: {
        version: true,
        extractionRules: true
      }
    });
    
    if (!dbConfig) {
      console.error('No active OnboardingAgent configuration found in database');
      return;
    }
    
    console.log('Database Configuration:');
    console.log('- Version:', dbConfig.version);
    const dbRules = dbConfig.extractionRules as any;
    console.log('- Fields:', Object.keys(dbRules));
    console.log('- Required fields:', Object.entries(dbRules)
      .filter(([_, rule]: [string, any]) => rule.required)
      .map(([field]) => field));
    
    // Check for suggested values
    const fieldsWithSuggestions = Object.entries(dbRules)
      .filter(([_, rule]: [string, any]) => rule.suggestedValues && rule.suggestedValues.length > 0)
      .map(([field, rule]: [string, any]) => ({
        field,
        suggestedValues: rule.suggestedValues
      }));
    
    console.log('\nFields with suggested values:');
    fieldsWithSuggestions.forEach(({ field, suggestedValues }) => {
      console.log(`- ${field}:`, suggestedValues);
    });
    
    // 2. Clear cache and load via AgentConfigLoader
    console.log('\n=== Testing AgentConfigLoader ===\n');
    AgentConfigLoader.clearCache('OnboardingAgent');
    console.log('Cache cleared');
    
    const loadedConfig = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    if (!loadedConfig) {
      console.error('Failed to load configuration via AgentConfigLoader');
      return;
    }
    
    console.log('Loaded Configuration:');
    console.log('- Version:', loadedConfig.version);
    console.log('- Has system prompt:', !!loadedConfig.systemPrompt);
    console.log('- Extraction rules fields:', Object.keys(loadedConfig.extractionRules));
    
    // 3. Verify field consistency
    console.log('\n=== Field Consistency Check ===\n');
    const dbFields = new Set(Object.keys(dbRules));
    const loadedFields = new Set(Object.keys(loadedConfig.extractionRules));
    
    if (dbFields.size === loadedFields.size && 
        [...dbFields].every(field => loadedFields.has(field))) {
      console.log('✅ Fields are consistent between database and loaded config');
    } else {
      console.log('❌ Field mismatch detected!');
      console.log('DB fields:', [...dbFields]);
      console.log('Loaded fields:', [...loadedFields]);
    }
    
    // 4. Check for user_name vs manager_name
    console.log('\n=== Field Name Check ===\n');
    if (dbRules.user_name && !dbRules.manager_name) {
      console.log('✅ Using user_name (correct)');
    } else if (dbRules.manager_name && !dbRules.user_name) {
      console.log('❌ Still using manager_name (needs migration)');
    } else if (dbRules.user_name && dbRules.manager_name) {
      console.log('⚠️  Both user_name and manager_name exist (duplication)');
    }
    
    console.log('\n=== Verification Complete ===');
    
  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyExtractionConfig();