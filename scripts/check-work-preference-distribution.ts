import prisma from '../lib/db';

async function checkWorkPreferenceDistribution() {
  try {
    const report = await prisma.userReport.findUnique({
      where: { id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' },
      select: { jsonData: true }
    });
    
    if (report && report.jsonData) {
      const data = report.jsonData as any;
      
      console.log('\n=== Work Preference Distribution Check ===\n');
      
      if (data.sections && Array.isArray(data.sections)) {
        // Find Work Preference Distribution section
        const wpDistSection = data.sections.find((s: any) => 
          s.title === 'Work Preference Distribution'
        );
        
        if (wpDistSection) {
          console.log('Work Preference Distribution Section Found:');
          console.log('  Type:', wpDistSection.type);
          console.log('  Has visualization:', !!wpDistSection.visualization);
          
          if (wpDistSection.visualization) {
            const viz = wpDistSection.visualization;
            console.log('\nVisualization details:');
            console.log('  Type:', viz.type);
            console.log('  Has params:', !!viz.params);
            console.log('  Has data:', !!viz.data);
            
            if (viz.data) {
              console.log('\nVisualization data:');
              console.log('  Has image:', !!viz.data.image);
              if (viz.data.image) {
                console.log('    Image base64 length:', viz.data.image.base64?.length || 0);
                console.log('    Image format:', viz.data.image.format);
              }
              console.log('  Has distribution:', !!viz.data.distribution);
              console.log('  Has allSegments:', !!viz.data.allSegments);
              
              if (viz.data.distribution) {
                console.log('\n  Distribution data:');
                viz.data.distribution.forEach((item: any) => {
                  console.log(`    - ${item.type || item.name}: ${item.percentage}%`);
                });
              }
              
              if (viz.data.allSegments) {
                console.log('\n  AllSegments data:');
                viz.data.allSegments.forEach((segment: any) => {
                  console.log(`    - ${segment.name}: ${segment.percentage}% (${segment.color})`);
                });
              }
            }
          }
        } else {
          console.log('Work Preference Distribution section not found');
        }
      }
    } else {
      console.log('Report not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkPreferenceDistribution();