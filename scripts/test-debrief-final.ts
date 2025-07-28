#!/usr/bin/env tsx
/**
 * Final test script to verify debrief agent can access vision-analyzed images
 */

import { createSearchReportImagesTool } from '@/src/lib/agents/tools/search-report-images';
import { AgentContext } from '@/src/lib/agents/types';
import prisma from '@/lib/db';

async function testDebriefFinal() {
  try {
    console.log('=== FINAL DEBRIEF AGENT TEST ===\n');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'rowan@teammanagementsystems.com' }
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User:', user.email);
    console.log('User ID:', user.id);
    console.log('Clerk ID:', user.clerkId);
    
    // Get the latest report with vision analysis
    const latestVisionReport = await prisma.userReport.findFirst({
      where: {
        userId: user.id,
        subscriptionId: '21989',
        processingStatus: 'COMPLETED',
        ReportImage: {
          some: {
            detailedDescription: { not: null }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        ReportImage: {
          where: {
            detailedDescription: { not: null }
          },
          take: 2
        }
      }
    });
    
    if (!latestVisionReport) {
      console.log('No report with vision analysis found!');
      return;
    }
    
    console.log('\nReport with vision analysis:');
    console.log('- Report ID:', latestVisionReport.id);
    console.log('- Created:', latestVisionReport.createdAt);
    console.log('- Has vision images:', latestVisionReport.ReportImage.length > 0);
    
    // Create context similar to debrief agent
    const context: AgentContext = {
      conversationId: 'test-final-123',
      userId: user.id,
      managerId: user.id,
      organizationId: 'test-org',
      currentAgent: 'DebriefAgent',
      metadata: {
        userId: user.id,
        subscriptionId: '21989',
        reportType: 'TMP',
        reportId: latestVisionReport.id
      },
      userRole: 'user',
      messageHistory: []
    };
    
    // Test the search_report_images tool
    const tool = createSearchReportImagesTool();
    
    console.log('\n=== TESTING IMAGE SEARCH ===');
    
    // Test 1: Search for wheel
    console.log('\n1. Testing "describe my wheel":');
    const wheelResult = await tool.execute(
      { query: 'wheel', includeData: true },
      context
    );
    
    if (wheelResult.success) {
      const hasVisionContent = wheelResult.output?.includes('Team Management Wheel') && 
                              (wheelResult.output?.includes('divided into eight sectors') ||
                               wheelResult.output?.includes('work preferences') ||
                               wheelResult.output?.includes('percentages'));
      console.log('✅ Success:', hasVisionContent ? 'WITH vision descriptions' : 'NO vision descriptions');
      
      if (hasVisionContent) {
        console.log('\nSample output:');
        console.log(wheelResult.output?.substring(0, 300) + '...');
      }
    } else {
      console.log('❌ Failed:', wheelResult.error);
    }
    
    // Test 2: Search for graphs
    console.log('\n2. Testing "what do the graphs show":');
    const graphResult = await tool.execute(
      { query: 'graph', imageType: 'graph', includeData: true },
      context
    );
    
    if (graphResult.success) {
      const hasVisionContent = graphResult.output?.includes('horizontal bar') || 
                              graphResult.output?.includes('scale ranging') ||
                              graphResult.output?.includes('measures');
      console.log('✅ Success:', hasVisionContent ? 'WITH vision descriptions' : 'NO vision descriptions');
      
      if (hasVisionContent) {
        console.log('\nSample output:');
        console.log(graphResult.output?.substring(0, 300) + '...');
      }
    } else {
      console.log('❌ Failed:', graphResult.error);
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('The debrief agent should now be able to:');
    console.log('1. Answer "describe my wheel" with detailed vision analysis');
    console.log('2. Answer "what do the graphs show" with specific data points');
    console.log('3. Extract percentages and patterns from visual elements');
    console.log('\nMake sure to test with subscription ID 21989 in the debrief interface!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDebriefFinal();