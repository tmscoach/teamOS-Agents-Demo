#!/usr/bin/env tsx
/**
 * Debug script to check why search_report_images isn't finding images
 */

import prisma from '@/lib/db';

async function debugImageSearch() {
  try {
    // 1. Check all users
    console.log('\n=== CHECKING USERS ===');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { id: { contains: 'user-1753674185641' } },
          { clerkId: 'user_2zaGLSiqZ1x34HzC0DlOBHoclHl' }
        ]
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, ClerkID: ${user.clerkId}`);
    });

    // 2. Check all reports
    console.log('\n=== CHECKING REPORTS ===');
    const reports = await prisma.userReport.findMany({
      where: {
        subscriptionId: '21989'
      },
      include: {
        ReportImage: true
      }
    });
    
    console.log(`Found ${reports.length} reports for subscription 21989:`);
    reports.forEach(report => {
      console.log(`- Report ID: ${report.id}`);
      console.log(`  User ID: ${report.userId}`);
      console.log(`  Status: ${report.processingStatus}`);
      console.log(`  Images: ${report.ReportImage.length}`);
      if (report.ReportImage.length > 0) {
        console.log('  Image details:');
        report.ReportImage.forEach(img => {
          console.log(`    - ${img.imageType}: ${img.altText?.substring(0, 50)}...`);
          console.log(`      Has description: ${!!img.detailedDescription}`);
          console.log(`      Has data: ${!!img.extractedData}`);
        });
      }
    });

    // 3. Check specific user mapping
    console.log('\n=== CHECKING USER MAPPING ===');
    const seedUserId = 'user-1753674185641-cy86j2pam';
    const clerkUserId = 'user_2zaGLSiqZ1x34HzC0DlOBHoclHl';
    
    const seedUser = await prisma.user.findUnique({
      where: { id: seedUserId }
    });
    
    const clerkUser = await prisma.user.findFirst({
      where: { clerkId: clerkUserId }
    });
    
    console.log('Seed user:', seedUser ? `Found (${seedUser.email})` : 'Not found');
    console.log('Clerk user:', clerkUser ? `Found (${clerkUser.id}, ${clerkUser.email})` : 'Not found');

    // 4. Test the search logic
    console.log('\n=== TESTING SEARCH LOGIC ===');
    const testUserId = seedUserId; // The user ID the report was created with
    const testSubscriptionId = '21989';
    
    const testReport = await prisma.userReport.findFirst({
      where: {
        subscriptionId: testSubscriptionId,
        userId: testUserId,
        processingStatus: 'COMPLETED'
      },
      include: {
        ReportImage: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (testReport) {
      console.log(`Found report for user ${testUserId}:`);
      console.log(`- Report ID: ${testReport.id}`);
      console.log(`- Images: ${testReport.ReportImage.length}`);
    } else {
      console.log(`No report found for user ${testUserId} and subscription ${testSubscriptionId}`);
      
      // Try without user ID filter
      const anyReport = await prisma.userReport.findFirst({
        where: {
          subscriptionId: testSubscriptionId,
          processingStatus: 'COMPLETED'
        },
        include: {
          ReportImage: true
        }
      });
      
      if (anyReport) {
        console.log(`\nBut found report without user filter:`);
        console.log(`- Report ID: ${anyReport.id}`);
        console.log(`- User ID: ${anyReport.userId}`);
        console.log(`- Images: ${anyReport.ReportImage.length}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug script
debugImageSearch();