#!/usr/bin/env ts-node

/**
 * Test script to verify agent configuration loading
 */

import { AgentConfigurationService } from '../src/lib/services/agent-configuration';
import { AgentConfigLoader } from '../src/lib/agents/config/agent-config-loader';
import prisma from '../lib/db';

async function testAgentConfiguration() {
  console.log('🧪 Testing Agent Configuration System\n');

  try {
    // 1. Create a test configuration for OnboardingAgent
    console.log('1. Creating test configuration for OnboardingAgent...');
    
    const testConfig = await AgentConfigurationService.createConfiguration({
      agentName: 'OnboardingAgent',
      prompts: {
        system: 'You are a helpful onboarding assistant for the TMS platform.',
        greeting: 'Welcome! I\'m excited to help you get started with TMS.',
        context_discovery: 'Tell me about your team and what brings you here today.',
        readiness_check: 'Let\'s check if your team is ready for transformation.',
        goal_setting: 'What would success look like for your team?',
        information_gathering: 'I need some key information about your team.',
        closing: 'Thank you for this conversation. Let me connect you with the right resources.'
      },
      flowConfig: {
        states: ['greeting', 'context_discovery', 'readiness_check', 'goal_setting', 'information_gathering', 'closing'],
        transitions: {
          greeting: ['context_discovery'],
          context_discovery: ['readiness_check'],
          readiness_check: ['goal_setting'],
          goal_setting: ['information_gathering'],
          information_gathering: ['closing']
        }
      },
      extractionRules: {
        team_size: { type: 'number', pattern: '\\d+' },
        team_tenure: { type: 'string', pattern: '.*' },
        primary_challenge: { type: 'string', pattern: '.*' }
      },
      createdBy: 'test-script'
    });

    console.log(`✅ Created configuration version ${testConfig.version}\n`);

    // 2. Test loading configuration
    console.log('2. Testing configuration loader...');
    const loadedConfig = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    
    if (loadedConfig) {
      console.log('✅ Loaded configuration:');
      console.log(`   Version: ${loadedConfig.version}`);
      console.log(`   Prompts: ${Object.keys(loadedConfig.prompts).length} prompts defined`);
      console.log(`   System prompt preview: "${loadedConfig.prompts.system?.substring(0, 50)}..."`);
    } else {
      console.log('❌ Failed to load configuration');
    }

    // 3. Test caching
    console.log('\n3. Testing configuration caching...');
    const start = Date.now();
    await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    const cachedTime = Date.now() - start;
    console.log(`✅ Cached load time: ${cachedTime}ms`);

    // 4. Clear cache and reload
    console.log('\n4. Testing cache clearing...');
    AgentConfigLoader.clearCache('OnboardingAgent');
    const start2 = Date.now();
    await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    const uncachedTime = Date.now() - start2;
    console.log(`✅ Uncached load time: ${uncachedTime}ms`);

    // 5. Get all configurations
    console.log('\n5. Getting all agent configurations...');
    const allConfigs = await AgentConfigurationService.getAllAgentConfigurations();
    console.log(`✅ Found ${allConfigs.length} agent configurations:`);
    allConfigs.forEach(config => {
      console.log(`   - ${config.agentName}: v${config.activeVersion} (${config.totalVersions} versions)`);
    });

    // 6. Test default prompts
    console.log('\n6. Testing default prompts for unconfigured agent...');
    const defaultPrompts = AgentConfigLoader.getDefaultPrompts('DiscoveryAgent');
    console.log(`✅ Default prompts for DiscoveryAgent:`);
    console.log(`   System: "${defaultPrompts.system?.substring(0, 50)}..."`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAgentConfiguration().catch(console.error);