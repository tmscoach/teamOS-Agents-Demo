#!/usr/bin/env tsx
/**
 * Check report dates and content
 */

import prisma from '@/lib/db';

async function checkReportDates() {
  try {
    // Check all images for report d4749667-229c-41e1-a24c-33ff2df3c80b
    const allImages = await prisma.reportImage.findMany({
      where: {
        reportId: 'd4749667-229c-41e1-a24c-33ff2df3c80b'
      },
      select: {
        imageType: true,
        altText: true,
        detailedDescription: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log('Total images in report:', allImages.length);
    console.log('\n--- All Images ---');
    
    allImages.forEach((img, idx) => {
      console.log(`\n[${idx + 1}] ${img.imageType}`);
      console.log('Alt:', img.altText || 'N/A');
      const desc = img.detailedDescription || 'N/A';
      console.log('Description preview:', desc.substring(0, 100) + (desc.length > 100 ? '...' : ''));
    });
    
    // Check for "distribution" in any field
    console.log('\n\n=== Checking for "distribution" ===');
    const distImages = await prisma.reportImage.findMany({
      where: {
        reportId: 'd4749667-229c-41e1-a24c-33ff2df3c80b',
        OR: [
          { altText: { contains: 'distribution', mode: 'insensitive' } },
          { detailedDescription: { contains: 'distribution', mode: 'insensitive' } }
        ]
      },
      select: {
        imageType: true,
        altText: true,
        detailedDescription: true
      }
    });
    
    console.log('Found images with "distribution":', distImages.length);
    distImages.forEach(img => {
      console.log(`\n- ${img.imageType}: ${img.altText}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReportDates();