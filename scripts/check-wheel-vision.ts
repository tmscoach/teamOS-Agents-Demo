#!/usr/bin/env tsx
/**
 * Check wheel image vision data
 */

import prisma from '@/lib/db';

async function checkWheelVision() {
  try {
    const images = await prisma.reportImage.findMany({
      where: {
        reportId: 'd4749667-229c-41e1-a24c-33ff2df3c80b',
        OR: [
          { altText: { contains: 'preference', mode: 'insensitive' } },
          { detailedDescription: { contains: 'preference', mode: 'insensitive' } }
        ]
      },
      select: {
        imageType: true,
        altText: true,
        detailedDescription: true,
        extractedData: true
      }
    });
    
    console.log('Found images with "preference":', images.length);
    
    for (const img of images) {
      console.log('\n--- Image ---');
      console.log('Type:', img.imageType);
      console.log('Alt:', img.altText);
      console.log('Description:', img.detailedDescription?.substring(0, 200) + '...');
      if (img.extractedData) {
        console.log('Data:', JSON.stringify(img.extractedData, null, 2).substring(0, 300) + '...');
      }
    }
    
    // Also check for "Work Preference Distribution" specifically
    console.log('\n\n=== Checking for "Work Preference Distribution" ===');
    const workPrefImages = await prisma.reportImage.findMany({
      where: {
        reportId: 'd4749667-229c-41e1-a24c-33ff2df3c80b',
        OR: [
          { altText: { contains: 'Work Preference Distribution', mode: 'insensitive' } },
          { detailedDescription: { contains: 'Work Preference Distribution', mode: 'insensitive' } }
        ]
      },
      select: {
        imageType: true,
        altText: true,
        detailedDescription: true
      }
    });
    
    console.log('Found images with "Work Preference Distribution":', workPrefImages.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWheelVision();