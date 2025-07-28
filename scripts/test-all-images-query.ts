#!/usr/bin/env tsx
/**
 * Test the "all images" query logic
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';

async function testAllImagesQuery() {
  try {
    const tool = createSearchReportImagesTool();
    
    const context: AgentContext = {
      conversationId: 'test-all-images',
      userId: 'cmcujg1nf0000smqd9rtnrfcp',
      managerId: 'cmcujg1nf0000smqd9rtnrfcp',
      organizationId: 'test-org',
      currentAgent: 'DebriefAgent',
      metadata: {
        userId: 'cmcujg1nf0000smqd9rtnrfcp',
        subscriptionId: '21989',
        reportType: 'TMP'
      },
      userRole: 'user',
      messageHistory: []
    };
    
    console.log('=== TESTING "ALL IMAGES" QUERY ===\n');
    
    // This is what the agent is sending
    const result = await tool.execute(
      { query: 'all images', includeData: true },
      context
    );
    
    console.log('Result:');
    console.log('- Success:', result.success);
    console.log('- Error:', result.error);
    
    if (result.success && result.output) {
      // Count how many images were returned
      const imageCount = (result.output.match(/\*\*Wheel\*\*|\*\*Graph\*\*|\*\*Asset\*\*/g) || []).length;
      console.log('- Images returned:', imageCount);
      
      // Check if we got vision descriptions
      const hasVision = result.output.includes('Team Management Wheel') || 
                       result.output.includes('horizontal bar') ||
                       result.output.includes('sectors');
      console.log('- Has vision descriptions:', hasVision);
      
      if (imageCount > 0) {
        console.log('\nFirst 500 chars of output:');
        console.log(result.output.substring(0, 500) + '...');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAllImagesQuery();