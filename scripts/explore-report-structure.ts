import prisma from '../lib/db';

async function exploreReportStructure() {
  try {
    const report = await prisma.userReport.findUnique({
      where: { id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' },
      select: { jsonData: true }
    });
    
    if (report && report.jsonData) {
      const data = report.jsonData as any;
      
      console.log('\n=== Report Structure ===');
      console.log('Top-level keys:', Object.keys(data));
      
      if (data.sections) {
        console.log('\nSections structure:');
        if (Array.isArray(data.sections)) {
          console.log('  Sections is an array with', data.sections.length, 'items');
          data.sections.forEach((section: any, index: number) => {
            console.log(`\n  Section ${index + 1}:`);
            console.log('    Title:', section.title || 'No title');
            console.log('    Keys:', Object.keys(section));
            
            // Check for major role in each section
            if (section.majorRole) {
              console.log('    ✅ FOUND majorRole:', section.majorRole);
            }
            if (section.relatedRoles) {
              console.log('    ✅ FOUND relatedRoles:', section.relatedRoles);
            }
          });
        } else {
          console.log('  Sections keys:', Object.keys(data.sections));
          
          // Check each section
          Object.entries(data.sections).forEach(([key, section]: [string, any]) => {
            console.log(`\n  Section "${key}":`);
            if (typeof section === 'object' && section !== null) {
              console.log('    Keys:', Object.keys(section));
              
              // Check for major role
              if (section.majorRole) {
                console.log('    ✅ FOUND majorRole:', section.majorRole);
              }
              if (section.relatedRoles) {
                console.log('    ✅ FOUND relatedRoles:', section.relatedRoles);
              }
              if (section.teamManagementProfile) {
                console.log('    ✅ FOUND teamManagementProfile:', section.teamManagementProfile);
              }
            } else {
              console.log('    Value type:', typeof section);
            }
          });
        }
      }
      
      // Check metadata
      if (data.metadata) {
        console.log('\nMetadata structure:');
        console.log('  Keys:', Object.keys(data.metadata));
        if (data.metadata.majorRole) {
          console.log('  ✅ FOUND majorRole in metadata:', data.metadata.majorRole);
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

exploreReportStructure();