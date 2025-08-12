#!/usr/bin/env npx tsx
/**
 * Verify RIDO chunks exist and are searchable
 */

import prisma from '@/lib/db';

async function verifyRidoChunks() {
  console.log('🔍 Verifying RIDO chunks...\n');
  
  // Get the main report
  const report = await prisma.userReport.findUnique({
    where: { id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' }
  });
  
  if (!report) {
    console.log('❌ Report bf331f4f... not found');
    
    // Try to find the most recent report
    const latestReport = await prisma.userReport.findFirst({
      where: { subscriptionId: '21989' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (latestReport) {
      console.log(`Found latest report: ${latestReport.id}`);
      
      const chunks = await prisma.reportChunk.findMany({
        where: {
          reportId: latestReport.id,
          OR: [
            { content: { contains: 'RIDO' } },
            { content: { contains: 'ruler spectrum' } },
            { content: { contains: '-30 to +30' } }
          ]
        }
      });
      
      console.log(`Chunks with RIDO content: ${chunks.length}`);
    }
    return;
  }
  
  console.log(`✅ Found report: ${report.id}`);
  
  // Check for RIDO chunks
  const ridoChunks = await prisma.reportChunk.findMany({
    where: {
      reportId: report.id,
      OR: [
        { sectionId: { contains: 'rido' } },
        { sectionTitle: { contains: 'RIDO', mode: 'insensitive' } },
        { content: { contains: 'RIDO', mode: 'insensitive' } },
        { content: { contains: 'ruler spectrum', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      sectionId: true,
      sectionTitle: true,
      content: true,
      chunkIndex: true
    }
  });
  
  console.log(`\n📊 RIDO chunks found: ${ridoChunks.length}`);
  
  if (ridoChunks.length > 0) {
    ridoChunks.forEach(chunk => {
      console.log('\n' + '='.repeat(60));
      console.log(`Chunk ID: ${chunk.id}`);
      console.log(`Section ID: ${chunk.sectionId}`);
      console.log(`Section Title: ${chunk.sectionTitle}`);
      console.log(`Chunk Index: ${chunk.chunkIndex}`);
      console.log(`Content length: ${chunk.content.length} chars`);
      console.log(`Content preview:`);
      console.log(chunk.content.substring(0, 300) + '...');
    });
  } else {
    console.log('❌ No RIDO chunks found!');
    
    // Check all chunks for this report
    const allChunks = await prisma.reportChunk.findMany({
      where: { reportId: report.id },
      select: {
        sectionId: true,
        sectionTitle: true
      }
    });
    
    console.log(`\n📦 All chunks for this report (${allChunks.length} total):`);
    allChunks.forEach(chunk => {
      console.log(`  - ${chunk.sectionTitle} (${chunk.sectionId})`);
    });
  }
  
  await prisma.$disconnect();
}

verifyRidoChunks().catch(console.error);