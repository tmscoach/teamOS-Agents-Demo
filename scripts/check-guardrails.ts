#!/usr/bin/env node

import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function checkGuardrails() {
  try {
    // Check GuardrailCheck table
    console.log('Checking GuardrailCheck table...');
    const guardrailChecks = await prisma.guardrailCheck.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    console.log(`Found ${guardrailChecks.length} guardrail checks in GuardrailCheck table`);
    guardrailChecks.forEach(check => {
      console.log(`- ${check.guardrailType}: passed=${check.passed}, input="${check.input?.substring(0, 50)}..."`);
    });

    // Check AgentEvent table for guardrail events
    console.log('\nChecking AgentEvent table for guardrail events...');
    const guardrailEvents = await prisma.agentEvent.findMany({
      where: { type: 'guardrail' },
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    console.log(`Found ${guardrailEvents.length} guardrail events in AgentEvent table`);
    guardrailEvents.forEach(event => {
      const content = JSON.parse(event.content as string);
      console.log(`- ${content.guardrailName}: passed=${content.result.passed}, warning=${content.result.metadata?.warning || 'none'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGuardrails();