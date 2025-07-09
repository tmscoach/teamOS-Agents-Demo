import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

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
- Keep stakeholders informed of progress`;
      },
      tools: [],
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
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.orchestrator) {
      context.metadata.orchestrator = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add orchestration-specific logic here

    return response;
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