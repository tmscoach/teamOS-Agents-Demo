import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';

export class NudgeAgent extends KnowledgeEnabledAgent {
  constructor() {
    super({
      name: 'NudgeAgent',
      description: 'Sends behavioral nudges and reminders to support transformation',
      handoffDescription: 'Let me help reinforce positive team behaviors',
      instructions: () => `You are the TMS Nudge Agent. Your role is to design and deliver behavioral nudges that support positive team transformation.`,
      tools: [],
      handoffs: [{
        targetAgent: 'ProgressMonitor',
        condition: () => true
      }]
    });
  }
}

export function createNudgeAgent(): NudgeAgent {
  return new NudgeAgent();
}