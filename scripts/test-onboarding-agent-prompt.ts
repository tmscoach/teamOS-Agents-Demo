#!/usr/bin/env tsx
/**
 * Test to verify OnboardingAgent is using the configured system prompt
 */

import { createOnboardingAgent } from '../src/lib/agents/implementations';
import { AgentContext } from '../src/lib/agents/types';
import { AgentConfigLoader } from '../src/lib/agents/config/agent-config-loader';

async function testOnboardingPrompt() {
  console.log('Testing OnboardingAgent System Prompt\n');

  // Clear cache to ensure fresh load
  AgentConfigLoader.clearCache('OnboardingAgent');

  // Create agent instance
  const agent = createOnboardingAgent();

  // Wait for configuration to load
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create test context
  const context: AgentContext = {
    conversationId: 'test-prompt-check',
    teamId: 'team-test',
    userId: 'user-test',
    currentAgent: 'OnboardingAgent',
    messageHistory: [],
    metadata: {},
    transformationPhase: 'discovery'
  };

  // Process a test message
  console.log('Sending test message to OnboardingAgent...\n');
  const response = await agent.processMessage('Hello, I need help with my team', context);

  console.log('Agent Response:');
  console.log('-'.repeat(60));
  console.log(response.message);
  console.log('-'.repeat(60));

  // Check response characteristics
  if (response.message.toLowerCase().includes('team development') || 
      response.message.toLowerCase().includes('teamos') ||
      response.message.toLowerCase().includes('5-minute')) {
    console.log('\n✅ SUCCESS: Agent appears to be using the configured system prompt!');
  } else {
    console.log('\n⚠️  WARNING: Response may not be using the configured prompt');
  }

  // Also check the loaded configuration
  const loadedConfig = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
  if (loadedConfig) {
    console.log('\nLoaded Configuration:');
    console.log('Version:', loadedConfig.version);
    console.log('System prompt preview:', loadedConfig.prompts.system?.substring(0, 100) + '...');
  }
}

testOnboardingPrompt().catch(console.error);