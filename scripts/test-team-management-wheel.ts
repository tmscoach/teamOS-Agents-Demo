#!/usr/bin/env tsx
/**
 * Test searching for Team Management Wheel
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';

async function testMainWheelSearch() {
  const tool = createSearchReportImagesTool();
  
  const context: AgentContext = {
    metadata: {
      subscriptionId: '21989',
      userId: 'cmcujg1nf0000smqd9rtnrfcp'
    }
  };
  
  console.log('=== Searching for "Team Management Wheel" ===');
  const result = await tool.execute({
    query: 'Team Management Wheel',
    includeData: true
  }, context);
  
  console.log('Success:', result.success);
  console.log('\nOutput:');
  console.log(result.output);
  
  console.log('\n=== Searching for "main wheel" ===');
  const result2 = await tool.execute({
    query: 'main wheel',
    includeData: true
  }, context);
  
  console.log('Success:', result2.success);
  console.log('\nOutput:');
  console.log(result2.output);
  
  process.exit(0);
}

testMainWheelSearch().catch(console.error);
