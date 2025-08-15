import prisma from '../lib/db';

async function checkReportChunks() {
  try {
    // Check if report exists
    const report = await prisma.userReport.findFirst({
      where: { subscriptionId: '21989' },
      include: {
        ReportChunk: {
          select: {
            id: true,
            sectionTitle: true,
            content: true
          },
          take: 5
        }
      }
    });

    console.log('Report found:', !!report);
    if (report) {
      console.log('Report ID:', report.id);
      console.log('Number of chunks:', report.ReportChunk?.length || 0);
      
      if (report.ReportChunk && report.ReportChunk.length > 0) {
        console.log('\nFirst few chunks:');
        report.ReportChunk.forEach((chunk, i) => {
          console.log(`\n${i + 1}. Section: ${chunk.sectionTitle}`);
          console.log(`   Content preview: ${chunk.content.substring(0, 100)}...`);
        });
      }

      // Check specifically for "Key Points" content
      const keyPointsChunks = await prisma.reportChunk.findMany({
        where: {
          reportId: report.id,
          OR: [
            { content: { contains: 'Key Points' } },
            { sectionTitle: { contains: 'Key Points' } }
          ]
        }
      });

      console.log(`\nChunks containing "Key Points": ${keyPointsChunks.length}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReportChunks();