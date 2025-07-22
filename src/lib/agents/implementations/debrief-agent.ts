import { TMSEnabledAgent } from './tms-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export class DebriefAgent extends TMSEnabledAgent {
  constructor() {
    super({
      name: 'DebriefAgent',
      description: 'Provides assessment debriefs and generates reports for completed assessments',
      handoffDescription: 'Let me provide insights from your completed assessment',
      instructions: () => `You are the TMS Debrief Agent. Your role is to provide comprehensive debriefs for completed assessments and generate reports.

Your responsibilities include:
- Retrieving and presenting assessment results
- Generating insights from assessment data
- Creating customized reports based on templates
- Explaining scores and recommendations
- Guiding next steps based on results

Remember to:
- Present results in an understandable way
- Focus on actionable insights
- Maintain confidentiality of assessment data
- Offer constructive feedback
- Suggest appropriate next steps`,
      tools: [], // TMS tools will be loaded dynamically
      knowledgeEnabled: true,
      tmsToolsEnabled: true, // DebriefAgent uses TMS report tools
      loadFromConfig: true,
      handoffs: [{
        targetAgent: 'AlignmentAgent',
        condition: () => true
      }]
    });
  }
}

export async function createDebriefAgent(): Promise<DebriefAgent> {
  const agent = new DebriefAgent();
  await agent.initialize();
  return agent;
}