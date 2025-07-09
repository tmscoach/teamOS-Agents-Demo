import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum DiscoveryState {
  INTRODUCTION = "introduction",
  TEAM_STRUCTURE = "team_structure",
  WORK_PROCESSES = "work_processes",
  COMMUNICATION_PATTERNS = "communication_patterns",
  CHALLENGES_IDENTIFICATION = "challenges_identification",
  OPPORTUNITIES_EXPLORATION = "opportunities_exploration",
  DATA_SYNTHESIS = "data_synthesis"
}

export interface DiscoveryMetadata {
  state: DiscoveryState;
  discoveredData: {
    teamStructure?: any;
    workProcesses?: any;
    communicationPatterns?: any;
    challenges?: string[];
    opportunities?: string[];
  };
  dataCompleteness: number;
}

export class DiscoveryAgent extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<DiscoveryState, string> = {
    [DiscoveryState.INTRODUCTION]: `
      Introduce the discovery process:
      - Explain the purpose of team discovery
      - Set expectations for the assessment
      - Build trust and rapport
      - Outline the discovery journey
    `,
    [DiscoveryState.TEAM_STRUCTURE]: `
      Explore team structure and composition:
      - Map team roles and responsibilities
      - Understand reporting relationships
      - Identify key team members
      - Document team demographics
    `,
    [DiscoveryState.WORK_PROCESSES]: `
      Analyze work processes and workflows:
      - Map current work processes
      - Identify process bottlenecks
      - Understand task dependencies
      - Document workflow patterns
    `,
    [DiscoveryState.COMMUNICATION_PATTERNS]: `
      Examine communication patterns:
      - Map communication channels
      - Identify collaboration tools
      - Understand meeting structures
      - Document information flow
    `,
    [DiscoveryState.CHALLENGES_IDENTIFICATION]: `
      Identify team challenges:
      - Explore current pain points
      - Understand recurring issues
      - Identify skill gaps
      - Document resource constraints
    `,
    [DiscoveryState.OPPORTUNITIES_EXPLORATION]: `
      Explore improvement opportunities:
      - Identify quick wins
      - Explore growth areas
      - Understand team aspirations
      - Document potential improvements
    `,
    [DiscoveryState.DATA_SYNTHESIS]: `
      Synthesize discovery findings:
      - Summarize key insights
      - Identify patterns and themes
      - Prepare assessment handoff
      - Document recommendations
    `
  };

  constructor() {
    super({
      name: 'DiscoveryAgent',
      description: 'Conducts team assessment and gathers comprehensive data',
      handoffDescription: 'Let me help discover insights about your team',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as DiscoveryMetadata;
        const state = metadata?.state || DiscoveryState.INTRODUCTION;
        const baseInstructions = DiscoveryAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Discovery Agent. Your role is to conduct comprehensive team discovery and gather data for assessment.

Current state: ${state}

${baseInstructions}

Remember to:
- Ask probing but respectful questions
- Listen actively and empathetically
- Document findings systematically
- Identify patterns and insights
- Prepare data for assessment phase`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'AssessmentAgent',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as DiscoveryMetadata;
          return metadata?.state === DiscoveryState.DATA_SYNTHESIS &&
                 metadata?.dataCompleteness >= 80;
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.discovery) {
      context.metadata.discovery = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add discovery-specific logic here
    this.updateDataCompleteness(context.metadata.discovery as DiscoveryMetadata);

    return response;
  }

  private initializeMetadata(): DiscoveryMetadata {
    return {
      state: DiscoveryState.INTRODUCTION,
      discoveredData: {
        challenges: [],
        opportunities: []
      },
      dataCompleteness: 0
    };
  }

  private updateDataCompleteness(metadata: DiscoveryMetadata) {
    const dataPoints = [
      metadata.discoveredData.teamStructure,
      metadata.discoveredData.workProcesses,
      metadata.discoveredData.communicationPatterns,
      metadata.discoveredData.challenges?.length > 0,
      metadata.discoveredData.opportunities?.length > 0
    ];

    const completedPoints = dataPoints.filter(Boolean).length;
    metadata.dataCompleteness = (completedPoints / dataPoints.length) * 100;
  }
}

export function createDiscoveryAgent(): DiscoveryAgent {
  return new DiscoveryAgent();
}