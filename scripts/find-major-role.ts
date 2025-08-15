import prisma from '../lib/db';

async function findMajorRole() {
  try {
    const report = await prisma.userReport.findUnique({
      where: { id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' },
      select: { jsonData: true }
    });
    
    if (report && report.jsonData) {
      const data = report.jsonData as any;
      
      console.log('\n=== Looking for Major Role Data ===\n');
      
      if (data.sections && Array.isArray(data.sections)) {
        // Check Team Management Profile section
        const tmpSection = data.sections.find((s: any) => s.title === 'Team Management Profile');
        if (tmpSection) {
          console.log('Team Management Profile Section:');
          console.log('  Visualization:', tmpSection.visualization);
          if (tmpSection.visualization) {
            console.log('  Visualization type:', typeof tmpSection.visualization);
            if (typeof tmpSection.visualization === 'object') {
              console.log('  Visualization keys:', Object.keys(tmpSection.visualization));
              console.log('  Full visualization data:', JSON.stringify(tmpSection.visualization, null, 2));
            }
          }
        }
        
        console.log('\n---\n');
        
        // Check Related Roles section  
        const relatedRolesSection = data.sections.find((s: any) => s.title === 'Related Roles');
        if (relatedRolesSection) {
          console.log('Related Roles Section:');
          console.log('  Content preview:', relatedRolesSection.content?.substring(0, 200));
        }
        
        console.log('\n---\n');
        
        // Check Overview section for major role mention
        const overviewSection = data.sections.find((s: any) => s.title === 'Overview');
        if (overviewSection) {
          console.log('Overview Section:');
          console.log('  Content preview:', overviewSection.content?.substring(0, 300));
        }
        
        console.log('\n---\n');
        
        // Check Work Preference Distribution
        const wpDistSection = data.sections.find((s: any) => s.title === 'Work Preference Distribution');
        if (wpDistSection) {
          console.log('Work Preference Distribution Section:');
          if (wpDistSection.visualization) {
            console.log('  Visualization type:', typeof wpDistSection.visualization);
            if (typeof wpDistSection.visualization === 'object') {
              console.log('  Visualization keys:', Object.keys(wpDistSection.visualization));
              console.log('  Full visualization data:', JSON.stringify(wpDistSection.visualization, null, 2));
            }
          }
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

findMajorRole();