#!/usr/bin/env npx tsx
/**
 * Check if rawScores and netScores are in the database JSON
 */

import prisma from '@/lib/db';

async function checkDbJsonScores() {
  const subscriptionId = '21989';
  
  console.log('📊 Checking database for subscription', subscriptionId, '\n');
  
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ No report found');
    return;
  }
  
  console.log('Report ID:', report.id);
  console.log('Created:', report.createdAt);
  
  const jsonData = report.jsonData as any;
  
  // Navigate to Work Preference Measures section
  const sections = jsonData.sections || [];
  console.log('\nTotal sections:', sections.length);
  
  const workPrefSection = sections.find((s: any, index: number) => {
    const matches = s.id === 'work_preference_measures' || 
                   s.title === 'Work Preference Measures' ||
                   index === 2; // It's the 3rd section (index 2)
    if (matches) {
      console.log(`\n✅ Found Work Preference section at index ${index}:`);
      console.log('  ID:', s.id);
      console.log('  Title:', s.title);
      console.log('  Type:', s.type);
    }
    return matches;
  });
  
  if (!workPrefSection) {
    console.log('\n❌ Work Preference Measures section not found');
    console.log('\nAll section titles:');
    sections.forEach((s: any, i: number) => {
      console.log(`  ${i}. ${s.title} (${s.id})`);
    });
    return;
  }
  
  // Check visualizations
  console.log('\n🎨 Visualizations in section:');
  console.log('  Has visualizations:', !!workPrefSection.visualizations);
  console.log('  Number of visualizations:', workPrefSection.visualizations?.length || 0);
  
  if (workPrefSection.visualizations && workPrefSection.visualizations.length > 0) {
    workPrefSection.visualizations.forEach((viz: any, i: number) => {
      console.log(`\n  Visualization ${i}:`);
      console.log('    Type:', viz.type);
      console.log('    Has data:', !!viz.data);
      
      if (viz.data) {
        console.log('    Data keys:', Object.keys(viz.data).join(', '));
        
        // Check for the specific structure with scores
        if (viz.type === 'CreateTMPQRidoSummary' || i === 0) {
          console.log('\n    🔍 Checking first visualization for scores...');
          
          if (viz.data.profile) {
            console.log('    ✅ Has profile field!');
            console.log('    Profile type:', typeof viz.data.profile);
            
            if (typeof viz.data.profile === 'object') {
              console.log('    Profile keys:', Object.keys(viz.data.profile).join(', '));
              
              if (viz.data.profile.rawScores) {
                console.log('\n    ✅✅ RAW SCORES FOUND:');
                console.log(JSON.stringify(viz.data.profile.rawScores, null, 6));
              } else {
                console.log('    ❌ No rawScores in profile');
              }
              
              if (viz.data.profile.netScores) {
                console.log('\n    ✅✅ NET SCORES FOUND:');
                console.log(JSON.stringify(viz.data.profile.netScores, null, 6));
              } else {
                console.log('    ❌ No netScores in profile');
              }
            } else if (typeof viz.data.profile === 'string') {
              console.log('    Profile value:', viz.data.profile);
            }
          } else {
            console.log('    ❌ No profile field in data');
          }
        }
      }
    });
  }
  
  // Check what's in the vector chunks
  console.log('\n\n📦 Vector chunks for this section:');
  const chunks = await prisma.reportChunk.findMany({
    where: { 
      reportId: report.id,
      sectionTitle: 'Work Preference Measures'
    }
  });
  
  if (chunks.length > 0) {
    console.log('\nChunk content:');
    console.log(chunks[0].content);
  } else {
    console.log('No chunks found for Work Preference Measures');
  }
  
  await prisma.$disconnect();
}

checkDbJsonScores().catch(console.error);