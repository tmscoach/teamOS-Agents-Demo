import prisma from '../lib/db';

async function checkAllReports() {
  try {
    // Check all reports with subscription ID 21989
    const reports = await prisma.userReport.findMany({
      where: { subscriptionId: '21989' },
      select: {
        id: true,
        createdAt: true,
        _count: {
          select: { ReportChunk: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${reports.length} reports with subscriptionId 21989:\n`);
    
    for (const report of reports) {
      console.log(`Report ID: ${report.id}`);
      console.log(`Created: ${report.createdAt}`);
      console.log(`Chunks: ${report._count.ReportChunk}`);
      console.log('---');
    }

    // Check the report that was chunked
    const chunkedReport = await prisma.userReport.findUnique({
      where: { id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' },
      include: {
        _count: {
          select: { ReportChunk: true }
        }
      }
    });

    if (chunkedReport) {
      console.log('\nReport that was chunked:');
      console.log(`ID: ${chunkedReport.id}`);
      console.log(`SubscriptionId: ${chunkedReport.subscriptionId}`);
      console.log(`Chunks: ${chunkedReport._count.ReportChunk}`);
      
      // Sample chunk check
      const keyPointsChunk = await prisma.reportChunk.findFirst({
        where: {
          reportId: chunkedReport.id,
          sectionTitle: { contains: 'Key Points' }
        }
      });
      
      if (keyPointsChunk) {
        console.log('\n✅ Found "Key Points" chunk!');
        console.log(`Section: ${keyPointsChunk.sectionTitle}`);
        console.log(`Content preview: ${keyPointsChunk.content.substring(0, 200)}...`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllReports();