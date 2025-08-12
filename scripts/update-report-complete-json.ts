#!/usr/bin/env npx tsx
/**
 * Update the existing report to use the complete JSON data
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function updateReportWithCompleteJson() {
  const subscriptionId = '21989';
  
  console.log('🔄 Updating report with complete JSON data...\n');
  
  // Load the complete JSON
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const jsonResponse = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // Get existing report
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report found');
    return;
  }
  
  console.log(`📊 Found report: ${report.id}`);
  console.log(`   Current sections: ${(report.reportData as any)?.data?.sections?.length || 0}`);
  
  // Update the report with complete JSON data
  const updated = await prisma.userReport.update({
    where: { id: report.id },
    data: {
      reportData: jsonResponse, // Use the complete JSON response
      metadata: {
        version: '1.0',
        hasRidoVisualization: true,
        hasNetScores: true,
        hasRawScores: true,
        totalSections: jsonResponse.data.sections.length
      }
    }
  });
  
  console.log(`\n✅ Report updated with complete JSON`);
  console.log(`   Total sections now: ${jsonResponse.data.sections.length}`);
  
  // List all section titles
  console.log('\n📋 Available sections:');
  jsonResponse.data.sections.forEach((section: any, index: number) => {
    console.log(`   ${index + 1}. ${section.title || section.id}`);
  });
  
  console.log('\n✅ Report successfully updated!');
  console.log('\n🌐 View the complete report at:');
  console.log(`   http://localhost:3000/reports/json/${subscriptionId}`);
  console.log('\n💬 Test the Debrief Agent with questions like:');
  console.log('   - "What are my net scores?"');
  console.log('   - "Explain the RIDO ruler spectrum"');
  console.log('   - "How are my scores mapped on the -30 to +30 scale?"');
  
  await prisma.$disconnect();
}

updateReportWithCompleteJson().catch(console.error);