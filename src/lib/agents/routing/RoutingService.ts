import OpenAI from 'openai';
import { AgentRegistry, AgentCapability } from '../registry/AgentRegistry';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { AgentContext } from '../types';
import { 
  ROUTING_SYSTEM_PROMPT, 
  INTENT_CLASSIFICATION_PROMPT,
  buildRoutingPrompt,
  parseRoutingResponse
} from './prompts';

export interface RoutingDecision {
  targetAgent: string;
  confidence: number;
  reasoning: string;
  suggestedContext?: Record<string, any>;
  alternativeAgents?: Array<{agent: string; confidence: number}>;
}

export class RoutingService {
  private openai: OpenAI;
  
  constructor(
    private agentRegistry: AgentRegistry,
    private configLoader: typeof AgentConfigLoader
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze user intent for quick routing decisions
   */
  async analyzeIntent(message: string, context: AgentContext): Promise<string> {
    try {
      // Quick pattern matching for obvious cases
      const lowerMessage = message.toLowerCase();
      
      // Onboarding patterns
      if (lowerMessage.match(/\b(hi|hello|new|start|begin|getting started|setup)\b/)) {
        if (context.metadata.journeyPhase === 'ONBOARDING' || 
            context.metadata.journeyStatus === 'ONBOARDING') {
          return 'onboarding';
        }
      }
      
      // Assessment patterns
      if (lowerMessage.match(/\b(assessment|evaluate|analyze|test|questionnaire|tmp|team signals)\b/)) {
        return 'assessment';
      }
      
      // Progress patterns
      if (lowerMessage.match(/\b(progress|track|monitor|metrics|report|status|how.*doing)\b/)) {
        return 'progress';
      }
      
      // Learning patterns
      if (lowerMessage.match(/\b(learn|training|education|development|course|resource)\b/)) {
        return 'learning';
      }
      
      // If no clear pattern, use LLM for classification
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 100
      });
      
      const content = response.choices[0]?.message?.content || '';
      const category = content.match(/\b(onboarding|assessment|progress|learning|alignment|general)\b/i)?.[0];
      
      return category?.toLowerCase() || 'general';
    } catch (error) {
      console.error('Intent analysis failed:', error);
      return 'general';
    }
  }

  /**
   * Route message to appropriate agent using LLM
   */
  async routeMessage(message: string, context: AgentContext): Promise<RoutingDecision> {
    try {
      // Stage 1: Quick intent classification
      const intent = await this.analyzeIntent(message, context);
      console.log(`[RoutingService] Detected intent: ${intent}`);
      
      // Get applicable agent capabilities
      const capabilities = await this.agentRegistry.getCapabilitiesForRouting(context);
      
      // Handle obvious cases with high confidence
      if (intent === 'onboarding' && context.metadata.journeyPhase === 'ONBOARDING') {
        return {
          targetAgent: 'OnboardingAgent',
          confidence: 0.95,
          reasoning: 'User is in onboarding phase and asking getting started questions'
        };
      }
      
      if (intent === 'progress' && context.metadata.journeyPhase !== 'ONBOARDING') {
        const hasProgress = capabilities.find(c => c.name === 'ProgressMonitor');
        if (hasProgress) {
          return {
            targetAgent: 'ProgressMonitor',
            confidence: 0.9,
            reasoning: 'User is asking about progress tracking and has completed onboarding'
          };
        }
      }
      
      // Stage 2: LLM-based routing for nuanced decisions
      const routingPrompt = buildRoutingPrompt(message, context, capabilities);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: ROUTING_SYSTEM_PROMPT },
          { role: 'user', content: routingPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices[0]?.message?.content || '';
      const routingDecision = parseRoutingResponse(content);
      
      if (!routingDecision) {
        // Fallback to OrchestratorAgent
        return {
          targetAgent: 'OrchestratorAgent',
          confidence: 0.5,
          reasoning: 'Unable to determine specific agent, defaulting to orchestrator'
        };
      }
      
      // Validate the target agent exists in capabilities
      const targetCapability = capabilities.find(c => c.name === routingDecision.targetAgent);
      if (!targetCapability) {
        console.warn(`[RoutingService] Target agent ${routingDecision.targetAgent} not in available capabilities`);
        return {
          targetAgent: 'OrchestratorAgent',
          confidence: 0.5,
          reasoning: 'Selected agent not available, defaulting to orchestrator',
          alternativeAgents: routingDecision.alternativeAgents
        };
      }
      
      // Add context suggestions based on routing
      const suggestedContext: Record<string, any> = {};
      
      if (routingDecision.targetAgent === 'AssessmentAgent') {
        suggestedContext.assessmentIntent = intent;
        suggestedContext.routingReason = routingDecision.reasoning;
      }
      
      return {
        ...routingDecision,
        suggestedContext
      };
      
    } catch (error) {
      console.error('[RoutingService] Routing failed:', error);
      
      // Fallback to OrchestratorAgent on error
      return {
        targetAgent: 'OrchestratorAgent',
        confidence: 0.5,
        reasoning: 'Routing analysis failed, defaulting to orchestrator for assistance'
      };
    }
  }

  /**
   * Check if a specific agent can handle a message
   */
  async canAgentHandle(
    agentName: string, 
    message: string, 
    context: AgentContext
  ): Promise<{ canHandle: boolean; confidence: number }> {
    try {
      const capability = await this.agentRegistry.getCapabilityByAgent(agentName);
      if (!capability) {
        return { canHandle: false, confidence: 0 };
      }
      
      // Check prerequisites
      if (!this.agentRegistry.checkPrerequisites(agentName, context)) {
        return { canHandle: false, confidence: 0 };
      }
      
      // Check keywords
      const lowerMessage = message.toLowerCase();
      let keywordMatches = 0;
      
      if (capability.keywords) {
        for (const keyword of capability.keywords) {
          if (lowerMessage.includes(keyword)) {
            keywordMatches++;
          }
        }
      }
      
      // Check example similarity
      let exampleMatch = false;
      for (const example of capability.examples) {
        if (this.calculateSimilarity(message, example) > 0.7) {
          exampleMatch = true;
          break;
        }
      }
      
      // Calculate confidence
      let confidence = 0;
      if (keywordMatches > 0) confidence += 0.3 * Math.min(keywordMatches / 3, 1);
      if (exampleMatch) confidence += 0.4;
      if (capability.relevantPhases?.includes(context.metadata.journeyPhase as any)) confidence += 0.3;
      
      return { 
        canHandle: confidence > 0.5, 
        confidence: Math.min(confidence, 1) 
      };
      
    } catch (error) {
      console.error(`[RoutingService] Error checking if ${agentName} can handle message:`, error);
      return { canHandle: false, confidence: 0 };
    }
  }

  /**
   * Simple similarity calculation between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().split(/\s+/);
    const s2 = str2.toLowerCase().split(/\s+/);
    
    const intersection = s1.filter(word => s2.includes(word));
    const union = [...new Set([...s1, ...s2])];
    
    return intersection.length / union.length;
  }
}