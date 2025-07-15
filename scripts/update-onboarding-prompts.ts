/**
 * Update OnboardingAgent prompts to ask one question at a time
 */

import { PrismaClient } from '../lib/generated/prisma';
import { DEFAULT_AGENT_CONFIGS } from '../src/lib/agents/config/default-agent-configs';

const prisma = new PrismaClient();

async function updateOnboardingPrompts() {
  try {
    console.log('Updating OnboardingAgent prompts for better UX...');
    
    // Get the latest active configuration
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
    
    // Get the new prompts from default config
    const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
    const newPrompts = defaultConfig.prompts;
    
    // Update the configuration with new prompts
    await prisma.agentConfiguration.update({
      where: {
        id: config.id
      },
      data: {
        prompts: newPrompts
      }
    });
    
    console.log('Successfully updated prompts to ask one question at a time!');
    console.log('\nNew prompts:');
    console.log('- Greeting:', newPrompts.greeting.substring(0, 100) + '...');
    console.log('- Context Discovery:', newPrompts.context_discovery);
    console.log('- Challenge Exploration:', newPrompts.challenge_exploration);
    
  } catch (error) {
    console.error('Error updating prompts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateOnboardingPrompts();