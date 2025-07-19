#!/usr/bin/env node

/**
 * Script to seed agent configurations from simplified configs into the database
 */

import { PrismaClient } from '../lib/generated/prisma';
import { SIMPLIFIED_AGENT_CONFIGS } from '../src/lib/agents/config/simplified-agent-configs';

const prisma = new PrismaClient();

async function seedAgentConfigurations() {
  console.log('🌱 Seeding agent configurations...\n');

  for (const [agentName, config] of Object.entries(SIMPLIFIED_AGENT_CONFIGS)) {
    try {
      console.log(`Processing ${agentName}...`);
      
      // Check if configuration already exists
      const existingConfig = await prisma.agentConfiguration.findFirst({
        where: { agentName }
      });

      if (existingConfig) {
        console.log(`✓ ${agentName} already has configuration (v${existingConfig.version})`);
        continue;
      }

      // Create new configuration
      const newConfig = await prisma.agentConfiguration.create({
        data: {
          agentName,
          version: 1,
          prompts: {
            system: config.systemPrompt
          },
          flowConfig: config.flowConfig,
          extractionRules: config.extractionRules,
          guardrailConfig: config.guardrailConfig || {},
          active: true,
          createdBy: 'system-seed'
        }
      });

      console.log(`✅ Created configuration for ${agentName} (v${newConfig.version})`);
    } catch (error) {
      console.error(`❌ Error creating configuration for ${agentName}:`, error);
    }
  }

  console.log('\n✨ Agent configuration seeding complete!');
}

async function main() {
  try {
    await seedAgentConfigurations();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();