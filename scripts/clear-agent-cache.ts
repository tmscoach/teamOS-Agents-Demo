import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';
import prisma from '@/lib/db';

async function clearAgentCache() {
  try {
    console.log('Clearing agent configuration cache...');
    
    // Clear cache for OnboardingAgent
    AgentConfigLoader.clearCache('OnboardingAgent');
    console.log('Cleared OnboardingAgent cache');
    
    // Clear cache for all other agents
    const agents = [
      'OrchestratorAgent',
      'DiscoveryAgent',
      'AssessmentAgent',
      'AlignmentAgent',
      'LearningAgent',
      'NudgeAgent',
      'ProgressMonitor',
      'RecognitionAgent'
    ];
    
    for (const agent of agents) {
      AgentConfigLoader.clearCache(agent);
      console.log(`Cleared ${agent} cache`);
    }
    
    // Verify current database version
    const config = await prisma.agentConfiguration.findFirst({
      where: {
        agentName: 'OnboardingAgent',
        active: true
      },
      select: {
        version: true,
        extractionRules: true
      }
    });
    
    if (config) {
      console.log('\nCurrent database version:', config.version);
      console.log('Extraction rules fields:', Object.keys(config.extractionRules as any));
    }
    
    console.log('\nCache cleared successfully. The next request will load fresh configuration from database.');
  } catch (error) {
    console.error('Error clearing cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAgentCache();