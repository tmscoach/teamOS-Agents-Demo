#!/usr/bin/env tsx
/**
 * Check which report has vision analysis data
 */

import prisma from '@/lib/db';

async function checkVisionReport() {
  try {
    // Find the report with vision analysis
    const reportWithVision = await prisma.userReport.findFirst({
      where: {
        subscriptionId: '21989',
        processingStatus: 'COMPLETED',
        ReportImage: {
          some: {
            detailedDescription: { not: null }
          }
        }
      },
      include: {
        ReportImage: {
          take: 2 // Just show first 2 images
        }
      }
    });
    
    if (reportWithVision) {
      console.log('Report with vision analysis:');
      console.log('- Report ID:', reportWithVision.id);
      console.log('- User ID:', reportWithVision.userId);
      console.log('- Created:', reportWithVision.createdAt);
      console.log('\nSample images with descriptions:');
      
      reportWithVision.ReportImage.forEach((img, idx) => {
        console.log(`\n${idx + 1}. ${img.imageType}:`);
        console.log('   Alt text:', img.altText?.substring(0, 50) + '...');
        console.log('   Description:', img.detailedDescription?.substring(0, 100) + '...');
        console.log('   Has data:', !!img.extractedData);
        console.log('   Has insights:', img.insights?.length || 0);
      });
      
      // Check total image count
      const totalImages = await prisma.reportImage.count({
        where: { reportId: reportWithVision.id }
      });
      console.log(`\nTotal images in report: ${totalImages}`);
    } else {
      console.log('No report found with vision analysis data');
      
      // Check if any images have vision data at all
      const anyVisionImages = await prisma.reportImage.findFirst({
        where: {
          detailedDescription: { not: null }
        }
      });
      
      if (anyVisionImages) {
        console.log('\nFound vision data in report:', anyVisionImages.reportId);
      } else {
        console.log('\nNo images have vision analysis data in the database');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVisionReport();