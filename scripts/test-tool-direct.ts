#!/usr/bin/env tsx
/**
 * Test search_report_images tool directly
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';

async function testSearchTool() {
  const tool = createSearchReportImagesTool();
  
  // Create context matching the debrief agent's context
  const context: AgentContext = {
    metadata: {
      subscriptionId: '21989',
      userId: 'cmcujg1nf0000smqd9rtnrfcp'
    }
  };
  
  console.log('Testing search_report_images tool...\n');
  
  // Test 1: Search for "Work Preference Distribution"
  console.log('=== Test 1: Searching for "Work Preference Distribution" ===');
  const result1 = await tool.execute({
    query: 'Work Preference Distribution',
    includeData: true
  }, context);
  console.log('Success:', result1.success);
  console.log('Output:', result1.output);
  
  // Test 2: Search for just "distribution"
  console.log('\n=== Test 2: Searching for "distribution" ===');
  const result2 = await tool.execute({
    query: 'distribution',
    includeData: true
  }, context);
  console.log('Success:', result2.success);
  console.log('Output:', result2.output?.substring(0, 300) + '...');
  
  // Test 3: Search for "wheel"
  console.log('\n=== Test 3: Searching for "wheel" ===');
  const result3 = await tool.execute({
    query: 'wheel',
    includeData: true
  }, context);
  console.log('Success:', result3.success);
  console.log('Output:', result3.output?.substring(0, 300) + '...');
  
  // Test 4: Search for all images
  console.log('\n=== Test 4: Searching for all images ===');
  const result4 = await tool.execute({
    query: 'all images',
    includeData: false
  }, context);
  console.log('Success:', result4.success);
  console.log('Output length:', result4.output?.length);
  
  process.exit(0);
}

testSearchTool().catch(console.error);