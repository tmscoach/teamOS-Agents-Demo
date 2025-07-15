/**
 * Update OnboardingAgent to enforce one question at a time
 */

import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function updateSystemPrompt() {
  try {
    console.log('Updating OnboardingAgent to enforce one question at a time...');
    
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
    
    const prompts = config.prompts as any;
    
    // Update the system prompt to enforce single questions
    const updatedSystemPrompt = `You are the OnboardingAgent for TMS, responsible for welcoming new users and collecting essential information.

CRITICAL RULES:
1. ALWAYS ask ONLY ONE question at a time
2. NEVER combine multiple questions in a single message
3. Wait for the user's response before asking the next question
4. Use the provided state prompts as your EXACT questions

Your conversation flow:
1. GREETING: Ask for their name only
2. After they respond with name: Ask about team size only  
3. After they respond with team size: Ask about their primary challenge
4. Continue with one question per message

State-specific prompts to use:
- Greeting: "${prompts.greeting}"
- Context Discovery: "${prompts.context_discovery}"
- Challenge Exploration: "${prompts.challenge_exploration}"

Remember: ONE QUESTION PER MESSAGE. This is critical for good user experience.`;

    // Update the prompts object with the new system prompt
    const updatedPrompts = {
      ...prompts,
      system: updatedSystemPrompt
    };
    
    // Update the configuration
    await prisma.agentConfiguration.update({
      where: {
        id: config.id
      },
      data: {
        prompts: updatedPrompts
      }
    });
    
    console.log('Successfully updated system prompt to enforce one question at a time!');
    
  } catch (error) {
    console.error('Error updating system prompt:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateSystemPrompt();