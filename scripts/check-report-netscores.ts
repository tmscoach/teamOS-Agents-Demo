#!/usr/bin/env npx tsx
/**
 * Check if netScores and rawScores are in the stored JSON report
 */

import prisma from '@/lib/db';

async function checkReportScores() {
  const subscriptionId = '21989';
  
  console.log(`\n🔍 Checking report for subscription ${subscriptionId}...\n`);
  
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    select: {
      id: true,
      subscriptionId: true,
      jsonData: true
    }
  });
  
  if (!report) {
    console.log('❌ Report not found');
    return;
  }
  
  console.log(`✅ Found report: ${report.id}`);
  
  const jsonData = report.jsonData as any;
  
  // Check for scores in various locations
  console.log('\n📊 Checking for scores in JSON structure:\n');
  
  // Check root level
  if (jsonData.netScores) {
    console.log('✅ Found netScores at root level:', jsonData.netScores);
  }
  if (jsonData.rawScores) {
    console.log('✅ Found rawScores at root level:', jsonData.rawScores);
  }
  
  // Check in metadata
  if (jsonData.metadata?.netScores) {
    console.log('✅ Found netScores in metadata:', jsonData.metadata.netScores);
  }
  if (jsonData.metadata?.rawScores) {
    console.log('✅ Found rawScores in metadata:', jsonData.metadata.rawScores);
  }
  
  // Check in sections
  const sections = jsonData.sections || [];
  sections.forEach((section: any, index: number) => {
    if (section.profile?.netScores) {
      console.log(`✅ Found netScores in section ${index} (${section.title}) profile:`, section.profile.netScores);
    }
    if (section.profile?.rawScores) {
      console.log(`✅ Found rawScores in section ${index} (${section.title}) profile:`, section.profile.rawScores);
    }
    if (section.data?.netScores) {
      console.log(`✅ Found netScores in section ${index} (${section.title}) data:`, section.data.netScores);
    }
    if (section.data?.rawScores) {
      console.log(`✅ Found rawScores in section ${index} (${section.title}) data:`, section.data.rawScores);
    }
  });
  
  // Check Work Preference Measures section specifically
  const workPrefSection = sections.find((s: any) => 
    s.title?.toLowerCase().includes('work preference') || 
    s.id === 'workpreferencemeasures'
  );
  
  if (workPrefSection) {
    console.log('\n🎯 Work Preference Measures section structure:');
    console.log('  - Has visualizations:', !!workPrefSection.visualizations);
    console.log('  - Number of visualizations:', workPrefSection.visualizations?.length || 0);
    
    if (workPrefSection.visualizations) {
      workPrefSection.visualizations.forEach((viz: any, i: number) => {
        if (viz.data) {
          console.log(`  - Visualization ${i} data keys:`, Object.keys(viz.data));
          if (viz.data.netScores) {
            console.log(`    ✅ Found netScores in visualization ${i}:`, viz.data.netScores);
          }
          if (viz.data.rawScores) {
            console.log(`    ✅ Found rawScores in visualization ${i}:`, viz.data.rawScores);
          }
          // Check for profile data
          if (viz.data.profile) {
            console.log(`    - Has profile data with keys:`, Object.keys(viz.data.profile));
            if (viz.data.profile.netScores) {
              console.log(`      ✅ Found netScores in profile:`, viz.data.profile.netScores);
            }
            if (viz.data.profile.rawScores) {
              console.log(`      ✅ Found rawScores in profile:`, viz.data.profile.rawScores);
            }
          }
        }
      });
    }
  }
  
  // Check report chunks to see what's being indexed
  console.log('\n📦 Checking report chunks...');
  const chunks = await prisma.reportChunk.findMany({
    where: { reportId: report.id },
    select: {
      sectionTitle: true,
      content: true
    }
  });
  
  console.log(`\nTotal chunks: ${chunks.length}`);
  
  // Check if any chunk contains score data
  const scoreChunks = chunks.filter(chunk => 
    chunk.content.toLowerCase().includes('net') || 
    chunk.content.toLowerCase().includes('raw') ||
    chunk.content.includes('I:') ||
    chunk.content.includes('C:') ||
    chunk.content.includes('B:') ||
    chunk.content.includes('S:')
  );
  
  console.log(`Chunks mentioning scores: ${scoreChunks.length}`);
  if (scoreChunks.length > 0) {
    console.log('\nSample chunk with score references:');
    console.log(`  Section: ${scoreChunks[0].sectionTitle}`);
    console.log(`  Content preview: ${scoreChunks[0].content.substring(0, 200)}...`);
  }
  
  await prisma.$disconnect();
}

checkReportScores().catch(console.error);