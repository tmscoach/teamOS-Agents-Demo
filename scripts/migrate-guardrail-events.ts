#!/usr/bin/env node

/**
 * Script to migrate guardrail events from AgentEvent to GuardrailCheck table
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { GuardrailTrackingService } from '@/src/lib/services/guardrail-tracking';

const prisma = new PrismaClient();

async function migrateGuardrailEvents() {
  console.log('🔄 Starting guardrail event migration...');

  try {
    // Find all guardrail events
    const guardrailEvents = await prisma.agentEvent.findMany({
      where: {
        type: 'guardrail'
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    console.log(`Found ${guardrailEvents.length} guardrail events to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const event of guardrailEvents) {
      try {
        const eventData = JSON.parse(event.content as string);
        
        // Check if already migrated
        const existing = await prisma.guardrailCheck.findFirst({
          where: {
            conversationId: event.conversationId,
            timestamp: event.timestamp
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Extract guardrail data
        const guardrailResult = eventData.result || {};
        
        // Create GuardrailCheck record
        await prisma.guardrailCheck.create({
          data: {
            conversationId: event.conversationId,
            agentName: eventData.agent || event.agent,
            guardrailType: eventData.guardrailName || 'unknown',
            input: eventData.input || '',
            passed: guardrailResult.passed || false,
            severity: guardrailResult.severity || null,
            reasoning: guardrailResult.reasoning || JSON.stringify(guardrailResult),
            result: guardrailResult,
            timestamp: event.timestamp
          }
        });

        migrated++;
        
        if (migrated % 10 === 0) {
          console.log(`Progress: ${migrated} migrated, ${skipped} skipped`);
        }
      } catch (error) {
        console.error(`Error migrating event ${event.id}:`, error);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Total events: ${guardrailEvents.length}`);
    console.log(`   - Migrated: ${migrated}`);
    console.log(`   - Skipped (already exists): ${skipped}`);
    console.log(`   - Errors: ${guardrailEvents.length - migrated - skipped}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateGuardrailEvents();