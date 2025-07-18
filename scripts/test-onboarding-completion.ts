#!/usr/bin/env tsx

/**
 * Test script to verify onboarding completion logic
 */

import { OnboardingAgent } from '../src/lib/agents/implementations/onboarding-agent';
import { AgentContext } from '../src/lib/agents/types';

async function testOnboardingCompletion() {
  console.log('Testing OnboardingAgent completion logic...\n');
  
  // Create a mock context with all required fields captured
  const mockContext: AgentContext = {
    conversationId: 'test-conv-123',
    teamId: 'test-team-123',
    currentAgent: 'OnboardingAgent',
    messageHistory: [],
    metadata: {
      onboarding: {
        capturedFields: {
          user_name: 'Test User',
          user_role: 'Engineering Manager',
          team_size: 5,
          organization: 'Test Corp',
          primary_challenge: 'Team alignment'
        },
        requiredFieldsStatus: {
          user_name: true,
          user_role: true,
          team_size: true,
          organization: true,
          primary_challenge: true
        },
        isComplete: false,
        state: 'RECAP_AND_HANDOFF',
        startTime: new Date(),
        userRole: 'MANAGER',
        qualityMetrics: {
          rapportScore: 0,
          managerConfidence: 'low',
          completionPercentage: 100
        },
        stateTransitions: []
      }
    }
  };
  
  try {
    // Initialize the agent
    const agent = new OnboardingAgent();
    
    // Test 1: Check if metadata gets updated with isComplete
    console.log('Test 1: Checking if isComplete is set when all fields are captured');
    const response1 = await agent.processMessage('Thanks!', mockContext);
    console.log('isComplete after processing:', mockContext.metadata.onboarding?.isComplete);
    console.log('Response contains completion message:', response1.message?.includes("Let's begin building something amazing together"));
    console.log('\n---\n');
    
    // Test 2: Check with isComplete already true
    console.log('Test 2: Checking response when isComplete is already true');
    mockContext.metadata.onboarding!.isComplete = true;
    const response2 = await agent.processMessage('Hello again', mockContext);
    console.log('Response contains completion message:', response2.message?.includes("Let's begin building something amazing together"));
    console.log('Handoff present:', !!response2.handoff);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testOnboardingCompletion().catch(console.error);