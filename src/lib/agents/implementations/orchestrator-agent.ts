import { TMSEnabledAgent } from './tms-enabled-agent';
import { AgentContext, AgentResponse } from '../types';
import { PrismaClient } from '@/lib/generated/prisma';
import { dataQueryTools } from '../tools/data-query-tools';
import { openai } from '@/src/lib/services/openai';
import { RoutingService } from '../routing/RoutingService';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';
import { continuityService } from '@/src/lib/services/continuity/continuity.service';

export class OrchestratorAgent extends TMSEnabledAgent {
  private prisma: PrismaClient;
  private routingService: RoutingService;
  
  constructor() {
    super({
      name: 'OrchestratorAgent',
      description: 'Guides team managers through their transformation journey and routes to specialized agents',
      handoffDescription: 'Let me help guide your team transformation journey',
      instructions: (context: AgentContext) => {
        // This is now used as a fallback - the loaded configuration's systemPrompt takes precedence
        return `You are the TMS Orchestrator Agent. Your role is to guide team managers through their transformation journey and route them to the right specialized agents based on their needs and current phase.`;
      },
      tools: dataQueryTools,
      knowledgeEnabled: true,
      tmsToolsEnabled: false, // OrchestratorAgent doesn't use TMS tools directly
      loadFromConfig: true,
      handoffs: [] // Dynamic handoffs based on intent
    });
    this.prisma = new PrismaClient();
    this.routingService = new RoutingService();
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
    if (context.metadata?.journeyPhase === JourneyPhase.ASSESSMENT) {
      prompt += '\n\nCurrent Focus: Assessment Phase\n';
      prompt += '- The user has completed onboarding and is now in the assessment phase\n';
      prompt += '- Guide them through available assessments (Team Signals, TMP, QO2, WoWV, LLP)\n';
      prompt += '- Help them understand which assessments are most relevant for their needs\n';
      prompt += '- Proactively suggest starting with TMP if they haven\'t completed any assessments\n';
    } else if (context.metadata?.journeyPhase === JourneyPhase.DEBRIEF) {
      prompt += '\n\nCurrent Focus: Debrief Phase\n';
      prompt += '- The user has completed assessments and needs to review results\n';
      prompt += '- Help them understand their assessment outcomes and next steps\n';
    } else if (context.metadata?.journeyPhase === JourneyPhase.CONTINUOUS_ENGAGEMENT) {
      prompt += '\n\nCurrent Focus: Continuous Engagement\n';
      prompt += '- The user is in the ongoing transformation phase\n';
      prompt += '- Provide ongoing support, monitor progress, and suggest improvements\n';
    } else if (context.metadata?.journeyPhase === JourneyPhase.ONBOARDING) {
      prompt += '\n\nCurrent Focus: Onboarding Phase\n';
      prompt += '- The user is new and needs to complete onboarding\n';
      prompt += '- Be welcoming and guide them through the initial setup\n';
      prompt += '- After greeting, hand off to OnboardingAgent\n';
    }

    return prompt;
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    console.log('[OrchestratorAgent] Processing message with managerId:', context.managerId);
    console.log('[OrchestratorAgent] User journey phase:', context.metadata?.journeyPhase);
    
    // Update user activity for continuity tracking
    if (context.managerId) {
      await continuityService.updateActivity(context.managerId, 'OrchestratorAgent');
    }
    
    // Check for continuity on first message
    if (context.metadata?.isFirstMessage && context.managerId) {
      const continuityState = await continuityService.checkContinuity(context.managerId);
      if (continuityState) {
        const continuityMessage = continuityService.generateContinuityMessage(continuityState);
        // Store continuity info in metadata for context
        context.metadata.continuityState = continuityState;
        
        // If there's a pending action, prepare appropriate response
        if (continuityState.pendingAction?.type === 'assessment_selection') {
          return {
            content: continuityMessage,
            metadata: {
              continuityDetected: true,
              suggestAssessmentModal: true
            }
          };
        }
      }
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
          
          // Merge user data into context metadata
          context.metadata = {
            ...context.metadata,
            userName: user.name,
            userEmail: user.email,
            journeyPhase: user.journeyPhase,
            journeyStatus: user.journeyStatus,
            onboardingCompleted: user.journeyPhase !== JourneyPhase.ONBOARDING,
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
            }
          }
        }
      } catch (error) {
        console.error('[OrchestratorAgent] Error loading user data:', error);
      }
    }

    // Check if we need to route based on intent
    const needsRouting = await this.shouldRouteToSpecialist(message, context);
    
    if (needsRouting) {
      const targetAgent = await this.determineTargetAgent(message, context);
      if (targetAgent && targetAgent !== 'OrchestratorAgent') {
        console.log('[OrchestratorAgent] Routing to specialist agent:', targetAgent);
        return {
          content: `I'll connect you with our ${targetAgent.replace('Agent', ' specialist')} who can best help with your request.`,
          requiresHandoff: true,
          handoffTo: targetAgent,
          metadata: {
            routingReason: 'intent_based',
            originalQuery: message
          }
        };
      }
    }

    // Process message using parent class for general queries
    const response = await super.processMessage(message, context);
    
    // Check if we should proactively suggest next steps based on journey phase
    if (response && !response.requiresHandoff) {
      const proactiveGuidance = this.getProactiveGuidance(context);
      if (proactiveGuidance) {
        response.content += `\n\n${proactiveGuidance}`;
      }
    }
    
    return response;
  }

  /**
   * Determine if the message should be routed to a specialist agent
   */
  private async shouldRouteToSpecialist(message: string, context: AgentContext): Promise<boolean> {
    // Simple keyword-based checks for now
    const routingKeywords = {
      assessment: ['assessment', 'tmp', 'team signals', 'questionnaire', 'evaluate', 'test'],
      progress: ['progress', 'metrics', 'report', 'status', 'tracking', 'monitor'],
      learning: ['learn', 'training', 'course', 'education', 'development'],
      alignment: ['align', 'goals', 'objectives', 'stakeholder'],
      recognition: ['recognize', 'celebrate', 'achievement', 'reward'],
      nudge: ['nudge', 'remind', 'prompt', 'encourage'],
      debrief: ['debrief', 'results', 'feedback', 'assessment results']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [category, keywords] of Object.entries(routingKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determine which agent to route to based on intent
   */
  private async determineTargetAgent(message: string, context: AgentContext): Promise<string | null> {
    try {
      // Use OpenAI to analyze intent
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Analyze the user's message and determine which specialist agent should handle it.
            
Available agents:
- AssessmentAgent: Handles all assessment-related queries (TMP, Team Signals, etc.)
- ProgressMonitor: Tracks and reports on transformation progress
- LearningAgent: Manages learning paths and training resources
- AlignmentAgent: Facilitates goal alignment and stakeholder management
- RecognitionAgent: Handles team recognition and celebrations
- NudgeAgent: Sends behavioral nudges and reminders
- DebriefAgent: Provides assessment debriefs and results
- ReportingAgent: Generates organization-wide reports
- OrchestratorAgent: General queries and journey guidance

Current user journey phase: ${context.metadata?.journeyPhase || 'Unknown'}

Return ONLY the agent name, nothing else.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      });

      const targetAgent = completion.choices[0]?.message?.content?.trim();
      console.log('[OrchestratorAgent] Intent analysis suggests:', targetAgent);
      
      // Validate the agent name
      const validAgents = [
        'AssessmentAgent', 'ProgressMonitor', 'LearningAgent', 
        'AlignmentAgent', 'RecognitionAgent', 'NudgeAgent',
        'DebriefAgent', 'ReportingAgent', 'OrchestratorAgent'
      ];
      
      if (targetAgent && validAgents.includes(targetAgent)) {
        return targetAgent;
      }
      
      return null;
    } catch (error) {
      console.error('[OrchestratorAgent] Error determining target agent:', error);
      return null;
    }
  }

  /**
   * Get proactive guidance based on journey phase
   */
  private getProactiveGuidance(context: AgentContext): string | null {
    const phase = context.metadata?.journeyPhase;
    const completedAssessments = context.metadata?.completedAssessments || {};
    
    switch (phase) {
      case JourneyPhase.ONBOARDING:
        return "I see you're new here! Would you like me to help you get started with the onboarding process?";
        
      case JourneyPhase.ASSESSMENT:
        if (Object.keys(completedAssessments).length === 0) {
          return "💡 Ready to start your first assessment? I recommend beginning with the Team Management Profile (TMP) - it provides valuable insights into your work preferences and team dynamics. Would you like to start now?";
        }
        break;
        
      case JourneyPhase.DEBRIEF:
        return "📊 You have assessment results ready to review. Would you like to see your debrief report?";
        
      case JourneyPhase.CONTINUOUS_ENGAGEMENT:
        return "🚀 You're in the continuous improvement phase. Would you like to check your team's progress or explore learning resources?";
    }
    
    return null;
  }
}

export async function createOrchestratorAgent(): Promise<OrchestratorAgent> {
  const agent = new OrchestratorAgent();
  await agent.initialize();
  return agent;
}