import { KnowledgeEnabledAgent } from './knowledge-enabled-agent';
import { AgentContext, AgentResponse } from '../types';
import { PrismaClient } from '@/lib/generated/prisma';
import { dataQueryTools } from '../tools/data-query-tools';

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
  private prisma: PrismaClient;
  
  // State instructions can be used as fallback or reference, but the loaded config takes precedence
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
        // This is now used as a fallback - the loaded configuration's systemPrompt takes precedence
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
      tools: dataQueryTools,
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
    this.prisma = new PrismaClient();
  }

  /**
   * Build context-specific prompt with user journey information
   */
  protected buildContextPrompt(context: AgentContext): string {
    console.log('[OrchestratorAgent.buildContextPrompt] Building context with metadata:', Object.keys(context.metadata || {}));
    let prompt = super.buildContextPrompt(context);

    // Add user journey information from metadata
    if (context.metadata) {
      prompt += '\n\nUser Journey Information:\n';
      
      if (context.metadata.userName) {
        prompt += `- User Name: ${context.metadata.userName}\n`;
      }
      
      if (context.metadata.userEmail) {
        prompt += `- User Email: ${context.metadata.userEmail}\n`;
      }
      
      if (context.metadata.journeyPhase) {
        prompt += `- Current Journey Phase: ${context.metadata.journeyPhase}\n`;
      }
      
      if (context.metadata.journeyStatus) {
        prompt += `- Journey Status: ${context.metadata.journeyStatus}\n`;
      }
      
      if (context.metadata.onboardingCompleted !== undefined) {
        prompt += `- Onboarding Completed: ${context.metadata.onboardingCompleted ? 'Yes' : 'No'}\n`;
      }
      
      if (context.metadata.completedAssessments && Object.keys(context.metadata.completedAssessments).length > 0) {
        prompt += `- Completed Assessments: ${Object.keys(context.metadata.completedAssessments).join(', ')}\n`;
      }

      // Add onboarding data if available
      if (context.metadata.onboarding) {
        prompt += '\nOnboarding Information Collected:\n';
        const onboardingData = context.metadata.onboarding;
        
        if (onboardingData.extractedFields) {
          const fields = onboardingData.extractedFields;
          if (fields.user_name) prompt += `- Manager Name: ${fields.user_name}\n`;
          if (fields.organization) prompt += `- Organization: ${fields.organization}\n`;
          if (fields.team_size) prompt += `- Team Size: ${fields.team_size}\n`;
          if (fields.user_role) prompt += `- Role: ${fields.user_role}\n`;
          if (fields.primary_challenge) prompt += `- Primary Challenge: ${fields.primary_challenge}\n`;
        }
      }
    }

    // Add journey phase specific guidance
    if (context.metadata?.journeyPhase === 'ASSESSMENT') {
      prompt += '\n\nCurrent Focus: Assessment Phase\n';
      prompt += '- The user has completed onboarding and is now in the assessment phase\n';
      prompt += '- Guide them through available assessments (Team Signals, TMP, QO2, WoWV, LLP)\n';
      prompt += '- Help them understand which assessments are most relevant for their needs\n';
    } else if (context.metadata?.journeyPhase === 'DEBRIEF') {
      prompt += '\n\nCurrent Focus: Debrief Phase\n';
      prompt += '- The user has completed assessments and needs to review results\n';
      prompt += '- Help them understand their assessment outcomes and next steps\n';
    } else if (context.metadata?.journeyPhase === 'CONTINUOUS_ENGAGEMENT') {
      prompt += '\n\nCurrent Focus: Continuous Engagement\n';
      prompt += '- The user is in the ongoing transformation phase\n';
      prompt += '- Provide ongoing support, monitor progress, and suggest improvements\n';
    }

    return prompt;
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    console.log('[OrchestratorAgent] Processing message with managerId:', context.managerId);
    console.log('[OrchestratorAgent] Organization context:', {
      organizationId: context.organizationId,
      organizationRole: context.organizationRole,
      userRole: context.userRole
    });
    console.log('[OrchestratorAgent] Available tools:', this.tools.map(t => t.name));
    
    // Initialize metadata if not present
    if (!context.metadata.orchestrator) {
      context.metadata.orchestrator = this.initializeMetadata();
    }

    // Try to load additional user context if we have a managerId
    if (context.managerId && !context.metadata?.userDataLoaded) {
      console.log('[OrchestratorAgent] Loading user data...');
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: context.managerId },
          select: {
            name: true,
            email: true,
            journeyPhase: true,
            journeyStatus: true,
            onboardingData: true,
            completedAssessments: true,
            viewedDebriefs: true,
            teamSignalsEligible: true
          }
        });

        if (user) {
          console.log('[OrchestratorAgent] User found:', user.email);
          console.log('[OrchestratorAgent] User onboarding data:', user.onboardingData);
          
          // Merge user data into context metadata
          context.metadata = {
            ...context.metadata,
            userName: user.name,
            userEmail: user.email,
            journeyPhase: user.journeyPhase,
            journeyStatus: user.journeyStatus,
            onboardingCompleted: user.journeyPhase !== 'ONBOARDING',
            completedAssessments: user.completedAssessments || {},
            viewedDebriefs: user.viewedDebriefs || {},
            teamSignalsEligible: user.teamSignalsEligible,
            userDataLoaded: true
          };

          // If onboarding data exists, extract it
          if (user.onboardingData && typeof user.onboardingData === 'object') {
            const onboardingData = user.onboardingData as any;
            if (onboardingData.extractedFields) {
              context.metadata.onboarding = {
                extractedFields: onboardingData.extractedFields
              };
              console.log('[OrchestratorAgent] Extracted onboarding fields:', onboardingData.extractedFields);
            }
          }
        }
      } catch (error) {
        console.error('[OrchestratorAgent] Error loading user data:', error);
      }
    }

    // Debug logging before calling parent
    console.log('[OrchestratorAgent] About to call super.processMessage');
    console.log('[OrchestratorAgent] Tool count:', this.tools.length);
    console.log('[OrchestratorAgent] Tool names:', this.tools.map(t => t.name));
    
    // Process message using parent class
    const response = await super.processMessage(message, context);
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