#!/usr/bin/env ts-node

/**
 * Script to clear agent configurations
 */

import prisma from '../lib/db';

async function clearAgentConfig(agentName?: string) {
  try {
    if (agentName) {
      console.log(`Clearing configuration for ${agentName}...`);
      const deleted = await prisma.agentConfiguration.deleteMany({
        where: { agentName }
      });
      console.log(`✅ Deleted ${deleted.count} configurations for ${agentName}`);
    } else {
      console.log('Clearing all agent configurations...');
      const deleted = await prisma.agentConfiguration.deleteMany({});
      console.log(`✅ Deleted ${deleted.count} configurations`);
    }
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('❌ AgentConfiguration table does not exist. Run migrations first.');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Get agent name from command line
const agentName = process.argv[2];
clearAgentConfig(agentName).catch(console.error);