import { NextResponse } from "next/server";
import { AgentRouter, ContextManager } from '@/src/lib/agents';
import { createOnboardingAgent } from '@/src/lib/agents/implementations/onboarding-agent';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
  try {
    // Create test data
    const testUserId = 'test-user-' + uuidv4();
    const testTeamId = 'test-team-' + uuidv4();
    const testConversationId = 'test-conv-' + uuidv4();

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        clerkId: 'test-clerk-' + uuidv4(),
        email: `test-${uuidv4()}@example.com`,
        name: 'Test User',
        role: 'MANAGER',
      }
    });

    // Create test team
    const team = await prisma.team.create({
      data: {
        id: testTeamId,
        name: 'Test Team',
        department: 'Engineering',
        managerId: user.id,
        transformationStatus: 'active',
      }
    });

    // Create test conversation
    const conversation = await prisma.conversation.create({
      data: {
        id: testConversationId,
        teamId: team.id,
        managerId: user.id,
        currentAgent: 'OnboardingAgent',
        phase: 'onboarding',
        contextData: {},
      }
    });

    // Initialize services
    const contextManager = new ContextManager();
    const router = new AgentRouter({ contextManager });
    
    // Register agent
    const onboardingAgent = createOnboardingAgent();
    router.registerAgent(onboardingAgent);

    // Create context
    const context = {
      conversationId: testConversationId,
      teamId: testTeamId,
      managerId: user.id,
      currentAgent: 'OnboardingAgent',
      transformationPhase: 'discovery' as const,
      messageHistory: [],
      variables: {},
      metadata: {
        onboarding: {
          state: 'GATHERING_INITIAL_INFO',
          capturedFields: {},
          qualityMetrics: {
            completenessScore: 0,
            depthScore: 0,
            clarityScore: 0
          }
        }
      }
    };

    // Set context in manager first
    await contextManager.setContext(testConversationId, context);

    // Test message that should trigger guardrail
    const testMessage = "I HATE THIS STUPID SYSTEM AND EVERYTHING ABOUT IT";
    
    console.log('Testing message:', testMessage);

    // Process message
    const response = await router.routeMessage(testMessage, context);

    console.log('Response events:', response.events.length);
    console.log('Guardrail events:', response.events.filter(e => e.type === 'guardrail'));

    // Save events to database
    for (const event of response.events) {
      await prisma.agentEvent.create({
        data: {
          conversationId: testConversationId,
          agent: event.agent,
          type: event.type,
          content: JSON.stringify(event),
          timestamp: event.timestamp,
        }
      });
    }

    // Save guardrail checks
    const guardrailEvents = response.events.filter(e => e.type === 'guardrail');
    if (guardrailEvents.length > 0) {
      await prisma.guardrailCheck.createMany({
        data: guardrailEvents.map((event: any) => ({
          conversationId: testConversationId,
          agentName: event.agent,
          guardrailType: event.guardrailName || 'unknown',
          input: testMessage,
          passed: event.result?.passed || false,
          severity: event.result?.passed ? null : 'medium',
          reasoning: JSON.stringify(event.result),
          timestamp: event.timestamp
        }))
      });
    }

    // Check database
    const savedEvents = await prisma.agentEvent.findMany({
      where: { conversationId: testConversationId },
      orderBy: { timestamp: 'desc' }
    });

    const savedGuardrails = await prisma.guardrailCheck.findMany({
      where: { conversationId: testConversationId },
      orderBy: { timestamp: 'desc' }
    });

    // Clean up test data
    await prisma.guardrailCheck.deleteMany({ where: { conversationId: testConversationId } });
    await prisma.agentEvent.deleteMany({ where: { conversationId: testConversationId } });
    await prisma.message.deleteMany({ where: { conversationId: testConversationId } });
    await prisma.conversation.delete({ where: { id: testConversationId } });
    await prisma.team.delete({ where: { id: testTeamId } });
    await prisma.user.delete({ where: { id: testUserId } });

    return NextResponse.json({
      success: true,
      response: {
        message: response.message,
        eventsCount: response.events.length,
        guardrailEvents: guardrailEvents.map((e: any) => ({
          guardrailName: e.guardrailName,
          passed: e.result?.passed,
          reason: e.result?.reason
        }))
      },
      savedToDb: {
        agentEvents: savedEvents.length,
        guardrailChecks: savedGuardrails.length,
        failedGuardrails: savedGuardrails.filter(g => !g.passed).length
      }
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