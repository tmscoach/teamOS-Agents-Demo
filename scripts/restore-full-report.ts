#!/usr/bin/env npx tsx
/**
 * Restore the full report JSON from the complete example file
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function restoreFullReport() {
  const subscriptionId = '21989';
  
  console.log('🔄 Restoring full report from JSON file...\n');
  
  // Get existing report
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report found - creating new one');
    
    // Load complete JSON from file
    const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
    const fullJson = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    // Create new report with full JSON
    const newReport = await prisma.userReport.create({
      data: {
        subscriptionId,
        reportType: 'TMP',
        status: 'completed',
        assessmentId: 'TMP-2024-001',
        completedAt: new Date(),
        reportData: fullJson, // Store the complete response including success wrapper
        metadata: {
          version: '1.0',
          hasRidoVisualization: true,
          hasNetScores: true,
          hasRawScores: true
        }
      }
    });
    
    console.log('✅ Created new report with full JSON');
    console.log(`   Report ID: ${newReport.id}`);
    console.log(`   Sections: ${fullJson.data.sections.length}`);
  } else {
    console.log(`📊 Found existing report: ${report.id}`);
    
    // Load complete JSON from file
    const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
    const fullJson = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    // Update with full JSON
    await prisma.userReport.update({
      where: { id: report.id },
      data: {
        reportData: fullJson // Store the complete response including success wrapper
      }
    });
    
    console.log('✅ Updated report with full JSON from file');
    console.log(`   Sections in JSON: ${fullJson.data.sections.length}`);
  }
  
  // Verify the update
  const updatedReport = await prisma.userReport.findFirst({
    where: { subscriptionId },
    select: {
      id: true,
      reportData: true
    }
  });
  
  const reportData = updatedReport?.reportData as any;
  const sections = reportData?.data?.sections || [];
  
  console.log('\n✅ Report restored successfully!');
  console.log(`   Total sections: ${sections.length}`);
  
  if (sections.length > 0) {
    console.log('\n📋 Sections in report:');
    sections.forEach((section: any, index: number) => {
      console.log(`   ${index + 1}. ${section.title || section.id}`);
    });
  }
  
  console.log('\n🌐 View the complete report at:');
  console.log(`   http://localhost:3000/reports/json/${subscriptionId}`);
  console.log('\n   You should now see all 14 sections in the report viewer!');
  
  await prisma.$disconnect();
}

restoreFullReport().catch(console.error);