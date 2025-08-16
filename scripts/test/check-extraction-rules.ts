import prisma from './lib/db';
import { ENHANCED_EXTRACTION_PATTERNS, ADDITIONAL_PATTERNS } from './src/lib/agents/extraction/enhanced-patterns';
import { mergeSuggestedValues } from './src/lib/agents/extraction/merge-suggestions';
import { convertToStandardRules } from './src/lib/agents/extraction/enhanced-patterns';

async function updateExtractionRules() {
  try {
    // Get current config
    const currentConfig = await prisma.agentConfiguration.findFirst({
      where: { agentName: 'OnboardingAgent' },
      orderBy: { version: 'desc' }
    });
    
    if (!currentConfig) {
      console.log('No OnboardingAgent configuration found!');
      return;
    }
    
    // Build the complete extraction rules with ALL fields
    const completeRules = mergeSuggestedValues(
      convertToStandardRules({
        // Core fields with both naming conventions  
        user_name: { ...ENHANCED_EXTRACTION_PATTERNS.manager_name, required: true },
        user_role: { ...ADDITIONAL_PATTERNS.manager_role, required: true },
        team_size: { ...ENHANCED_EXTRACTION_PATTERNS.team_size, required: true },
        primary_challenge: { ...ENHANCED_EXTRACTION_PATTERNS.primary_challenge, required: true },
        // Keep other fields from current config if they exist
        organization: (currentConfig.extractionRules as any).organization || {},
        team_tenure: { ...ENHANCED_EXTRACTION_PATTERNS.team_tenure, required: false },
        success_metrics: { ...ENHANCED_EXTRACTION_PATTERNS.success_metrics, required: false },
        timeline_preference: { ...ENHANCED_EXTRACTION_PATTERNS.timeline_preference, required: false },
        budget_range: { ...ENHANCED_EXTRACTION_PATTERNS.budget_range, required: false },
        leader_commitment: { ...ENHANCED_EXTRACTION_PATTERNS.leader_commitment, required: false }
      })
    );
    
    // Update the configuration
    const updated = await prisma.agentConfiguration.update({
      where: { id: currentConfig.id },
      data: {
        extractionRules: completeRules,
        version: currentConfig.version + 1,
        updatedAt: new Date()
      }
    });
    
    console.log('Successfully updated extraction rules!');
    console.log('New version:', updated.version);
    console.log('Fields now configured:', Object.keys(completeRules));
    
  } catch (error) {
    console.error('Error updating extraction rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExtractionRules();
