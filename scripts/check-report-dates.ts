#!/usr/bin/env tsx
/**
 * Check report creation dates
 */

import prisma from '@/lib/db';

async function checkReportDates() {
  try {
    const reports = await prisma.userReport.findMany({
      where: {
        userId: 'cmcujg1nf0000smqd9rtnrfcp',
        subscriptionId: '21989',
        processingStatus: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        ReportImage: {
          select: {
            detailedDescription: true
          },
          take: 1
        }
      },
      take: 5
    });
    
    console.log('=== COMPLETED REPORTS (newest first) ===\n');
    
    reports.forEach((report, idx) => {
      const hasVision = report.ReportImage.some(img => img.detailedDescription !== null);
      console.log(`${idx + 1}. ${report.id}`);
      console.log(`   Created: ${report.createdAt}`);
      console.log(`   Has vision: ${hasVision ? 'YES' : 'NO'}`);
      if (report.id === 'e293b36e-f9e5-4e16-a2ef-a6454d01bf6a') {
        console.log('   ⭐ THIS IS THE VISION REPORT');
      }
      console.log('');
    });
    
    // Find position of vision report
    const visionReportPosition = reports.findIndex(r => r.id === 'e293b36e-f9e5-4e16-a2ef-a6454d01bf6a');
    if (visionReportPosition !== -1) {
      console.log(`The vision report is at position ${visionReportPosition + 1} (${visionReportPosition === 0 ? 'NEWEST' : 'NOT newest'})`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReportDates();