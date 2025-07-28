#!/usr/bin/env tsx
/**
 * Trace the exact flow of the search_report_images tool
 */

import prisma from '@/lib/db';

async function traceToolFlow() {
  try {
    const userId = 'cmcujg1nf0000smqd9rtnrfcp';
    const subscriptionId = '21989';
    
    console.log('=== TRACING TOOL FLOW ===\n');
    console.log('Input:');
    console.log('- userId:', userId);
    console.log('- subscriptionId:', subscriptionId);
    
    // Step 1: Find report (exactly as tool does)
    const report = await prisma.userReport.findFirst({
      where: {
        subscriptionId,
        userId,
        processingStatus: 'COMPLETED'
      },
      select: { id: true }
    });
    
    console.log('\nStep 1 - Find report:');
    console.log('- Report ID:', report?.id);
    
    if (!report) return;
    
    // Step 2: Build where clause (exactly as tool does)
    const whereClause: any = {
      reportId: report.id
    };
    
    const query = 'wheel';
    if (query && query.trim()) {
      whereClause.OR = [
        { detailedDescription: { contains: query, mode: 'insensitive' } },
        { altText: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    console.log('\nStep 2 - Where clause:');
    console.log(JSON.stringify(whereClause, null, 2));
    
    // Step 3: Get images (exactly as tool does)
    const images = await prisma.reportImage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('\nStep 3 - Images found:', images.length);
    
    // Step 4: Check first image
    if (images.length > 0) {
      const firstImage = images[0];
      console.log('\nFirst image details:');
      console.log('- ID:', firstImage.id);
      console.log('- Type:', firstImage.imageType);
      console.log('- Alt text:', firstImage.altText);
      console.log('- Has detailed description:', !!firstImage.detailedDescription);
      console.log('- Description value:', firstImage.detailedDescription ? 'Present' : 'NULL');
      
      if (firstImage.detailedDescription) {
        console.log('- Description length:', firstImage.detailedDescription.length);
        console.log('- Description preview:', firstImage.detailedDescription.substring(0, 100) + '...');
      }
      
      // Step 5: Format output (exactly as tool does)
      let output = `Found ${images.length} image${images.length > 1 ? 's' : ''}:\n\n`;
      
      for (const image of images) {
        output += `**${image.imageType.charAt(0).toUpperCase() + image.imageType.slice(1)}**\n`;
        
        if (image.detailedDescription) {
          output += `${image.detailedDescription}\n`;
        } else if (image.altText) {
          output += `${image.altText}\n`;
        }
        
        output += '\n---\n';
      }
      
      console.log('\nStep 5 - Formatted output preview:');
      console.log(output.substring(0, 300) + '...');
    }
    
    // Step 6: Double-check by querying with report ID directly
    console.log('\n=== DOUBLE CHECK ===');
    const directImages = await prisma.reportImage.findMany({
      where: {
        reportId: report.id,
        imageType: 'wheel'
      },
      select: {
        id: true,
        detailedDescription: true
      }
    });
    
    console.log('Direct query results:');
    directImages.forEach((img, idx) => {
      console.log(`${idx + 1}. ID: ${img.id}`);
      console.log(`   Description: ${img.detailedDescription ? img.detailedDescription.substring(0, 50) + '...' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

traceToolFlow();