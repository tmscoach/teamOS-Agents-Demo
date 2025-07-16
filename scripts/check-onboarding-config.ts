import prisma from '@/lib/db';

async function checkOnboardingConfig() {
  try {
    const config = await prisma.agentConfiguration.findFirst({
      where: {
        agentName: 'OnboardingAgent',
        active: true
      },
      select: {
        agentName: true,
        version: true,
        active: true,
        prompts: true,
        extractionRules: true
      }
    });

    if (config) {
      console.log('=== OnboardingAgent Configuration ===');
      console.log('Agent Name:', config.agentName);
      console.log('Version:', config.version);
      console.log('Active:', config.active);
      const prompts = config.prompts as any;
      console.log('\nSystem Prompt:', prompts?.systemPrompt ? 
        prompts.systemPrompt.substring(0, 200) + '...' : 
        'Not set in prompts.systemPrompt'
      );
      console.log('\nPrompts:', config.prompts);
      console.log('\nExtraction Rules:', JSON.stringify(config.extractionRules, null, 2));
    } else {
      console.log('No active configuration found for OnboardingAgent');
    }
  } catch (error) {
    console.error('Error checking configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOnboardingConfig();