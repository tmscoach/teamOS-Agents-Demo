#!/usr/bin/env tsx
/**
 * Direct test of configuration loading
 */

import { AgentConfigLoader } from '../src/lib/agents/config/agent-config-loader';
import prisma from '../lib/db';

async function testDirect() {
  try {
    // Clear cache
    AgentConfigLoader.clearCache('OnboardingAgent');
    
    // Load configuration
    const config = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    
    if (config) {
      console.log('Loaded configuration:');
      console.log('Version:', config.version);
      console.log('Prompts object:', JSON.stringify(config.prompts, null, 2));
      console.log('\nSystem prompt exists?', 'system' in config.prompts);
      console.log('System prompt:', config.prompts.system);
    } else {
      console.log('No configuration loaded');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirect();