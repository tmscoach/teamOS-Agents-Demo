import prisma from '../lib/db';

async function checkSystemPrompt() {
  const config = await prisma.agentConfiguration.findFirst({
    where: { agentName: 'DebriefAgent' },
    orderBy: { version: 'desc' },
    select: { prompts: true }
  });
  
  if (config?.prompts) {
    const prompts = config.prompts as any;
    const prompt = prompts.systemPrompt || JSON.stringify(prompts);
    // Check if it contains the critical TMS knowledge instructions
    const hasTMSInstructions = prompt.includes('search_tms_knowledge');
    const hasCriticalSection = prompt.includes('CRITICAL: When answering questions about TMS');
    const hasAlwaysUse = prompt.includes('ALWAYS use the search_tms_knowledge');
    
    console.log('System prompt analysis:');
    console.log('- Has search_tms_knowledge mention:', hasTMSInstructions);
    console.log('- Has CRITICAL TMS section:', hasCriticalSection);
    console.log('- Has ALWAYS use instruction:', hasAlwaysUse);
    
    // Look for the specific instructions
    const criticalIndex = prompt.indexOf('CRITICAL:');
    if (criticalIndex !== -1) {
      console.log('\n=== CRITICAL section found ===');
      console.log(prompt.substring(criticalIndex, criticalIndex + 500));
    }
    
    // Check what's in the beginning
    console.log('\n=== First 500 chars of prompt ===');
    console.log(prompt.substring(0, 500));
  } else {
    console.log('No system prompt found for DebriefAgent');
  }
  
  await prisma.$disconnect();
}

checkSystemPrompt().catch(console.error);