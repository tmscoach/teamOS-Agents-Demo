#\!/usr/bin/env tsx

import { AgentConfigLoader } from '../src/lib/agents/config/agent-config-loader';

async function checkConfig() {
  const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
  console.log('Loaded config has systemPrompt:', Boolean(config?.systemPrompt));
  if (config?.systemPrompt) {
    console.log('System prompt length:', config.systemPrompt.length);
    console.log('System prompt preview:', config.systemPrompt.substring(0, 200) + '...');
  }
  if (config?.prompts) {
    console.log('\nConfig has prompts:', Object.keys(config.prompts));
  }
}

checkConfig().catch(console.error);
EOF < /dev/null