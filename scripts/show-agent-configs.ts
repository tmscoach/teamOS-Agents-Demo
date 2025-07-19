#!/usr/bin/env node

/**
 * Script to display the default agent configurations
 * This shows what SHOULD be in the database
 */

import { SIMPLIFIED_AGENT_CONFIGS } from '../src/lib/agents/config/simplified-agent-configs';

console.log('🔍 Default Agent Configurations\n');
console.log('These are the configurations that SHOULD be in your database:\n');

for (const [agentName, config] of Object.entries(SIMPLIFIED_AGENT_CONFIGS)) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${agentName}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log('\n📝 SYSTEM PROMPT:');
  console.log('-'.repeat(40));
  console.log(config.systemPrompt.substring(0, 500) + '...');
  
  console.log('\n🔄 FLOW CONFIGURATION:');
  console.log('-'.repeat(40));
  if ('states' in config.flowConfig) {
    console.log(`States: ${config.flowConfig.states.map(s => s.name).join(', ')}`);
  }
  
  console.log('\n📊 EXTRACTION RULES:');
  console.log('-'.repeat(40));
  const rules = Object.entries(config.extractionRules);
  rules.forEach(([field, rule]) => {
    console.log(`- ${field}: ${rule.type}${rule.required ? ' (required)' : ''}`);
  });
  
  if (config.guardrailConfig) {
    console.log('\n🛡️ GUARDRAIL CONFIG:');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(config.guardrailConfig, null, 2));
  }
}

console.log('\n\n✅ These configurations are defined in the codebase.');
console.log('❗ If they\'re not showing in the admin UI, it\'s because:');
console.log('   1. The database connection is down');
console.log('   2. The configurations haven\'t been seeded to the database');
console.log('\nTo fix:');
console.log('1. Restore database connection');
console.log('2. Run: npx tsx scripts/seed-agent-configs.ts');