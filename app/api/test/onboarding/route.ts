import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingAgent } from '@/src/lib/agents/implementations/onboarding-agent';
import { AgentRouter, ContextManager } from '@/src/lib/agents';
import OpenAI from 'openai';
import { ConversationState } from '@/src/lib/agents/implementations/onboarding-agent';

// Helper function to extract team info from message
function extractTeamInfoFromMessage(message: string): Record<string, any> {
  const extracted: Record<string, any> = {};
  
  // Extract name
  const nameMatch = message.match(/(?:i'm|i am|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch) {
    extracted.manager_name = nameMatch[1];
  }
  
  // Extract team size
  const teamSizeMatch = message.match(/(\d+)\s*(?:people|members|employees|staff|direct reports)/i);
  if (teamSizeMatch) {
    extracted.team_size = parseInt(teamSizeMatch[1]);
  }
  
  // Extract department
  const deptMatch = message.match(/(?:in|from|work in|manage)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:department|team|division)/i);
  if (deptMatch) {
    extracted.department = deptMatch[1];
  }
  
  // Extract challenge keywords
  if (message.toLowerCase().includes('challenge') || message.toLowerCase().includes('problem') || message.toLowerCase().includes('issue')) {
    extracted.primary_challenge = message;
  }
  
  return extracted;
}

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

// System prompts for different conversation states
const SYSTEM_PROMPTS: Record<string, string> = {
  greeting: `You are an OnboardingAgent for TMS (Team Management Systems). 
Your goal is to warmly welcome the user and learn their name and role. 
Be friendly, professional, and encouraging. Ask for their name and role in one message.
Keep responses concise (2-3 sentences).`,
  
  context_discovery: `You are learning about the user's team context.
Ask about their team size, structure, and department. 
Keep it conversational and show genuine interest.
Keep responses concise (2-3 sentences).`,
  
  challenge_exploration: `You are exploring the team's challenges.
Ask about their biggest team challenge or pain point.
Be empathetic and show you understand their situation.
Keep responses concise (2-3 sentences).`,
  
  tms_explanation: `You are explaining how TMS can help.
Based on their challenge, briefly explain how TMS's 40+ years of research can help.
Mention the multi-phase approach: assessment, analysis, transformation, and monitoring.
Keep responses concise (3-4 sentences).`,
};

export async function POST(req: NextRequest) {
  try {
    const { message, conversationState = 'greeting', conversationHistory = [] } = await req.json();
    
    // Extract team information from the message
    const extractedData = extractTeamInfoFromMessage(message);
    
    // Determine conversation state based on extracted data
    let nextState = conversationState;
    if (conversationState === 'greeting' && extractedData.manager_name) {
      nextState = 'context_discovery';
    } else if (conversationState === 'context_discovery' && extractedData.team_size) {
      nextState = 'challenge_exploration';
    } else if (conversationState === 'challenge_exploration' && extractedData.primary_challenge) {
      nextState = 'tms_explanation';
    }
    
    let response: string;
    
    // Try to use OpenAI if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const systemPrompt = SYSTEM_PROMPTS[conversationState] || SYSTEM_PROMPTS.greeting;
        
        // Build conversation history for context
        const messages: any[] = [
          { role: "system", content: systemPrompt }
        ];
        
        // Add previous messages if any
        conversationHistory.forEach((msg: any) => {
          messages.push({ role: msg.role, content: msg.content });
        });
        
        // Add current user message
        messages.push({ role: "user", content: message });
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages,
          max_tokens: 150,
          temperature: 0.7,
        });
        
        response = completion.choices[0].message.content || "I'm here to help you with your team transformation journey.";
      } catch (error) {
        console.error('OpenAI error:', error);
        // Fallback to mock response
        response = getMockResponse(conversationState, message, extractedData);
      }
    } else {
      // Use mock responses if OpenAI not configured
      response = getMockResponse(conversationState, message, extractedData);
    }
    
    return NextResponse.json({
      message: response,
      currentAgent: 'OnboardingAgent',
      extractedData,
      conversationState: nextState,
      nextState
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function getMockResponse(state: string, message: string, extractedData: any): string {
  const mockResponses: Record<string, string> = {
    greeting: "Welcome to TMS! I'm your onboarding guide. I'm here to help you get started with transforming your team. Could you tell me your name and a bit about your role?",
    context_discovery: `Nice to meet you${extractedData.manager_name ? ', ' + extractedData.manager_name : ''}! Can you tell me about your team? How many people do you manage?`,
    challenge_exploration: `A team of ${extractedData.team_size || 'that size'} - that's great! What would you say is the biggest challenge your team is facing right now?`,
    tms_explanation: "I understand. That's a common challenge many teams face. TMS uses proven methodologies from 40+ years of research to help teams like yours improve. We'll start with assessment, then analysis, transformation, and ongoing monitoring.",
  };
  
  return mockResponses[state] || mockResponses.greeting;
}