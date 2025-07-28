#!/usr/bin/env tsx
/**
 * Check wheel images in the vision report
 */

import prisma from '@/lib/db';

async function checkWheelVision() {
  try {
    // Get all images from the vision report
    const images = await prisma.reportImage.findMany({
      where: {
        reportId: 'e293b36e-f9e5-4e16-a2ef-a6454d01bf6a'
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Total images in vision report: ${images.length}\n`);
    
    images.forEach((img, idx) => {
      console.log(`${idx + 1}. ${img.imageType.toUpperCase()}`);
      console.log('   Alt text:', img.altText?.substring(0, 60) + '...');
      console.log('   Has vision description:', !!img.detailedDescription);
      console.log('   Has extracted data:', !!img.extractedData);
      console.log('   Has insights:', img.insights?.length || 0);
      
      if (img.imageType === 'wheel' && img.detailedDescription) {
        console.log('   Vision description preview:', img.detailedDescription.substring(0, 100) + '...');
      }
      
      if (img.imageType === 'wheel' && img.extractedData) {
        const data = img.extractedData as any;
        console.log('   Extracted sectors:', data.sectors?.length || 0);
      }
      
      console.log('');
    });
    
    // Count wheels with and without vision
    const wheelsWithVision = images.filter(img => 
      img.imageType === 'wheel' && img.detailedDescription
    ).length;
    
    const totalWheels = images.filter(img => img.imageType === 'wheel').length;
    
    console.log(`\nSummary:`);
    console.log(`- Total wheels: ${totalWheels}`);
    console.log(`- Wheels with vision analysis: ${wheelsWithVision}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWheelVision();