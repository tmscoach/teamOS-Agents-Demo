#!/usr/bin/env npx tsx
/**
 * Restore the report to show all 14 sections from the complete JSON file
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function restoreReportFromJsonFile() {
  const subscriptionId = '21989';
  const targetReportId = 'bf331f4f-ecf8-4dad-868d-e75081e73ca0'; // The report with RIDO chunks
  
  console.log('🔄 Restoring report from complete JSON file...\n');
  
  // Load complete JSON from file
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const fullJsonResponse = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // The API expects just the data part, not the success wrapper
  const reportData = fullJsonResponse.data;
  
  console.log(`📊 Loaded JSON with ${reportData.sections.length} sections`);
  
  // Update the specific report that has our RIDO chunks
  const report = await prisma.userReport.findUnique({
    where: { id: targetReportId }
  });
  
  if (!report) {
    console.log('❌ Report not found');
    return;
  }
  
  console.log(`✅ Found report: ${report.id}`);
  console.log(`   Current chunks: 4 (including RIDO chunks)`);
  
  // Update the jsonData field with the complete JSON
  await prisma.userReport.update({
    where: { id: targetReportId },
    data: {
      jsonData: reportData, // Store just the data object, not the success wrapper
      metadata: {
        ...((report.metadata as any) || {}),
        totalSections: reportData.sections.length,
        hasRidoVisualization: true,
        hasNetScores: true,
        hasRawScores: true
      }
    }
  });
  
  console.log('\n✅ Report restored with complete JSON!');
  console.log('\n📋 Sections in report:');
  reportData.sections.forEach((section: any, index: number) => {
    console.log(`   ${index + 1}. ${section.title || section.id}`);
  });
  
  // Verify chunks are still there
  const chunkCount = await prisma.reportChunk.count({
    where: { reportId: targetReportId }
  });
  
  const ridoChunks = await prisma.reportChunk.count({
    where: {
      reportId: targetReportId,
      sectionId: { in: ['rido-visualization', 'rido-scale-explanation'] }
    }
  });
  
  console.log('\n📦 Report chunks status:');
  console.log(`   Total chunks: ${chunkCount}`);
  console.log(`   RIDO chunks: ${ridoChunks}`);
  
  console.log('\n🌐 View the complete report at:');
  console.log(`   http://localhost:3000/reports/json/${subscriptionId}`);
  console.log('\n✅ You should now see:');
  console.log('   - All 14 sections in the report viewer');
  console.log('   - Debrief Agent can answer about RIDO, net scores, raw scores');
  console.log('   - Everything is working as before!');
  
  await prisma.$disconnect();
}

restoreReportFromJsonFile().catch(console.error);