#!/usr/bin/env npx tsx
/**
 * Verify that rawScores and netScores are in the stored JSON
 */

import prisma from '@/lib/db';
import { executeTMSTool } from '@/src/lib/agents/tools/tms-tool-executor';

async function verifyJsonScores() {
  const subscriptionId = '21989';
  
  console.log('🔍 Checking what tms_get_json_report returns...\n');
  
  // Get JWT for API calls  
  const jwt = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJVc2VyVHlwZSI6IlJlc3BvbmRlbnQiLCJuYW1laWQiOiJ0ZXN0QGV4YW1wbGUuY29tIiwib3JnYW5pc2F0aW9uSWQiOiJvcmctZGVmYXVsdCIsImlhdCI6MTc1NDk5MjA4NywiZXhwIjoxNzU1MDc4NDg3fQ.test';
  
  // Fetch the report using the TMS tool
  const result = await executeTMSTool({
    tool: 'tms_get_json_report',
    parameters: { subscriptionId },
    jwt
  });
  
  if (!result.success) {
    console.log('❌ Failed to fetch report:', result.error);
    return;
  }
  
  const jsonData = result.output;
  console.log('✅ Fetched report from TMS API');
  
  // Check for scores in Work Preference Measures section
  const sections = jsonData.sections || [];
  const workPrefSection = sections.find((s: any) => 
    s.id === 'work_preference_measures' || 
    s.title === 'Work Preference Measures'
  );
  
  if (workPrefSection?.visualizations?.[0]?.data?.profile) {
    const profile = workPrefSection.visualizations[0].data.profile;
    console.log('\n✅ Found in TMS API response:');
    if (profile.rawScores) {
      console.log('  RAW SCORES:', JSON.stringify(profile.rawScores, null, 2));
    }
    if (profile.netScores) {
      console.log('  NET SCORES:', JSON.stringify(profile.netScores, null, 2));
    }
  }
  
  // Now check what's stored in the database
  console.log('\n📊 Checking database storage...\n');
  
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report in database');
    return;
  }
  
  console.log(`Report ID: ${report.id}`);
  const dbJsonData = report.jsonData as any;
  const dbSections = dbJsonData.sections || [];
  const dbWorkPrefSection = dbSections.find((s: any) => 
    s.id === 'work_preference_measures' || 
    s.title === 'Work Preference Measures'
  );
  
  if (dbWorkPrefSection?.visualizations?.[0]?.data?.profile) {
    const profile = dbWorkPrefSection.visualizations[0].data.profile;
    console.log('\n✅ Found in DATABASE:');
    if (profile.rawScores) {
      console.log('  RAW SCORES:', JSON.stringify(profile.rawScores, null, 2));
    }
    if (profile.netScores) {
      console.log('  NET SCORES:', JSON.stringify(profile.netScores, null, 2));
    }
  } else if (dbWorkPrefSection?.visualizations?.[0]?.data) {
    console.log('\n⚠️  Work Pref visualization[0].data exists but no profile:');
    console.log('  Keys:', Object.keys(dbWorkPrefSection.visualizations[0].data));
  } else if (dbWorkPrefSection?.visualizations?.[0]) {
    console.log('\n⚠️  Work Pref visualization[0] exists:');
    console.log('  Keys:', Object.keys(dbWorkPrefSection.visualizations[0]));
  } else {
    console.log('\n❌ No visualizations in database Work Preference Measures section');
  }
  
  // Check the vector chunks
  console.log('\n🔍 Checking vector chunks...\n');
  const chunks = await prisma.reportChunk.findMany({
    where: { 
      reportId: report.id,
      sectionTitle: 'Work Preference Measures'
    }
  });
  
  if (chunks.length > 0) {
    console.log('Vector chunk content:');
    console.log(chunks[0].content);
    console.log('\nContains "raw"?', chunks[0].content.toLowerCase().includes('raw'));
    console.log('Contains "net"?', chunks[0].content.toLowerCase().includes('net'));
  }
  
  await prisma.$disconnect();
}

verifyJsonScores().catch(console.error);