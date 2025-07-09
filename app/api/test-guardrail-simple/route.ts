import { NextResponse } from "next/server";
import { Agent } from '@/src/lib/agents/base';
import { AgentConfig, AgentContext, AgentResponse } from '@/src/lib/agents/types';
import { OnboardingGuardrails } from '@/src/lib/agents/guardrails/onboarding-guardrails';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Create a simple test agent with just guardrails
class TestAgent extends Agent {
  constructor() {
    const config: AgentConfig = {
      name: 'TestAgent',
      description: 'Test agent for guardrail testing',
      handoffDescription: 'Test agent',
      instructions: 'Test agent instructions',
      inputGuardrails: OnboardingGuardrails.createGuardrails()
    };
    super(config);
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    const events = [];
    
    // Validate input with guardrails
    const validationResult = await this.validateInput(message, context);
    events.push(...validationResult.events);

    // If validation failed, return early with the guardrail failure message
    if (!validationResult.passed) {
      return this.buildResponse(context, events, {
        message: `Guardrail failed: ${validationResult.failureReason}`,
      });
    }

    // Otherwise return success
    return this.buildResponse(context, events, {
      message: 'Message processed successfully',
    });
  }
}

export async function POST() {
  try {
    // Create test IDs
    const testConversationId = 'test-conv-' + uuidv4();

    // Create test agent
    const agent = new TestAgent();

    // Create test context
    const context: AgentContext = {
      conversationId: testConversationId,
      teamId: 'test-team',
      managerId: 'test-manager',
      currentAgent: 'TestAgent',
      transformationPhase: 'discovery',
      messageHistory: [],
      variables: {},
      metadata: {
        onboarding: {
          startTime: new Date(),
          currentTopic: 'general'
        }
      }
    };

    // Test messages
    const testMessages = [
      "I HATE THIS STUPID SYSTEM AND EVERYTHING ABOUT IT", // Should fail ALL CAPS
      "I hate this fucking system", // Should fail inappropriate language
      "This is a normal message", // Should pass
    ];

    const results = [];

    for (const message of testMessages) {
      console.log('Testing message:', message);
      
      const response = await agent.processMessage(message, context);
      
      const guardrailEvents = response.events.filter(e => e.type === 'guardrail');
      const failedGuardrails = guardrailEvents.filter((e: any) => !e.result?.passed);
      
      results.push({
        message,
        responseMessage: response.message,
        totalGuardrails: guardrailEvents.length,
        failedGuardrails: failedGuardrails.length,
        failures: failedGuardrails.map((e: any) => ({
          guardrailName: e.guardrailName,
          reason: e.result?.reason
        }))
      });

      // Skip database for now - just testing logic
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}