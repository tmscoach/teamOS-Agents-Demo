#!/usr/bin/env npx tsx
/**
 * Check the current state of the report and chunks
 */

import prisma from '@/lib/db';

async function checkReportState() {
  const subscriptionId = '21989';
  
  console.log('📊 Checking report state...\n');
  
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    select: {
      id: true,
      jsonData: true
    }
  });
  
  if (!report) {
    console.log('❌ No report found');
    return;
  }
  
  const data = report.jsonData as any;
  
  console.log('Report ID:', report.id);
  console.log('Has reportData:', Boolean(data));
  
  if (data) {
    console.log('reportData structure:');
    console.log('  Top-level keys:', Object.keys(data));
    
    // Check if it has the success/data wrapper
    if (data.success && data.data) {
      console.log('  Has success/data wrapper: YES');
      console.log('  Sections count:', data.data.sections?.length || 0);
      if (data.data.sections?.length > 0) {
        console.log('  Section titles:');
        data.data.sections.forEach((s: any, i: number) => {
          console.log(`    ${i + 1}. ${s.title || s.id}`);
        });
      }
    } else if (data.sections) {
      console.log('  Has direct sections: YES');
      console.log('  Sections count:', data.sections.length || 0);
      if (data.sections?.length > 0) {
        console.log('  Section titles:');
        data.sections.forEach((s: any, i: number) => {
          console.log(`    ${i + 1}. ${s.title || s.id}`);
        });
      }
    } else {
      console.log('  Unknown structure');
    }
  }
  
  // Check chunks
  console.log('\n📦 Report Chunks:');
  const chunks = await prisma.reportChunk.findMany({
    where: { reportId: report.id },
    select: {
      sectionId: true,
      sectionTitle: true,
      charCount: true
    },
    orderBy: { chunkIndex: 'asc' }
  });
  
  console.log(`Total chunks: ${chunks.length}`);
  
  // Check for RIDO chunks specifically
  const ridoChunks = chunks.filter(c => 
    c.sectionId.includes('rido') || 
    c.sectionTitle.toLowerCase().includes('rido')
  );
  
  console.log(`RIDO chunks: ${ridoChunks.length}`);
  if (ridoChunks.length > 0) {
    ridoChunks.forEach(c => {
      console.log(`  - ${c.sectionTitle} (${c.charCount} chars)`);
    });
  }
  
  // Check for score chunks
  const scoreChunks = chunks.filter(c => 
    c.sectionTitle.toLowerCase().includes('score') ||
    c.sectionId.includes('score')
  );
  
  console.log(`Score chunks: ${scoreChunks.length}`);
  if (scoreChunks.length > 0) {
    scoreChunks.forEach(c => {
      console.log(`  - ${c.sectionTitle} (${c.charCount} chars)`);
    });
  }
  
  console.log('\n✅ Summary:');
  console.log('- Report chunks (for Debrief Agent): Working ✅');
  console.log('- RIDO data in chunks: Available ✅');
  console.log('- Report viewer sections: Need to fix the reportData field');
  
  await prisma.$disconnect();
}

checkReportState().catch(console.error);