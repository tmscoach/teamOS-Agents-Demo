#!/usr/bin/env tsx
/**
 * Debug findFirst behavior
 */

import prisma from '@/lib/db';

async function debugFindFirst() {
  try {
    const userId = 'cmcujg1nf0000smqd9rtnrfcp';
    const subscriptionId = '21989';
    
    console.log('=== DEBUG FINDFIRST ===\n');
    
    // Test 1: findFirst without orderBy (as tool does)
    const report1 = await prisma.userReport.findFirst({
      where: {
        subscriptionId,
        userId,
        processingStatus: 'COMPLETED'
      },
      select: { 
        id: true,
        createdAt: true
      }
    });
    
    console.log('1. findFirst (no orderBy):');
    console.log('   ID:', report1?.id);
    console.log('   Created:', report1?.createdAt);
    
    // Test 2: findFirst with orderBy desc
    const report2 = await prisma.userReport.findFirst({
      where: {
        subscriptionId,
        userId,
        processingStatus: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true,
        createdAt: true
      }
    });
    
    console.log('\n2. findFirst (orderBy createdAt desc):');
    console.log('   ID:', report2?.id);
    console.log('   Created:', report2?.createdAt);
    
    // Test 3: Check if they're different
    console.log('\n3. Comparison:');
    console.log('   Same report?', report1?.id === report2?.id);
    
    // Test 4: Get all and check order
    const allReports = await prisma.userReport.findMany({
      where: {
        subscriptionId,
        userId,
        processingStatus: 'COMPLETED'
      },
      select: {
        id: true,
        createdAt: true
      }
    });
    
    console.log('\n4. All reports (default order):');
    allReports.slice(0, 3).forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.id} - ${r.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFindFirst();