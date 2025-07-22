import { TMSEnabledAgent } from './tms-enabled-agent';
import { AgentContext, AgentResponse } from '../types';

export class ReportingAgent extends TMSEnabledAgent {
  constructor() {
    super({
      name: 'ReportingAgent',
      description: 'Generates organization-wide reports and analytics',
      handoffDescription: 'Let me generate comprehensive reports for your organization',
      instructions: () => `You are the TMS Reporting Agent. Your role is to generate organization-wide reports and provide analytics on team transformation progress.

Your responsibilities include:
- Creating custom reports across teams
- Analyzing product usage and engagement
- Tracking transformation metrics
- Identifying trends and patterns
- Providing executive summaries

Remember to:
- Ensure data accuracy and completeness
- Present data in meaningful visualizations
- Highlight key insights and trends
- Respect data privacy and permissions
- Provide actionable recommendations`,
      tools: [], // TMS tools will be loaded dynamically
      knowledgeEnabled: true,
      tmsToolsEnabled: true, // ReportingAgent uses TMS report generation tools
      loadFromConfig: true,
      handoffs: [{
        targetAgent: 'OrchestratorAgent',
        condition: () => true
      }]
    });
  }
}

export async function createReportingAgent(): Promise<ReportingAgent> {
  const agent = new ReportingAgent();
  await agent.initialize();
  return agent;
}