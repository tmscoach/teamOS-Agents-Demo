#!/usr/bin/env tsx
/**
 * Debug Prisma field selection
 */

import prisma from '@/lib/db';

async function debugPrismaSelect() {
  try {
    const reportId = 'e293b36e-f9e5-4e16-a2ef-a6454d01bf6a';
    
    console.log('=== TESTING PRISMA FIELD SELECTION ===\n');
    
    // Test 1: Without explicit select
    console.log('1. Without explicit select:');
    const images1 = await prisma.reportImage.findMany({
      where: {
        reportId,
        imageType: 'wheel'
      },
      take: 1
    });
    
    if (images1.length > 0) {
      const img = images1[0];
      console.log('Fields returned:');
      console.log('- id:', !!img.id);
      console.log('- imageType:', !!img.imageType);
      console.log('- altText:', !!img.altText);
      console.log('- detailedDescription:', !!img.detailedDescription);
      console.log('- extractedData:', !!img.extractedData);
      console.log('- insights:', !!img.insights);
      console.log('- embedding:', !!img.embedding);
      
      console.log('\nDescription value:', img.detailedDescription ? 'Present' : 'NULL');
      if (img.detailedDescription) {
        console.log('Description length:', img.detailedDescription.length);
        console.log('Description preview:', img.detailedDescription.substring(0, 50) + '...');
      }
    }
    
    // Test 2: With explicit select
    console.log('\n2. With explicit select:');
    const images2 = await prisma.reportImage.findMany({
      where: {
        reportId,
        imageType: 'wheel'
      },
      select: {
        id: true,
        imageType: true,
        altText: true,
        detailedDescription: true,
        extractedData: true,
        insights: true
      },
      take: 1
    });
    
    if (images2.length > 0) {
      const img = images2[0];
      console.log('Description value:', img.detailedDescription ? 'Present' : 'NULL');
      if (img.detailedDescription) {
        console.log('Description length:', img.detailedDescription.length);
        console.log('Description preview:', img.detailedDescription.substring(0, 50) + '...');
      }
    }
    
    // Test 3: Raw query
    console.log('\n3. Raw SQL query:');
    const rawResult = await prisma.$queryRaw`
      SELECT id, "imageType", "altText", "detailedDescription" IS NOT NULL as has_description
      FROM "ReportImage"
      WHERE "reportId" = ${reportId} AND "imageType" = 'wheel'
      LIMIT 1
    `;
    console.log('Raw result:', rawResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPrismaSelect();