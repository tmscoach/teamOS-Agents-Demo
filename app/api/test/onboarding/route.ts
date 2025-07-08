import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingAgent } from '@/src/lib/agents/implementations/onboarding-agent';
import { AgentRouter, ContextManager } from '@/src/lib/agents';

// Mock context for testing without auth
const mockContext = {
  teamId: 'test-team-123',
  managerId: 'test-manager-123',
  transformationPhase: 'onboarding' as const,
  currentAgent: 'OnboardingAgent',
  conversationId: 'test-conv-123',
  messageHistory: [],
  metadata: {}
};

// Initialize router with onboarding agent
const contextManager = new ContextManager();
const router = new AgentRouter({ contextManager });
const onboardingAgent = createOnboardingAgent();
router.registerAgent(onboardingAgent);

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    // For testing, we'll use a mock response since OpenAI isn't configured
    // In production, this would call the actual agent
    const mockResponses: Record<string, string> = {
      default: "Welcome to TMS! I'm your onboarding guide. I'm here to help you get started with transforming your team. Could you tell me your name and a bit about what brings you here today?",
      name: "Nice to meet you, {name}! I'm excited to help you on this journey. Can you tell me about your team? How many people do you manage and how long have you been working together?",
      team: "That's great! A team of {size} people with {tenure} of experience together. What would you say is the biggest challenge your team is facing right now?",
      challenge: "I understand. {challenge} is indeed a common challenge that many teams face. The good news is that TMS has specific tools and methodologies to address this. Let me tell you a bit about how we can help...",
      tms: "Based on what you've shared, I'd recommend starting with our Team Signals assessment. This will give us a baseline understanding of your team's current state. What are your main goals for this transformation?",
      goals: "Those are excellent goals! To make sure we set you up for success, can you tell me about your timeline and any budget considerations?",
      resources: "Perfect! I have all the information I need to get you started. Let me summarize what we've discussed...",
      handoff: "You're all set! I'm going to hand you off to our Assessment Agent who will guide you through the Team Signals assessment. They'll help you understand which assessment is best for your team's current needs."
    };

    // Simple keyword matching for demo purposes
    let response = mockResponses.default;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('name is') || lowerMessage.includes("i'm ") || lowerMessage.includes('i am')) {
      response = mockResponses.name.replace('{name}', message.split(/name is|i'm |i am /i)[1]?.split(' ')[0] || 'there');
    } else if (lowerMessage.includes('team') || lowerMessage.includes('people') || lowerMessage.includes('manage')) {
      response = mockResponses.team
        .replace('{size}', message.match(/\d+/)?.[0] || 'several')
        .replace('{tenure}', message.match(/\d+\s*(year|month)/i)?.[0] || 'some time');
    } else if (lowerMessage.includes('challenge') || lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
      response = mockResponses.challenge.replace('{challenge}', 'This');
    } else if (lowerMessage.includes('understand') || lowerMessage.includes('got it') || lowerMessage.includes('yes')) {
      response = mockResponses.tms;
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      response = mockResponses.goals;
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('timeline') || lowerMessage.includes('month')) {
      response = mockResponses.resources;
    } else if (lowerMessage.includes('ready') || lowerMessage.includes('let\'s') || lowerMessage.includes('sounds good')) {
      response = mockResponses.handoff;
    }

    // Simulate extracted data
    const extractedData: Record<string, any> = {};
    if (lowerMessage.includes('name is') || lowerMessage.includes("i'm ")) {
      extractedData.name = message.split(/name is|i'm |i am /i)[1]?.split(' ')[0];
    }
    if (message.match(/\d+\s*people/i)) {
      extractedData.team_size = parseInt(message.match(/\d+/)?.[0] || '0');
    }
    if (lowerMessage.includes('challenge')) {
      extractedData.primary_challenge = message;
    }

    return NextResponse.json({
      message: response,
      currentAgent: 'OnboardingAgent',
      extractedData,
      conversationState: 'active'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}