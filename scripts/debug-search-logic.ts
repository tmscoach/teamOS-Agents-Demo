#!/usr/bin/env tsx
/**
 * Debug the search logic in search_report_images
 */

import prisma from '@/lib/db';

async function debugSearchLogic() {
  try {
    const userId = 'cmcujg1nf0000smqd9rtnrfcp';
    const subscriptionId = '21989';
    
    console.log('=== DEBUG SEARCH LOGIC ===\n');
    console.log('User ID:', userId);
    console.log('Subscription ID:', subscriptionId);
    
    // Step 1: Find the report
    const report = await prisma.userReport.findFirst({
      where: {
        subscriptionId,
        userId,
        processingStatus: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: { 
        id: true,
        createdAt: true
      }
    });
    
    console.log('\nReport found:', report ? `${report.id} (created ${report.createdAt})` : 'None');
    
    if (!report) {
      console.log('\nChecking all reports for this subscription...');
      const allReports = await prisma.userReport.findMany({
        where: { subscriptionId },
        select: {
          id: true,
          userId: true,
          processingStatus: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      
      allReports.forEach(r => {
        console.log(`- ${r.id}: user=${r.userId}, status=${r.processingStatus}, created=${r.createdAt}`);
      });
      return;
    }
    
    // Step 2: Check images in this report
    const images = await prisma.reportImage.findMany({
      where: {
        reportId: report.id
      },
      select: {
        id: true,
        imageType: true,
        altText: true,
        detailedDescription: true
      }
    });
    
    console.log(`\nImages in report: ${images.length}`);
    
    const wheelsWithVision = images.filter(img => 
      img.imageType === 'wheel' && img.detailedDescription
    );
    
    const graphsWithVision = images.filter(img => 
      img.imageType === 'graph' && img.detailedDescription
    );
    
    console.log(`- Wheels with vision: ${wheelsWithVision.length}`);
    console.log(`- Graphs with vision: ${graphsWithVision.length}`);
    
    // Step 3: Test the actual search query
    console.log('\n=== TESTING SEARCH QUERIES ===');
    
    // Test wheel search
    const wheelSearch = await prisma.reportImage.findMany({
      where: {
        reportId: report.id,
        OR: [
          { detailedDescription: { contains: 'wheel', mode: 'insensitive' } },
          { altText: { contains: 'wheel', mode: 'insensitive' } }
        ]
      },
      select: {
        imageType: true,
        altText: true,
        detailedDescription: true
      }
    });
    
    console.log(`\nWheel search results: ${wheelSearch.length}`);
    wheelSearch.forEach((img, idx) => {
      console.log(`${idx + 1}. ${img.imageType}: ${img.altText?.substring(0, 50)}...`);
      console.log(`   Has vision: ${!!img.detailedDescription}`);
    });
    
    // Check if this is the vision report
    const isVisionReport = report.id === 'e293b36e-f9e5-4e16-a2ef-a6454d01bf6a';
    console.log(`\n=== REPORT CHECK ===`);
    console.log(`Is this the vision report? ${isVisionReport ? 'YES' : 'NO'}`);
    console.log(`Expected: e293b36e-f9e5-4e16-a2ef-a6454d01bf6a`);
    console.log(`Actual:   ${report.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSearchLogic();