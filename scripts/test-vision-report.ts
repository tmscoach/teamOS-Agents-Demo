#!/usr/bin/env tsx
/**
 * Test searching the specific report with vision analysis
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';
import prisma from '@/lib/db';

async function testVisionReport() {
  try {
    // First, let's manually check what's in the report with vision
    const visionReport = await prisma.userReport.findUnique({
      where: { id: 'e293b36e-f9e5-4e16-a2ef-a6454d01bf6a' },
      include: {
        ReportImage: {
          where: {
            detailedDescription: { not: null }
          },
          take: 3
        }
      }
    });
    
    if (!visionReport) {
      console.log('Vision report not found!');
      return;
    }
    
    console.log('Vision Report Details:');
    console.log('- ID:', visionReport.id);
    console.log('- User ID:', visionReport.userId);
    console.log('- Subscription ID:', visionReport.subscriptionId);
    console.log('- Status:', visionReport.processingStatus);
    console.log('\nSample images with vision analysis:');
    
    visionReport.ReportImage.forEach((img, idx) => {
      console.log(`\n${idx + 1}. ${img.imageType.toUpperCase()}`);
      console.log('Description:', img.detailedDescription?.substring(0, 150) + '...');
      if (img.extractedData) {
        console.log('Extracted data:', JSON.stringify(img.extractedData).substring(0, 100) + '...');
      }
    });
    
    // Now test the tool with the correct context
    const tool = createSearchReportImagesTool();
    
    const context: AgentContext = {
      conversationId: 'test-conv-123',
      userId: visionReport.userId,
      managerId: visionReport.userId,
      organizationId: 'org-123',
      currentAgent: 'DebriefAgent',
      metadata: {
        userId: visionReport.userId,
        subscriptionId: visionReport.subscriptionId,
        reportType: 'TMP'
      },
      userRole: 'user',
      messageHistory: []
    };
    
    console.log('\n\nTesting tool with vision report context...');
    console.log('Using subscription ID:', visionReport.subscriptionId);
    
    const result = await tool.execute(
      { query: 'wheel', includeData: true },
      context
    );
    
    console.log('\nTool result:');
    console.log('Success:', result.success);
    if (result.success && result.output) {
      // Check if we got vision descriptions
      const hasVisionContent = result.output.includes('horizontal bar graph') || 
                              result.output.includes('circular chart') ||
                              result.output.includes('blue circle');
      console.log('Has vision content:', hasVisionContent);
      console.log('\nFull output:');
      console.log(result.output);
    } else {
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVisionReport();