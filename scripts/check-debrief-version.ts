import { prisma } from '@/lib/db/prisma';

async function checkVersion() {
  const config = await prisma.agentConfiguration.findFirst({
    where: { agentName: 'DebriefAgent' },
    orderBy: { version: 'desc' }
  });
  console.log('Current highest version:', config?.version);
  console.log('Config ID:', config?.id);
  
  // Get all versions
  const allVersions = await prisma.agentConfiguration.findMany({
    where: { agentName: 'DebriefAgent' },
    select: { version: true, active: true },
    orderBy: { version: 'desc' }
  });
  console.log('All versions:', allVersions);
}

checkVersion()
  .then(() => process.exit(0))
  .catch(console.error);