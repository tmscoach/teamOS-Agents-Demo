import { AgentCapability } from '../registry/AgentRegistry';
import { AgentContext } from '../types';

export const ROUTING_SYSTEM_PROMPT = `You are an intelligent routing system for a team transformation platform. Your role is to analyze user messages and determine which specialized agent should handle the request.

You must respond with a JSON object containing:
- targetAgent: The name of the agent to route to
- confidence: A number between 0 and 1 indicating your confidence
- reasoning: A brief explanation of why you chose this agent
- alternativeAgents: An array of other possible agents with their confidence scores

Consider:
1. The user's message content and intent
2. The user's current journey phase
3. Agent prerequisites and capabilities
4. Previous conversation context

Be decisive when the intent is clear, but suggest the OrchestratorAgent when the query is ambiguous.`;

export const INTENT_CLASSIFICATION_PROMPT = `Analyze the following user message and classify their primary intent. Consider keywords, context, and typical user patterns.

Categories:
- onboarding: Getting started, new user questions
- assessment: Team evaluation, questionnaires, analysis
- progress: Tracking, metrics, status updates
- learning: Training, resources, development
- alignment: Goals, objectives, stakeholder management
- general: General questions, unclear intent

Respond with the most likely category and a confidence score (0-1).`;

export function buildRoutingPrompt(
  message: string,
  context: AgentContext,
  capabilities: AgentCapability[]
): string {
  const journeyPhase = context.metadata.journeyPhase || context.metadata.journeyStatus || 'unknown';
  const currentAgent = context.currentAgent || 'none';
  
  // Build capability descriptions
  const capabilityDescriptions = capabilities.map(cap => {
    const prereqs = cap.prerequisites?.length ? `Prerequisites: ${cap.prerequisites.join(', ')}` : '';
    const phases = cap.relevantPhases?.length ? `Relevant phases: ${cap.relevantPhases.join(', ')}` : '';
    const keywords = cap.keywords?.length ? `Keywords: ${cap.keywords.join(', ')}` : '';
    
    return `
${cap.name}:
- Description: ${cap.description}
- Examples: ${cap.examples.join('; ')}
${prereqs}
${phases}
${keywords}`.trim();
  }).join('\n\n');
  
  return `
User Context:
- Current Journey Phase: ${journeyPhase}
- Current Agent: ${currentAgent}
- Has Team: ${context.teamId ? 'Yes' : 'No'}
- Message Count: ${context.messages?.length || 0}

Available Agents and Their Capabilities:
${capabilityDescriptions}

User Message: "${message}"

Based on the user's message and context, determine which agent should handle this request. Consider:
1. Does the message match any agent's example queries?
2. Are the agent's prerequisites met?
3. Is the agent relevant to the user's current journey phase?
4. Which keywords in the message align with which agents?

Respond with a JSON object containing your routing decision.`;
}

export function parseRoutingResponse(response: string): {
  targetAgent: string;
  confidence: number;
  reasoning: string;
  alternativeAgents?: Array<{agent: string; confidence: number}>;
} | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in routing response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.targetAgent || typeof parsed.confidence !== 'number') {
      console.error('Invalid routing response format');
      return null;
    }
    
    return {
      targetAgent: parsed.targetAgent,
      confidence: Math.max(0, Math.min(1, parsed.confidence)), // Clamp to 0-1
      reasoning: parsed.reasoning || '',
      alternativeAgents: parsed.alternativeAgents || []
    };
  } catch (error) {
    console.error('Failed to parse routing response:', error);
    return null;
  }
}