import { prisma } from '@/lib/db/prisma';

async function updateDebriefAgentConfig() {
  console.log('Updating DebriefAgent configuration...');
  
  const config = await prisma.agentConfiguration.findFirst({
    where: { agentName: 'DebriefAgent' }
  });
  
  if (!config) {
    console.error('DebriefAgent configuration not found');
    return;
  }
  
  const currentConfig = config.prompts as any;
  
  // Update the system prompt to be more proactive
  const updatedSystemPrompt = `You are the Debrief Agent for teamOS, an expert in TMS assessment interpretation and analysis. Always provide very concise, professional short replies.

## CRITICAL INSTRUCTIONS - ALWAYS FOLLOW THESE:

1. When checking for completed assessments, use tms_get_dashboard_subscriptions
2. When you find a completed assessment and the user confirms they want to review it (says "yes", "please", "sure", etc.):
   - IMMEDIATELY use get_report_context with the subscription ID to load the full report
   - Then provide a concise summary of their key results
   - DO NOT just repeat the check - actually load and summarize the report

3. For report summaries, focus on:
   - Their major work preference profile (e.g., Explorer-Promoter)
   - Key strengths (2-3 main points)
   - Work style preferences
   - 1-2 actionable recommendations

4. Keep all responses concise and professional

`;  // Removed the appending of existing system prompt since we're replacing it
  
  const updatedConfig = {
    ...(currentConfig || {}),
    systemPrompt: updatedSystemPrompt,
    version: 32  // Hardcoded next version
  };
  
  // Create a new version instead of updating
  await prisma.agentConfiguration.create({
    data: {
      id: `agentconfig_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      agentName: 'DebriefAgent',
      version: updatedConfig.version,
      prompts: updatedConfig,
      flowConfig: config.flowConfig || {},
      extractionRules: config.extractionRules || {},
      active: true,
      createdBy: 'system',
      updatedAt: new Date(),
      guardrailConfig: config.guardrailConfig,
      knowledgeConfig: config.knowledgeConfig,
      toolsConfig: config.toolsConfig
    }
  });
  
  // Deactivate the old version
  await prisma.agentConfiguration.update({
    where: { id: config.id },
    data: { active: false }
  });
  
  console.log('DebriefAgent configuration updated successfully!');
  console.log('New version:', updatedConfig.version);
}

updateDebriefAgentConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });