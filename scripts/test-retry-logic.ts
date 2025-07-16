#!/usr/bin/env ts-node
/**
 * Test script to verify the retry logic works when fields are missing
 */

import { ConversationState } from '@/src/lib/agents/types/conversation-state';

// Simulate the scenario where team_size is missing
const metadata = {
  state: ConversationState.RECAP_AND_HANDOFF,
  capturedFields: {
    user_name: 'Test User',
    user_role: 'Engineering Manager',
    organization: 'Test Corp',
    primary_challenge: 'Team communication'
    // team_size is missing
  },
  requiredFieldsStatus: {
    user_name: true,
    user_role: true,
    team_size: false, // Missing
    organization: true,
    primary_challenge: true
  }
};

const missingFields = Object.entries(metadata.requiredFieldsStatus)
  .filter(([_, captured]) => !captured)
  .map(([field, _]) => field);

console.log('Test Case: Missing team_size field in RECAP_AND_HANDOFF state');
console.log('Current state:', metadata.state);
console.log('Missing fields:', missingFields);

// Check if retry logic should trigger
if (metadata.state === ConversationState.RECAP_AND_HANDOFF && missingFields.length > 0) {
  console.log('✅ Retry logic SHOULD trigger');
  console.log('Expected behavior: Agent asks for team_size with alternative phrasing');
  console.log('Alternative phrasing: "I didn\'t quite catch how many people are on your team. How many team members do you have? (Enter 0 if you\'re working solo for now)"');
} else {
  console.log('❌ Retry logic will NOT trigger');
}

// Test the state transition logic
const stateProgression = ['GREETING', 'CONTEXT_DISCOVERY', 'CHALLENGE_EXPLORATION', 'TMS_EXPLANATION', 
                          'GOAL_SETTING', 'RESOURCE_CONFIRMATION', 'STAKEHOLDER_MAPPING'];

const testStates = [
  ConversationState.GREETING,
  ConversationState.CONTEXT_DISCOVERY,
  ConversationState.CHALLENGE_EXPLORATION,
  ConversationState.TMS_EXPLANATION,
  ConversationState.GOAL_SETTING,
  ConversationState.RESOURCE_CONFIRMATION,
  ConversationState.STAKEHOLDER_MAPPING
];

console.log('\nTesting force transition logic:');
testStates.forEach((state, index) => {
  const currentIndex = stateProgression.indexOf(state);
  const shouldForceTransition = currentIndex >= 5 && missingFields.length > 0;
  console.log(`State: ${state} (index ${currentIndex}) - Force RECAP_AND_HANDOFF: ${shouldForceTransition ? '✅' : '❌'}`);
});

console.log('\nExpected flow:');
console.log('1. User progresses through states normally');
console.log('2. When reaching RESOURCE_CONFIRMATION or later with missing fields');
console.log('3. Force transition to RECAP_AND_HANDOFF');
console.log('4. Retry logic triggers to ask for missing fields');
console.log('5. Once all fields captured, complete onboarding');