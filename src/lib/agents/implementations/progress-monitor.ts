import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';

export class ProgressMonitor extends KnowledgeEnabledAgent {
  constructor() {
    super({
      name: 'ProgressMonitor',
      description: 'Tracks transformation progress and reports on key metrics',
      handoffDescription: 'Let me monitor and report on your transformation progress',
      instructions: () => `You are the TMS Progress Monitor. Your role is to track transformation progress, analyze trends, and communicate insights to stakeholders.`,
      tools: [],
      handoffs: [{
        targetAgent: 'RecognitionAgent',
        condition: () => true
      }]
    });
  }
}

export function createProgressMonitor(): ProgressMonitor {
  return new ProgressMonitor();
}