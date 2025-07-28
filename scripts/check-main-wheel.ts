#!/usr/bin/env tsx
/**
 * Check if the main wheel image is stored
 */

import prisma from '@/lib/db';

async function checkMainWheel() {
  try {
    const mainWheelUrl = 'https://api-test.tms.global//GetGraph?CreateTMPQWheel&mr=8&rr1=7&rr2=5';
    
    console.log('=== CHECKING MAIN WHEEL IMAGE ===\n');
    console.log('Looking for URL:', mainWheelUrl);
    
    // Check if this image exists in any report
    const images = await prisma.reportImage.findMany({
      where: {
        originalUrl: {
          contains: 'CreateTMPQWheel&mr=8&rr1=7&rr2=5'
        }
      },
      include: {
        UserReport: {
          select: {
            id: true,
            subscriptionId: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`\nFound ${images.length} images with this URL`);
    
    if (images.length > 0) {
      images.forEach((img, idx) => {
        console.log(`\n${idx + 1}. Image in report ${img.UserReport.id}`);
        console.log('   Subscription:', img.UserReport.subscriptionId);
        console.log('   Type:', img.imageType);
        console.log('   Has vision:', !!img.detailedDescription);
        if (img.detailedDescription) {
          console.log('   Description:', img.detailedDescription.substring(0, 100) + '...');
        }
      });
    } else {
      // Check all wheel images to see what's there
      console.log('\nNo exact match found. Checking all wheel images...');
      
      const allWheels = await prisma.reportImage.findMany({
        where: {
          imageType: 'wheel',
          UserReport: {
            subscriptionId: '21989'
          }
        },
        select: {
          originalUrl: true,
          detailedDescription: true
        },
        take: 10
      });
      
      console.log(`\nFound ${allWheels.length} wheel images for subscription 21989:`);
      allWheels.forEach((wheel, idx) => {
        console.log(`${idx + 1}. ${wheel.originalUrl}`);
        console.log(`   Has vision: ${!!wheel.detailedDescription}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMainWheel();