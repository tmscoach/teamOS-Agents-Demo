#!/usr/bin/env node

import { createOnboardingAgent } from '../src/lib/agents/implementations/knowledge-enabled-agent';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAgentWithKnowledgeBase() {
  console.log('🤖 Testing Agent with Knowledge Base\n');
  
  // Create an onboarding agent with KB access
  const agent = createOnboardingAgent();
  
  console.log('Agent tools available:');
  agent.tools.forEach(tool => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
  
  // Test queries (these will fail until embeddings are added)
  const testQueries = [
    'What is TMP methodology?',
    'How do I assess team maturity?',
    'What are the key components of QO2?'
  ];
  
  console.log('\n📝 Test queries ready for when KB is complete:');
  testQueries.forEach(q => console.log(`- ${q}`));
  
  console.log('\n✅ Agent framework is ready!');
  console.log('Once ingestion completes, we need to:');
  console.log('1. Add embeddings to chunks');
  console.log('2. Test the search functionality');
  console.log('3. Verify agent responses use KB context');
}

testAgentWithKnowledgeBase().catch(console.error);