#!/usr/bin/env tsx
/**
 * Test the tool directly with exact parameters
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';
import prisma from '@/lib/db';

async function testToolDirect() {
  try {
    const tool = createSearchReportImagesTool();
    
    // Create exact context
    const context: AgentContext = {
      conversationId: 'test-direct',
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
    
    console.log('=== DIRECT TOOL TEST ===\n');
    console.log('Context metadata:', context.metadata);
    
    // Execute the tool
    const result = await tool.execute(
      { query: 'wheel', includeData: true },
      context
    );
    
    console.log('\nResult:');
    console.log('Success:', result.success);
    console.log('Error:', result.error);
    console.log('\nOutput:');
    console.log(result.output);
    
    // Also check the database directly
    console.log('\n=== DATABASE CHECK ===');
    const report = await prisma.userReport.findFirst({
      where: {
        subscriptionId: '21989',
        userId: 'cmcujg1nf0000smqd9rtnrfcp',
        processingStatus: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ReportImage: {
          where: {
            imageType: 'wheel'
          },
          take: 1
        }
      }
    });
    
    if (report && report.ReportImage.length > 0) {
      const wheel = report.ReportImage[0];
      console.log('\nFirst wheel in database:');
      console.log('- Has description:', !!wheel.detailedDescription);
      console.log('- Description length:', wheel.detailedDescription?.length || 0);
      console.log('- Description preview:', wheel.detailedDescription?.substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testToolDirect();