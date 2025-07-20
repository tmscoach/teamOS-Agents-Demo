import { PrismaClient } from '@/lib/generated/prisma';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';
import fs from 'fs';
import path from 'path';

async function reloadOrchestratorConfig() {
  const prisma = new PrismaClient();
  
  try {
    // Read the configuration file
    const configPath = path.join(process.cwd(), 'agent-configs', 'OrchestratorAgent.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    console.log('Loading OrchestratorAgent configuration...');
    
    // Extract the system prompt and store it in prompts.system
    const prompts = {
      system: config.systemPrompt,
      default: "I'm the Orchestrator Agent, here to guide your team transformation journey."
    };
    
    // Create or update the configuration
    const result = await AgentConfigurationService.createConfiguration({
      agentName: 'OrchestratorAgent',
      prompts,
      flowConfig: config.flowConfig || {},
      extractionRules: config.extractionRules || {},
      guardrailConfig: config.guardrailConfig || {},
      knowledgeConfig: config.knowledgeConfig || {},
      createdBy: 'system' // Use 'system' as the createdBy user
    });
    
    console.log('Configuration loaded successfully:', {
      id: result.id,
      agentName: result.agentName,
      version: result.version,
      isActive: result.isActive
    });
    
    // Clear the cache so the new config is picked up immediately
    const { AgentConfigLoader } = await import('@/src/lib/agents/config/agent-config-loader');
    AgentConfigLoader.clearCache('OrchestratorAgent');
    console.log('Cache cleared for OrchestratorAgent');
    
  } catch (error) {
    console.error('Error loading configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
reloadOrchestratorConfig();