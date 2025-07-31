import { TMSEnabledAgent } from './tms-enabled-agent';
import { AgentContext, AgentResponse, AgentTool } from '../types';
import { formatDebriefContext } from '../hooks/use-debrief-context';
import { createSearchReportChunksTool } from '../tools/search-report-chunks';
import { createGetReportContextTool } from '../tools/get-report-context';

export class DebriefAgent extends TMSEnabledAgent {
  private reportSearchTool: AgentTool;
  private reportContextTool: AgentTool;
  
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

When a user asks about their report:
1. First check if they have provided a subscription ID
2. If not, ask them for their subscription ID or team details
3. Use the tms_debrief_report tool to retrieve and analyze their report
4. If the subscription is not found, guide them to generate a report first

If you need a test subscription ID, ask the user or check their dashboard for available assessments.

CRITICAL: When answering questions about TMS terminology, concepts, or methodologies:
- ALWAYS use the search_tms_knowledge tool or get_assessment_methodology tool first to find accurate information
- NEVER make up or guess definitions - only use information from the knowledge base
- If search results are found, analyze them carefully and explain what you found
- Look for patterns and context clues in the results to understand the concept
- If results show the term but don't explicitly define it, explain what you can infer from the context
- Quote relevant portions from the search results to support your explanation
- Only say you "couldn't find information" if the search returns NO results at all

IMPORTANT: When asked about score calculations or methodology:
1. IMMEDIATELY use get_assessment_methodology to search for calculation methods
2. Search for terms like "net scores", "raw scores", "calculation", "scoring methodology"
3. Check the relevant accreditation handbook (e.g., search for "TMP handbook net scores")
4. NEVER say you don't know how something is calculated without searching first

For example, if asked "How is my Introvert score calculated?":
1. Use get_assessment_methodology with assessment_type="TMP" and section="net scores calculation"
2. Search for "TMP scoring methodology" or "work preference measures calculation"
3. Explain the raw score to net score conversion process
4. Quote the specific methodology from the handbook

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
    
    // Initialize report search tools
    this.reportSearchTool = createSearchReportChunksTool();
    this.reportContextTool = createGetReportContextTool();
    
    console.log(`[${this.name}] Constructor completed, tools count: ${this.tools.length}`);
  }
  
  /**
   * Override initialize to ensure report tools are always added
   */
  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialize called`);
    // Call parent initialize first
    await super.initialize();
    
    // Always add report tools after initialization
    this.addReportTools();
  }
  
  /**
   * Add report-specific tools
   */
  public addReportTools(): void {
    // Add report-specific tools after configuration is loaded
    const reportTools: AgentTool[] = [
      this.reportSearchTool,
      this.reportContextTool
    ];
    
    // Add to tools array
    this.tools.push(...reportTools);
    console.log(`[${this.name}] Added ${reportTools.length} report search tools to total of ${this.tools.length} tools`);
  }

  /**
   * Override to add debrief-specific context
   */
  protected buildSystemMessage(context: AgentContext): string {
    const baseMessage = super.buildSystemMessage(context);
    
    // Add debrief-specific context if available
    if (context.metadata?.isDebriefMode) {
      const debriefContext = formatDebriefContext(context);
      return `${baseMessage}\n\nContext: ${debriefContext}`;
    }
    
    return baseMessage;
  }
}

export async function createDebriefAgent(): Promise<DebriefAgent> {
  const agent = new DebriefAgent();
  await agent.initialize();
  return agent;
}