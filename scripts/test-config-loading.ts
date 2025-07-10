#!/usr/bin/env tsx
/**
 * Script to test that agent configurations are properly loaded
 */

import { AgentConfigLoader } from '../src/lib/agents/config/agent-config-loader';
import { createOrchestratorAgent, createOnboardingAgent } from '../src/lib/agents/implementations';
import { AgentContext } from '../src/lib/agents/types';

async function testConfigLoading() {
  console.log('Testing Agent Configuration Loading...\n');

  // Test 1: Load configuration directly
  console.log('1. Testing direct configuration loading:');
  const agentNames = ['OrchestratorAgent', 'OnboardingAgent'];
  
  for (const agentName of agentNames) {
    console.log(`\n   Loading config for ${agentName}...`);
    const config = await AgentConfigLoader.loadConfiguration(agentName);
    
    if (config) {
      console.log(`   ✓ Configuration loaded for ${agentName}`);
      console.log(`     - Version: ${config.version}`);
      console.log(`     - Has systemPrompt: ${!!config.systemPrompt}`);
      console.log(`     - SystemPrompt preview: ${config.systemPrompt?.substring(0, 100)}...`);
      console.log(`     - Has flowConfig: ${!!config.flowConfig}`);
      console.log(`     - Has extractionRules: ${!!config.extractionRules}`);
    } else {
      console.log(`   ✗ No configuration found for ${agentName} (will use defaults)`);
    }
  }

  // Test 2: Create agents and check if they load configurations
  console.log('\n\n2. Testing configuration loading in agent instances:');
  
  // Create test context
  const testContext: AgentContext = {
    teamId: 'test-team-123',
    managerId: 'test-manager-123',
    conversationId: 'test-conv-123',
    transformationPhase: 'onboarding',
    messageHistory: [],
    metadata: {},
    assessmentResults: {}
  };

  // Test OrchestratorAgent
  console.log('\n   Creating OrchestratorAgent...');
  const orchestrator = createOrchestratorAgent();
  
  // Give it a moment to load config
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Process a test message to trigger config loading
  const orchResponse = await orchestrator.processMessage('Hello, I need help with team transformation', testContext);
  console.log('   ✓ OrchestratorAgent created and processed message');
  console.log(`     - Response preview: ${orchResponse.message.substring(0, 100)}...`);

  // Test OnboardingAgent
  console.log('\n   Creating OnboardingAgent...');
  const onboarding = createOnboardingAgent();
  
  // Give it a moment to load config
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Process a test message
  const onbResponse = await onboarding.processMessage('Hi, I want to start the onboarding process', testContext);
  console.log('   ✓ OnboardingAgent created and processed message');
  console.log(`     - Response preview: ${onbResponse.message.substring(0, 100)}...`);

  // Test 3: Test cache behavior
  console.log('\n\n3. Testing configuration cache:');
  
  // Clear cache
  AgentConfigLoader.clearCache();
  console.log('   ✓ Cache cleared');
  
  // Load again and measure time
  const startTime = Date.now();
  await AgentConfigLoader.loadConfiguration('OrchestratorAgent');
  const firstLoadTime = Date.now() - startTime;
  console.log(`   ✓ First load took ${firstLoadTime}ms`);
  
  // Load again (should be cached)
  const cacheStartTime = Date.now();
  await AgentConfigLoader.loadConfiguration('OrchestratorAgent');
  const cachedLoadTime = Date.now() - cacheStartTime;
  console.log(`   ✓ Cached load took ${cachedLoadTime}ms`);
  console.log(`   ✓ Cache speedup: ${Math.round(firstLoadTime / cachedLoadTime)}x faster`);

  console.log('\n✅ Configuration loading test completed!');
}

// Run the test
testConfigLoading().catch(console.error);