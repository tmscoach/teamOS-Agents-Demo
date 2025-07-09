import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export enum NudgeState {
  BEHAVIOR_ANALYSIS = "behavior_analysis",
  NUDGE_DESIGN = "nudge_design",
  TIMING_OPTIMIZATION = "timing_optimization",
  DELIVERY_EXECUTION = "delivery_execution",
  RESPONSE_MONITORING = "response_monitoring",
  EFFECTIVENESS_MEASUREMENT = "effectiveness_measurement"
}

export interface NudgeMetadata {
  state: NudgeState;
  nudgeData: {
    targetBehaviors: Array<{ behavior: string; currentState: string; desiredState: string }>;
    nudgeStrategies: Array<{ type: string; message: string; trigger: string }>;
    deliverySchedule: Array<{ nudgeId: string; recipient: string; scheduledTime: string }>;
    responses: Array<{ nudgeId: string; recipient: string; response: string; timestamp: string }>;
    effectiveness: Record<string, number>;
  };
  nudgesSent: number;
  responseRate: number;
}

export class NudgeAgent extends KnowledgeEnabledAgent {
  private static readonly STATE_INSTRUCTIONS: Record<NudgeState, string> = {
    [NudgeState.BEHAVIOR_ANALYSIS]: `
      Analyze target behaviors:
      - Identify behavior change opportunities
      - Understand current habits
      - Define desired behaviors
      - Map behavior triggers
    `,
    [NudgeState.NUDGE_DESIGN]: `
      Design effective nudges:
      - Create compelling messages
      - Use behavioral science principles
      - Personalize to recipients
      - Keep nudges actionable
    `,
    [NudgeState.TIMING_OPTIMIZATION]: `
      Optimize nudge timing:
      - Identify optimal delivery times
      - Consider recipient schedules
      - Avoid nudge fatigue
      - Plan sequence strategically
    `,
    [NudgeState.DELIVERY_EXECUTION]: `
      Execute nudge delivery:
      - Send nudges as scheduled
      - Ensure delivery success
      - Track delivery metrics
      - Handle delivery failures
    `,
    [NudgeState.RESPONSE_MONITORING]: `
      Monitor nudge responses:
      - Track recipient actions
      - Measure engagement rates
      - Identify patterns
      - Gather feedback
    `,
    [NudgeState.EFFECTIVENESS_MEASUREMENT]: `
      Measure nudge effectiveness:
      - Analyze behavior change
      - Calculate success rates
      - Identify improvements
      - Refine nudge strategies
    `
  };

  constructor() {
    super({
      name: 'NudgeAgent',
      description: 'Sends behavioral nudges and reminders to support transformation',
      handoffDescription: 'Let me help reinforce positive team behaviors',
      instructions: (context: AgentContext) => {
        const metadata = context.metadata as NudgeMetadata;
        const state = metadata?.state || NudgeState.BEHAVIOR_ANALYSIS;
        const baseInstructions = NudgeAgent.STATE_INSTRUCTIONS[state];
        
        return `You are the TMS Nudge Agent. Your role is to design and deliver behavioral nudges that support positive team transformation.

Current state: ${state}

${baseInstructions}

Remember to:
- Keep nudges positive and encouraging
- Be timely but not intrusive
- Personalize messages appropriately
- Measure and improve effectiveness
- Support sustained behavior change`;
      },
      tools: [],
      handoffs: [{
        targetAgent: 'ProgressMonitor',
        condition: (context: AgentContext) => {
          const metadata = context.metadata as NudgeMetadata;
          return metadata?.state === NudgeState.EFFECTIVENESS_MEASUREMENT;
        }
      }]
    });
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    // Initialize metadata if not present
    if (!context.metadata.nudge) {
      context.metadata.nudge = this.initializeMetadata();
    }

    // Process message using parent class
    const response = await super.processMessage(message, context);

    // Add nudge-specific logic here
    this.updateResponseRate(context.metadata.nudge as NudgeMetadata);

    return response;
  }

  private initializeMetadata(): NudgeMetadata {
    return {
      state: NudgeState.BEHAVIOR_ANALYSIS,
      nudgeData: {
        targetBehaviors: [],
        nudgeStrategies: [],
        deliverySchedule: [],
        responses: [],
        effectiveness: {}
      },
      nudgesSent: 0,
      responseRate: 0
    };
  }

  private updateResponseRate(metadata: NudgeMetadata) {
    if (metadata.nudgesSent === 0) {
      metadata.responseRate = 0;
      return;
    }

    const responsesReceived = metadata.nudgeData.responses.length;
    metadata.responseRate = (responsesReceived / metadata.nudgesSent) * 100;
  }
}

export function createNudgeAgent(): NudgeAgent {
  return new NudgeAgent();
}