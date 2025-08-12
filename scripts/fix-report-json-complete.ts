#!/usr/bin/env npx tsx
/**
 * Fix the report to use complete JSON data
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function fixReportJson() {
  const subscriptionId = '21989';
  
  console.log('🔄 Fixing report JSON data...\n');
  
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
  
  // Load complete JSON
  const jsonPath = join(process.cwd(), 'docs/tms-api-spec/examples/tmp-report-response-complete.json');
  const fullJsonResponse = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // The viewer expects just the data object, not the success wrapper
  const reportData = fullJsonResponse.data;
  
  console.log(`   Sections in complete JSON: ${reportData.sections.length}`);
  
  // Update the report
  await prisma.userReport.update({
    where: { id: report.id },
    data: {
      reportData: reportData // Store just the data object
    }
  });
  
  console.log('\n✅ Report updated with complete JSON');
  console.log('\n📋 Sections available:');
  reportData.sections.forEach((section: any, index: number) => {
    console.log(`   ${index + 1}. ${section.title || section.id}`);
  });
  
  console.log('\n🌐 View the report at:');
  console.log(`   http://localhost:3000/reports/json/${subscriptionId}`);
  console.log('\n💬 The Debrief Agent button should appear at the top of the report');
  
  await prisma.$disconnect();
}

fixReportJson().catch(console.error);