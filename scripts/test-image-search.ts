#!/usr/bin/env tsx
/**
 * Test the search_report_images tool directly
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';

async function testImageSearch() {
  try {
    const tool = createSearchReportImagesTool();
    
    // Create a mock context similar to what the debrief agent would have
    const context: AgentContext = {
      conversationId: 'test-conv-123',
      userId: 'cmcujg1nf0000smqd9rtnrfcp', // Your actual user ID
      managerId: 'cmcujg1nf0000smqd9rtnrfcp',
      organizationId: 'org-123',
      currentAgent: 'DebriefAgent',
      metadata: {
        userId: 'cmcujg1nf0000smqd9rtnrfcp', // This is what the tool expects
        subscriptionId: '21989',
        reportType: 'TMP'
      },
      userRole: 'user',
      messageHistory: []
    };
    
    console.log('Testing search_report_images tool...\n');
    
    // Test 1: Search for wheel
    console.log('1. Searching for "wheel":');
    const result1 = await tool.execute(
      { query: 'wheel', includeData: true },
      context
    );
    console.log('Success:', result1.success);
    console.log('Output preview:', result1.output?.substring(0, 200) + '...\n');
    
    // Test 2: Search for graph
    console.log('2. Searching for "graph":');
    const result2 = await tool.execute(
      { query: 'graph', imageType: 'graph' },
      context
    );
    console.log('Success:', result2.success);
    console.log('Output preview:', result2.output?.substring(0, 200) + '...\n');
    
    // Test 3: Search for work preferences
    console.log('3. Searching for "work preferences":');
    const result3 = await tool.execute(
      { query: 'work preferences' },
      context
    );
    console.log('Success:', result3.success);
    console.log('Output preview:', result3.output?.substring(0, 200) + '...\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testImageSearch();