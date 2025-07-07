import { OpenAIAgent } from './base-openai-agent';
import { AgentConfig, AgentContext } from '../types';
import { knowledgeBaseTools } from '../../knowledge-base';

/**
 * Example of an agent with knowledge base capabilities
 * This demonstrates how to integrate the knowledge base tools into any agent
 */
export class KnowledgeEnabledAgent extends OpenAIAgent {
  constructor(config: Omit<AgentConfig, 'tools'> & { tools?: AgentConfig['tools'] }) {
    // Merge knowledge base tools with any custom tools
    const enhancedConfig: AgentConfig = {
      ...config,
      tools: [...knowledgeBaseTools, ...(config.tools || [])]
    };
    
    super(enhancedConfig);
  }
  
  /**
   * Override to add knowledge base context to instructions if needed
   */
  protected getInstructions(context: AgentContext): string {
    const baseInstructions = super.getInstructions(context);
    
    return `${baseInstructions}

You have access to a comprehensive knowledge base containing 40+ years of TMS intellectual property including:
- Accreditation Handbooks (TMP, QO2, WoWV, LLP, HET)
- Questionnaires and scoring methodologies
- Finished report examples
- Research manuals and findings

Always search the knowledge base when you need information about:
- TMS methodologies and frameworks
- Assessment tools and questionnaires
- Team transformation strategies
- Benchmark data and research findings

Cite your sources when using information from the knowledge base.`;
  }
}

/**
 * Example: Creating a specialized Onboarding Agent with knowledge base access
 */
export function createOnboardingAgent(): KnowledgeEnabledAgent {
  return new KnowledgeEnabledAgent({
    name: 'OnboardingAgent',
    description: 'Guides managers through initial TMS platform setup',
    handoffDescription: 'Handoff to the Onboarding Agent for initial setup and orientation',
    instructions: `You are the Onboarding Agent for the TMS platform. Your role is to:
1. Welcome new managers to the platform
2. Explain TMS methodology and available assessments
3. Guide them through initial team setup
4. Help them understand which assessment to start with
5. Set expectations for the transformation journey

Use the knowledge base to provide accurate information about TMS methodologies and assessments.`,
    handoffs: [
      {
        targetAgent: 'AssessmentAgent'
      }
    ]
  });
}