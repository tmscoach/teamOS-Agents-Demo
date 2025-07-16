#!/usr/bin/env ts-node
/**
 * Check extraction configuration for OnboardingAgent
 */

import { AgentConfigLoader } from '@/src/lib/agents/config/agent-config-loader';
import { DEFAULT_AGENT_CONFIGS } from '@/src/lib/agents/config/default-agent-configs';

async function checkExtractionConfig() {
  console.log('=== OnboardingAgent Extraction Configuration Check ===\n');

  // 1. Check default configuration
  console.log('1. DEFAULT CONFIGURATION:');
  const defaultConfig = DEFAULT_AGENT_CONFIGS.OnboardingAgent;
  const defaultExtractionRules = defaultConfig.extractionRules;
  
  const defaultRequiredFields = Object.entries(defaultExtractionRules)
    .filter(([_, rule]: [string, any]) => rule.required === true)
    .map(([field, _]) => field);
  
  console.log('Default required fields:', defaultRequiredFields);
  console.log('Total default extraction rules:', Object.keys(defaultExtractionRules).length);
  
  // Show configured required fields from flowConfig
  const flowConfigRequiredFields = defaultConfig.flowConfig.requiredFields || [];
  console.log('Flow config required fields:', flowConfigRequiredFields);
  
  // 2. Try to load from database
  console.log('\n2. DATABASE CONFIGURATION:');
  try {
    const dbConfig = await AgentConfigLoader.loadConfiguration('OnboardingAgent');
    if (dbConfig && dbConfig.extractionRules) {
      const dbRequiredFields = Object.entries(dbConfig.extractionRules)
        .filter(([_, rule]: [string, any]) => rule.required === true)
        .map(([field, _]) => field);
      
      console.log('Database required fields:', dbRequiredFields);
      console.log('Total database extraction rules:', Object.keys(dbConfig.extractionRules).length);
    } else {
      console.log('No database configuration found');
    }
  } catch (error) {
    console.log('Error loading database config:', error);
  }
  
  // 3. Show field name mappings
  console.log('\n3. FIELD NAME MAPPINGS:');
  console.log('user_name <-> manager_name (aliases)');
  console.log('user_role <-> manager_role (aliases)');
  
  // 4. Show extraction patterns for key fields
  console.log('\n4. KEY FIELD PATTERNS:');
  const keyFields = ['user_name', 'user_role', 'team_size', 'organization', 'primary_challenge'];
  
  for (const field of keyFields) {
    const rule = defaultExtractionRules[field];
    if (rule) {
      console.log(`\n${field}:`)
      console.log('  Type:', rule.type);
      console.log('  Required:', rule.required);
      console.log('  Patterns:', rule.patterns?.slice(0, 3) || 'N/A');
      console.log('  Suggested values:', rule.suggestedValues || 'None');
    }
  }
}

checkExtractionConfig().catch(console.error);