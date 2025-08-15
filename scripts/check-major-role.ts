import prisma from '../lib/db';

async function checkMajorRole() {
  try {
    const report = await prisma.userReport.findUnique({
      where: { id: 'bf331f4f-ecf8-4dad-868d-e75081e73ca0' },
      select: { jsonData: true }
    });
    
    if (report && report.jsonData) {
      const data = report.jsonData as any;
      console.log('\n=== Report Data Check ===');
      console.log('Major Role:', data.majorRole || 'NOT FOUND');
      console.log('Related Roles:', data.relatedRoles || 'NOT FOUND');
      console.log('Team Management Profile:', data.teamManagementProfile || 'NOT FOUND');
      
      // Check for work preferences
      if (data.workPreferences) {
        console.log('\nWork Preferences Found:');
        Object.keys(data.workPreferences).forEach(key => {
          console.log(`  - ${key}`);
        });
      }
      
      // Check all top-level keys
      console.log('\nAll top-level keys in report data:');
      Object.keys(data).forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      console.log('Report not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMajorRole();