#!/usr/bin/env npx tsx
/**
 * Cleanup duplicate reports for subscription 21989
 * Keeps only the report with proper chunks (14 chunks)
 */

import prisma from '@/lib/db';

async function cleanupDuplicateReports() {
  const subscriptionId = '21989';
  
  console.log('🧹 Starting cleanup of duplicate reports...\n');
  
  try {
    // First, identify the report we want to keep (the one with 14 chunks)
    const reportToKeep = await prisma.userReport.findFirst({
      where: {
        subscriptionId,
        id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' // The one we just chunked properly
      },
      include: {
        _count: {
          select: { ReportChunk: true }
        }
      }
    });

    if (!reportToKeep) {
      console.log('❌ Could not find the report to keep');
      return;
    }

    console.log('✅ Report to keep:');
    console.log(`   ID: ${reportToKeep.id}`);
    console.log(`   Created: ${reportToKeep.createdAt}`);
    console.log(`   Chunks: ${reportToKeep._count.ReportChunk}`);
    console.log('');

    // Get all other reports with the same subscription ID
    const duplicateReports = await prisma.userReport.findMany({
      where: {
        subscriptionId,
        NOT: {
          id: reportToKeep.id
        }
      },
      select: {
        id: true,
        createdAt: true,
        _count: {
          select: { ReportChunk: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${duplicateReports.length} duplicate reports to delete\n`);

    if (duplicateReports.length === 0) {
      console.log('✨ No duplicates to clean up!');
      return;
    }

    // Show what will be deleted
    console.log('Reports to be deleted:');
    duplicateReports.slice(0, 10).forEach(report => {
      console.log(`   - ${report.id} (${report.createdAt.toISOString()}, ${report._count.ReportChunk} chunks)`);
    });
    if (duplicateReports.length > 10) {
      console.log(`   ... and ${duplicateReports.length - 10} more`);
    }
    console.log('');

    // Ask for confirmation
    console.log('⚠️  WARNING: This will permanently delete these reports and their chunks.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all duplicate reports and their related data
    console.log('🗑️  Deleting duplicate reports and related data...');
    
    // First, delete related ReportAccessLogs
    const accessLogDelete = await prisma.reportAccessLog.deleteMany({
      where: {
        reportId: {
          in: duplicateReports.map(r => r.id)
        }
      }
    });
    console.log(`   Deleted ${accessLogDelete.count} access logs`);
    
    // Now delete the reports (cascade will handle ReportChunks)
    const deleteResult = await prisma.userReport.deleteMany({
      where: {
        subscriptionId,
        NOT: {
          id: reportToKeep.id
        }
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} duplicate reports`);

    // Verify the remaining report
    const remainingReports = await prisma.userReport.count({
      where: { subscriptionId }
    });

    console.log(`\n📈 Final state:`);
    console.log(`   Remaining reports for ${subscriptionId}: ${remainingReports}`);
    
    const finalReport = await prisma.userReport.findUnique({
      where: { id: reportToKeep.id },
      include: {
        ReportChunk: {
          select: {
            sectionTitle: true
          },
          orderBy: {
            chunkIndex: 'asc'
          }
        }
      }
    });

    if (finalReport) {
      console.log(`   Report ID: ${finalReport.id}`);
      console.log(`   Chunks: ${finalReport.ReportChunk.length}`);
      console.log(`   Sections:`);
      finalReport.ReportChunk.forEach((chunk, i) => {
        console.log(`     ${i + 1}. ${chunk.sectionTitle}`);
      });
    }

    console.log('\n✨ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateReports();