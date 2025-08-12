#!/usr/bin/env npx tsx
/**
 * Fix the report to use complete JSON data with truncated images
 */

import prisma from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

async function fixReportJsonMinimal() {
  const subscriptionId = '21989';
  
  console.log('🔄 Fixing report JSON data (with truncated images)...\n');
  
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
  
  // Truncate all base64 images to save space
  const truncateImages = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(truncateImages);
    }
    
    const result: any = {};
    for (const key in obj) {
      if (key === 'base64' && typeof obj[key] === 'string' && obj[key].length > 100) {
        result[key] = obj[key].substring(0, 50) + '...[truncated]';
      } else {
        result[key] = truncateImages(obj[key]);
      }
    }
    return result;
  };
  
  const minimalData = truncateImages(reportData);
  
  console.log(`   Sections in complete JSON: ${minimalData.sections.length}`);
  
  // Update the report
  await prisma.userReport.update({
    where: { id: report.id },
    data: {
      reportData: minimalData // Store the data with truncated images
    }
  });
  
  console.log('\n✅ Report updated with complete JSON (images truncated)');
  console.log('\n📋 Sections available:');
  minimalData.sections.forEach((section: any, index: number) => {
    console.log(`   ${index + 1}. ${section.title || section.id}`);
  });
  
  console.log('\n🌐 View the report at:');
  console.log(`   http://localhost:3000/reports/json/${subscriptionId}`);
  console.log('\n💬 The Debrief Agent button should appear at the top');
  console.log('   Click it to test questions like:');
  console.log('   - "What are my net scores?"');
  console.log('   - "Explain the RIDO ruler spectrum"');
  console.log('   - "How are my scores mapped on the -30 to +30 scale?"');
  
  await prisma.$disconnect();
}

fixReportJsonMinimal().catch(console.error);