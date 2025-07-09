import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';

export class RecognitionAgent extends KnowledgeEnabledAgent {
  constructor() {
    super({
      name: 'RecognitionAgent',
      description: 'Manages team recognition and celebration of achievements',
      handoffDescription: 'Let me help celebrate your team\'s achievements',
      instructions: () => `You are the TMS Recognition Agent. Your role is to identify, plan, and deliver meaningful recognition that reinforces positive team transformation.`,
      tools: [],
      handoffs: [{
        targetAgent: 'OrchestratorAgent',
        condition: () => true
      }]
    });
  }
}

export function createRecognitionAgent(): RecognitionAgent {
  return new RecognitionAgent();
}