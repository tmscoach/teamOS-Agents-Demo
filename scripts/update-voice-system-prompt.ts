import prisma from '../lib/db';

const TMS_KNOWLEDGE_INSTRUCTIONS = `

CRITICAL: When answering questions about TMS terminology, concepts, or methodologies:
- ALWAYS use the search_tms_knowledge tool or get_assessment_methodology tool first to find accurate information
- NEVER make up or guess definitions - only use information from the knowledge base
- If search results are found, analyze them carefully and explain what you found
- Look for patterns and context clues in the results to understand the concept
- If results show the term but don't explicitly define it, explain what you can infer from the context
- Quote relevant portions from the search results to support your explanation
- Only say you "couldn't find information" if the search returns NO results at all

IMPORTANT: When asked about score calculations or methodology:
1. IMMEDIATELY use get_assessment_methodology to search for calculation methods
2. Search for terms like "net scores", "raw scores", "calculation", "scoring methodology"
3. Check the relevant accreditation handbook (e.g., search for "TMP handbook net scores")
4. NEVER say you don't know how something is calculated without searching first

For example, if asked "How is my Introvert score calculated?":
1. Use get_assessment_methodology with assessment_type="TMP" and section="net scores calculation"
2. Search for "TMP scoring methodology" or "work preference measures calculation"
3. Explain the raw score to net score conversion process
4. Quote the specific methodology from the handbook`;

async function updateSystemPrompt() {
  // Get the current configuration
  const config = await prisma.agentConfiguration.findFirst({
    where: { agentName: 'DebriefAgent' },
    orderBy: { version: 'desc' }
  });
  
  if (!config) {
    console.log('No DebriefAgent configuration found');
    return;
  }
  
  const prompts = config.prompts as any;
  const currentSystemPrompt = prompts.system || '';
  
  // Check if instructions already exist
  if (currentSystemPrompt.includes('CRITICAL: When answering questions about TMS')) {
    console.log('TMS knowledge instructions already present in system prompt');
    return;
  }
  
  // Append the instructions
  const updatedSystemPrompt = currentSystemPrompt + TMS_KNOWLEDGE_INSTRUCTIONS;
  
  // Update the configuration
  await prisma.agentConfiguration.update({
    where: { id: config.id },
    data: {
      prompts: {
        ...prompts,
        system: updatedSystemPrompt
      }
    }
  });
  
  console.log('Successfully updated DebriefAgent system prompt with TMS knowledge instructions');
  console.log('The voice agent will now properly use TMS knowledge tools when asked about TMS terms');
  
  // Verify the update
  const updated = await prisma.agentConfiguration.findFirst({
    where: { agentName: 'DebriefAgent' },
    orderBy: { version: 'desc' },
    select: { prompts: true }
  });
  
  const updatedPrompts = updated?.prompts as any;
  if (updatedPrompts?.system?.includes('CRITICAL: When answering questions about TMS')) {
    console.log('✅ Verification successful - instructions are now in the database');
  } else {
    console.log('❌ Verification failed - instructions were not saved properly');
  }
  
  await prisma.$disconnect();
}

updateSystemPrompt().catch(console.error);