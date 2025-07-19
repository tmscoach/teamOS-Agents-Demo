import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse, HandoffEvent, AgentEvent } from '../types';
import { AgentRegistry } from '../registry/AgentRegistry';
import { RoutingService, RoutingDecision } from '../routing/RoutingService';
import { AgentConfigLoader } from '../config/agent-config-loader';
import { routingTools } from '../tools/routing-tools';

export enum OrchestratorState {
  INITIALIZATION = "initialization",
  ASSESSMENT_COORDINATION = "assessment_coordination",
  TRANSFORMATION_PLANNING = "transformation_planning",
  EXECUTION_MONITORING = "execution_monitoring",
  PROGRESS_REVIEW = "progress_review",
  COMPLETION = "completion"
}

export interface OrchestratorMetadata {
  state: OrchestratorState;
  transformationId: string;
  teamId: string;
  currentPhase: string;
  activeAgents: string[];
  completedTasks: string[];
  pendingTasks: string[];
}

export class OrchestratorAgent extends KnowledgeEnabledAgent {
  private routingService: RoutingService;
  private agentRegistry: AgentRegistry;
  
  // State instructions can be used as fallback or reference, but the loaded config takes precedence
  private static readonly STATE_INSTRUCTIONS: Record<OrchestratorState, string> = {
    [OrchestratorState.INITIALIZATION]: `
      Initialize the transformation process:
      - Verify team onboarding is complete
      - Review team context and goals
      - Set up transformation timeline
      - Prepare initial agent assignments
    `,
    [OrchestratorState.ASSESSMENT_COORDINATION]: `
      Coordinate assessment activities:
      - Activate Discovery and Assessment agents
      - Monitor data collection progress
      - Ensure comprehensive team analysis
      - Track assessment milestones
    `,
    [OrchestratorState.TRANSFORMATION_PLANNING]: `
      Plan the transformation approach:
      - Review assessment results
      - Design transformation roadmap
      - Assign agent responsibilities
      - Set measurable objectives
    `,
    [OrchestratorState.EXECUTION_MONITORING]: `
      Monitor transformation execution:
      - Track progress across all agents
      - Identify bottlenecks or issues
      - Coordinate agent handoffs
      - Adjust plans as needed
    `,
    [OrchestratorState.PROGRESS_REVIEW]: `
      Review transformation progress:
      - Analyze metrics and outcomes
      - Gather feedback from all agents
      - Prepare progress reports
      - Plan next phase activities
    `,
    [OrchestratorState.COMPLETION]: `
      Complete transformation cycle:
      - Summarize achievements
      - Document lessons learned
      - Plan for sustainability
      - Prepare for next cycle
    `
  };

  constructor() {
    super({
      name: 'OrchestratorAgent',
      description: 'Manages overall transformation workflow and coordinates other agents',
      handoffDescription: 'Let me orchestrate your team transformation journey',
      instructions: (context: AgentContext) => {
        // This is now used as a fallback - the loaded configuration's systemPrompt takes precedence
        const metadata = context.metadata as OrchestratorMetadata;
        const state = metadata?.state || OrchestratorState.INITIALIZATION;
        const baseInstructions = OrchestratorAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Orchestrator Agent. Your role is to manage the entire transformation workflow and coordinate all other agents.

Current state: ${state}

${baseInstructions}

Remember to:
- Maintain a holistic view of the transformation
- Coordinate agent activities efficiently
- Monitor progress and adjust plans
- Ensure smooth handoffs between agents
- Keep stakeholders informed of progress

When you receive a user message, first analyze their intent and determine if another agent would be better suited to help them. Use the routing tools available to make intelligent routing decisions.`;
      },
      tools: [...routingTools],
      handoffs: [
        {
          targetAgent: 'DiscoveryAgent',
          condition: (context: AgentContext) => {
            const metadata = context.metadata as OrchestratorMetadata;
            return metadata?.state === OrchestratorState.ASSESSMENT_COORDINATION;
          }
        },
        {
          targetAgent: 'AssessmentAgent',
          condition: (context: AgentContext) => {
            const metadata = context.metadata as OrchestratorMetadata;
            return metadata?.state === OrchestratorState.ASSESSMENT_COORDINATION &&
                   metadata?.activeAgents?.includes('DiscoveryAgent');
          }
        },
        {
          targetAgent: 'AlignmentAgent',
          condition: (context: AgentContext) => {
            const metadata = context.metadata as OrchestratorMetadata;
            return metadata?.state === OrchestratorState.TRANSFORMATION_PLANNING;
          }
        },
        {
          targetAgent: 'ProgressMonitor',
          condition: (context: AgentContext) => {
            const metadata = context.metadata as OrchestratorMetadata;
            return metadata?.state === OrchestratorState.PROGRESS_REVIEW;
          }
        }
      ]
    });
    
    // Initialize routing services
    this.agentRegistry = new AgentRegistry();
    this.routingService = new RoutingService(this.agentRegistry, AgentConfigLoader);
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.orchestrator) {
      context.metadata.orchestrator = this.initializeMetadata();
    }

    // First, check if we should route to another agent
    try {
      const routingDecision = await this.routingService.routeMessage(message, context);
      console.log(`[OrchestratorAgent] Routing decision:`, routingDecision);
      
      // If high confidence and different agent, create handoff
      if (routingDecision.confidence > 0.7 && 
          routingDecision.targetAgent !== this.name &&
          routingDecision.targetAgent !== context.currentAgent) {
        
        console.log(`[OrchestratorAgent] Handing off to ${routingDecision.targetAgent} (confidence: ${routingDecision.confidence})`);
        return this.createHandoffResponse(routingDecision, context);
      }
      
      // If low confidence or same agent, handle the query ourselves
      if (routingDecision.confidence <= 0.7) {
        console.log(`[OrchestratorAgent] Low confidence routing (${routingDecision.confidence}), handling query myself`);
        
        // Add routing context to help with response
        const enhancedMessage = this.enhanceMessageWithRoutingContext(message, routingDecision);
        
        // Process with enhanced context
        const response = await super.processMessage(enhancedMessage, context);
        
        // Add routing explanation if helpful
        if (routingDecision.alternativeAgents && routingDecision.alternativeAgents.length > 0) {
          response.message = this.addRoutingClarification(response.message, routingDecision);
        }
        
        return response;
      }
    } catch (error) {
      console.error('[OrchestratorAgent] Routing error:', error);
      // Fall back to normal processing on routing errors
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);
    return response;
  }
  
  /**
   * Create a handoff response based on routing decision
   */
  private createHandoffResponse(routing: RoutingDecision, context: AgentContext): AgentResponse {
    const events: AgentEvent[] = [];
    
    // Create handoff event
    const handoffEvent: HandoffEvent = {
      type: 'handoff',
      timestamp: new Date(),
      agent: this.name,
      targetAgent: routing.targetAgent,
      reason: routing.reasoning,
      context: {
        ...context,
        currentAgent: routing.targetAgent,
        metadata: {
          ...context.metadata,
          routingDecision: routing,
          previousAgent: context.currentAgent
        }
      }
    };
    
    events.push(handoffEvent);
    
    // Create friendly handoff message
    const handoffMessage = `I understand you're asking about ${this.inferTopic(routing)}. Let me connect you with our ${routing.targetAgent.replace('Agent', '')} specialist who can better assist you with this.

${routing.reasoning}`;
    
    return {
      message: handoffMessage,
      context: handoffEvent.context,
      handoff: {
        targetAgent: routing.targetAgent,
        reason: routing.reasoning
      },
      events
    };
  }
  
  /**
   * Enhance message with routing context for better response
   */
  private enhanceMessageWithRoutingContext(message: string, routing: RoutingDecision): string {
    if (routing.alternativeAgents && routing.alternativeAgents.length > 0) {
      const alternatives = routing.alternativeAgents
        .slice(0, 2)
        .map(a => a.agent.replace('Agent', ''))
        .join(' or ');
      
      return `${message}\n\n[Context: User might be asking about ${alternatives} topics, but the query is ambiguous]`;
    }
    return message;
  }
  
  /**
   * Add clarification about available options
   */
  private addRoutingClarification(response: string, routing: RoutingDecision): string {
    if (routing.alternativeAgents && routing.alternativeAgents.length > 0) {
      const options = routing.alternativeAgents
        .slice(0, 3)
        .map(a => `- ${a.agent.replace('Agent', '')}: ${this.getAgentDescription(a.agent)}`)
        .join('\n');
      
      return `${response}

If you'd like help with something specific, I can connect you with:
${options}

Just let me know what you'd like to focus on!`;
    }
    return response;
  }
  
  /**
   * Infer topic from routing decision
   */
  private inferTopic(routing: RoutingDecision): string {
    const topicMap: Record<string, string> = {
      'OnboardingAgent': 'getting started',
      'AssessmentAgent': 'team assessments',
      'ProgressMonitor': 'tracking progress',
      'LearningAgent': 'learning resources',
      'AlignmentAgent': 'team alignment',
      'DiscoveryAgent': 'team discovery',
      'NudgeAgent': 'team nudges',
      'RecognitionAgent': 'team recognition'
    };
    
    return topicMap[routing.targetAgent] || 'that topic';
  }
  
  /**
   * Get agent description for clarification
   */
  private getAgentDescription(agentName: string): string {
    const descriptions: Record<string, string> = {
      'OnboardingAgent': 'Getting started with the platform',
      'AssessmentAgent': 'Team assessments and evaluations',
      'ProgressMonitor': 'Tracking transformation progress',
      'LearningAgent': 'Training and development resources',
      'AlignmentAgent': 'Goal alignment and planning',
      'DiscoveryAgent': 'Team discovery and analysis',
      'NudgeAgent': 'Behavioral nudges and reminders',
      'RecognitionAgent': 'Team achievements and recognition'
    };
    
    return descriptions[agentName] || 'Specialized assistance';
  }

  private initializeMetadata(): OrchestratorMetadata {
    return {
      state: OrchestratorState.INITIALIZATION,
      transformationId: `transform-${Date.now()}`,
      teamId: '',
      currentPhase: 'initialization',
      activeAgents: [],
      completedTasks: [],
      pendingTasks: []
    };
  }
}

export function createOrchestratorAgent(): OrchestratorAgent {
  return new OrchestratorAgent();
}