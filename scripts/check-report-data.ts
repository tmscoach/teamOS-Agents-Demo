import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient()

async function checkReport() {
  const report = await prisma.userReport.findFirst({
    where: { subscriptionId: '21989' },
    select: {
      id: true,
      jsonData: true,
      processingStatus: true,
      userId: true,
      createdAt: true
    }
  })
  
  if (report) {
    console.log('Report found:', report.id)
    console.log('User ID:', report.userId)
    console.log('Created:', report.createdAt)
    console.log('Has jsonData:', Boolean(report.jsonData))
    console.log('Processing status:', report.processingStatus)
    
    if (report.jsonData) {
      const data = report.jsonData as any
      console.log('\nJSON Data Structure:')
      console.log('- Has sections?', Boolean(data.sections))
      console.log('- Sections count:', data.sections?.length || 0)
      
      if (data.sections && data.sections.length > 0) {
        console.log('- Section IDs:', data.sections.map((s: any) => s.id))
        console.log('- First section title:', data.sections[0].title)
      }
      
      console.log('\nFull structure keys:', Object.keys(data))
    }
  } else {
    console.log('No report found with subscriptionId: 21989')
  }
  
  await prisma.$disconnect()
}

checkReport().catch(console.error)