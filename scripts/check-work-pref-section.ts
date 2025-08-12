#!/usr/bin/env npx tsx
/**
 * Check Work Preference Measures section data
 */

import prisma from '@/lib/db';

async function checkWorkPrefSection() {
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId: '21989' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!report) {
    console.log('❌ Report not found');
    return;
  }
  
  console.log(`\n📊 Report ID: ${report.id}`);
  
  const jsonData = report.jsonData as any;
  const sections = jsonData.sections || [];
  
  // Find Work Preference Measures section
  const workPrefSection = sections.find((s: any) => 
    s.id === 'workpreferencemeasures' || 
    s.title === 'Work Preference Measures'
  );
  
  if (!workPrefSection) {
    console.log('❌ Work Preference Measures section not found');
    return;
  }
  
  console.log('\n📋 Work Preference Measures Section:');
  console.log('  - ID:', workPrefSection.id);
  console.log('  - Title:', workPrefSection.title);
  console.log('  - Type:', workPrefSection.type);
  console.log('  - Has visualizations:', !!workPrefSection.visualizations);
  console.log('  - Number of visualizations:', workPrefSection.visualizations?.length || 0);
  
  if (workPrefSection.visualizations) {
    console.log('\n🎨 Visualizations:');
    workPrefSection.visualizations.forEach((viz: any, i: number) => {
      console.log(`\n  ${i + 1}. Type: ${viz.type}`);
      console.log('     Dimension:', viz.dimension);
      console.log('     Has params:', !!viz.params);
      console.log('     Has data:', !!viz.data);
      
      if (viz.params) {
        console.log('     Params keys:', Object.keys(viz.params).join(', '));
        
        // Check for RIDO type params which contain scores
        if (viz.type === 'CreateTMPQRido' || viz.type === 'CreateTMPQRidoSummary') {
          console.log('     Left value (lv):', viz.params.lv);
          console.log('     Right value (rv):', viz.params.rv);
        }
      }
      
      if (viz.data) {
        console.log('     Data keys:', Object.keys(viz.data).join(', '));
        
        // Check for profile with scores
        if (viz.data.profile) {
          console.log('\n     📊 Profile Data:');
          console.log('       Keys:', Object.keys(viz.data.profile).join(', '));
          
          if (viz.data.profile.netScores) {
            console.log('\n       ✅ NET SCORES FOUND:');
            console.log('         I (Introvert):', viz.data.profile.netScores.I);
            console.log('         C (Creative):', viz.data.profile.netScores.C);
            console.log('         B (Beliefs):', viz.data.profile.netScores.B);
            console.log('         S (Structured):', viz.data.profile.netScores.S);
          }
          
          if (viz.data.profile.rawScores) {
            console.log('\n       ✅ RAW SCORES FOUND:');
            const raw = viz.data.profile.rawScores;
            console.log('         Introvert:', raw.introvert);
            console.log('         Extrovert:', raw.extrovert);
            console.log('         Creative:', raw.creative);
            console.log('         Analytical:', raw.analytical);
            console.log('         Beliefs:', raw.beliefs);
            console.log('         Structured:', raw.structured);
            console.log('         Flexible:', raw.flexible);
          }
        }
      }
    });
  }
  
  // Check the vector chunk for this section
  console.log('\n🔍 Checking vector chunk for this section...');
  const chunk = await prisma.reportChunk.findFirst({
    where: {
      reportId: report.id,
      sectionTitle: 'Work Preference Measures'
    }
  });
  
  if (chunk) {
    console.log('\n📄 Vector chunk content:');
    console.log(chunk.content);
    
    console.log('\n❓ Does chunk contain "net"?', chunk.content.toLowerCase().includes('net'));
    console.log('❓ Does chunk contain "raw"?', chunk.content.toLowerCase().includes('raw'));
    console.log('❓ Does chunk contain "I="?', chunk.content.includes('I='));
  }
  
  await prisma.$disconnect();
}

checkWorkPrefSection().catch(console.error);