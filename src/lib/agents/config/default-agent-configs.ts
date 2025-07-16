/**
 * Default configurations for all agents
 * These serve as templates when no database configuration exists
 */

import { ENHANCED_EXTRACTION_PATTERNS, ADDITIONAL_PATTERNS, convertToStandardRules } from '../extraction/enhanced-patterns';
import { mergeSuggestedValues } from '../extraction/merge-suggestions';

export interface AgentDefaultConfig {
  prompts: Record<string, string>;
  flowConfig: {
    states: string[];
    transitions: Record<string, string[]>;
    requiredFields?: string[];
  };
  extractionRules: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array';
    patterns?: string[];
    required?: boolean;
    description?: string;
    useLLMFallback?: boolean;
  }>;
  guardrailConfig?: Record<string, any>;
}

export const DEFAULT_AGENT_CONFIGS: Record<string, AgentDefaultConfig> = {
  OnboardingAgent: {
    prompts: {
      system: `You are the OnboardingAgent for the TMS transformation platform.
Your role is to warmly welcome new managers and guide them through the initial engagement process.
You have access to the TMS knowledge base containing 40+ years of intellectual property.

Your objectives:
- Build rapport and trust with the manager
- Confirm their specific role/title (don't assume they're just a "Manager")
- Understand their team context and challenges
- Explore their primary challenges in depth
- Explain how TMS can help based on their specific needs
- Help them set SMART goals
- Discuss practical considerations and resources
- Identify key stakeholders
- Extract required information naturally through conversation
- Prepare for handoff to Assessment Agent when ready

IMPORTANT INSTRUCTIONS:
- Always check the "Already captured information" section in your context before asking any questions
- NEVER ask for information that has already been captured
- Focus only on gathering the missing required fields listed in "Still need to capture"
- If the user provides information naturally, acknowledge it rather than asking for it again
- Be conversational and natural while being efficient in gathering missing information
- CRITICAL: Ask for their specific role/title (e.g., "Engineering Manager", "VP of Sales", "Team Lead") - do NOT default to generic "Manager"`,
      greeting: "Welcome to TMS! I'm OSmos, your AI team dynamics coach. I'm here to help you unlock your team's potential by understanding what makes each person tick and giving you actionable insights to lead with confidence.\n\nTo get started, what's your name?",
      context_discovery: "Great to meet you! Now I'd like to understand your role and team better.\n\nWhat's your specific role or title in the organization?",
      challenge_exploration: "Thanks for that. Now let's talk about what brought you here.\n\nWhat's the main challenge your team is facing right now?",
      tms_explanation: "Based on what you've shared, let me explain how TMS can help. We have proven methodologies like TMP (Team Management Profile), QO2 (Quotient of Organizational Outcomes), and others that address exactly these kinds of challenges...",
      goal_setting: "I can see how that's impacting your team. Let's think about the future.\n\nWhat would success look like for your team in 6 months?",
      resource_confirmation: "Those are great goals! To design the right program for you, I need to understand your constraints.\n\nWhat's your ideal timeframe for seeing initial results?",
      stakeholder_mapping: "Who are the key people we need to involve? Think about team champions, potential skeptics, and senior stakeholders whose support we'll need.",
      recap_and_handoff: "Let me summarize what we've discussed: [recap key points]. You're ready for the next step - our Assessment Agent will help evaluate your team's current state using our proven tools. Are you ready to proceed?"
    },
    flowConfig: {
      states: [
        'greeting',
        'context_discovery',
        'challenge_exploration',
        'tms_explanation',
        'goal_setting',
        'resource_confirmation',
        'stakeholder_mapping',
        'recap_and_handoff'
      ],
      transitions: {
        greeting: ['context_discovery'],
        context_discovery: ['challenge_exploration'],
        challenge_exploration: ['tms_explanation'],
        tms_explanation: ['goal_setting'],
        goal_setting: ['resource_confirmation'],
        resource_confirmation: ['stakeholder_mapping'],
        stakeholder_mapping: ['recap_and_handoff'],
        recap_and_handoff: []
      },
      requiredFields: [
        'user_name',  // Updated to use consistent field name
        'user_role',  // Added to confirm role
        'team_size',
        'organization',  // Required field
        'primary_challenge'
      ]
    },
    // Use enhanced extraction patterns with suggested values merged in
    extractionRules: mergeSuggestedValues(
      convertToStandardRules({
        // Core fields with both naming conventions
        manager_name: { ...ENHANCED_EXTRACTION_PATTERNS.manager_name, required: true },
        user_name: { ...ENHANCED_EXTRACTION_PATTERNS.manager_name, required: true }, // Alias for manager_name
        manager_role: { ...ADDITIONAL_PATTERNS.manager_role, required: true },
        user_role: { ...ADDITIONAL_PATTERNS.manager_role, required: true }, // Alias for manager_role
        team_size: { ...ENHANCED_EXTRACTION_PATTERNS.team_size, required: true },
        team_tenure: { ...ENHANCED_EXTRACTION_PATTERNS.team_tenure, required: false },
        primary_challenge: { ...ENHANCED_EXTRACTION_PATTERNS.primary_challenge, required: true },
        organization: { ...ENHANCED_EXTRACTION_PATTERNS.company_name, required: true }, // Organization is required
        success_metrics: { ...ENHANCED_EXTRACTION_PATTERNS.success_metrics, required: false },
        timeline_preference: { ...ENHANCED_EXTRACTION_PATTERNS.timeline_preference, required: false },
        budget_range: { ...ENHANCED_EXTRACTION_PATTERNS.budget_range, required: false },
        leader_commitment: { ...ENHANCED_EXTRACTION_PATTERNS.leader_commitment, required: false },
        // Additional fields for richer context (not required)
        company_name: ENHANCED_EXTRACTION_PATTERNS.company_name,
        department: ENHANCED_EXTRACTION_PATTERNS.department,
        team_distribution: ENHANCED_EXTRACTION_PATTERNS.team_distribution,
        urgency_level: ENHANCED_EXTRACTION_PATTERNS.urgency_level,
        previous_initiatives: ENHANCED_EXTRACTION_PATTERNS.previous_initiatives
      })
    ),
    guardrailConfig: {
      minMessageLength: 1,
      maxMessageLength: 1000,
      maxConversationTime: 45 * 60 * 1000,
      enableTopicRelevance: true,
      enableProfanityCheck: true
    }
  },

  OrchestratorAgent: {
    prompts: {
      system: `You are the OrchestratorAgent, responsible for managing the overall team transformation workflow.
You coordinate between all other agents and ensure smooth progression through transformation phases.
You have access to the full TMS knowledge base and transformation methodologies.

Your responsibilities:
- Monitor overall transformation progress
- Activate appropriate agents based on phase
- Track completion of assessments and interventions
- Ensure handoffs happen smoothly
- Maintain transformation roadmap
- Report on progress and blockers
- Use TMS IP to guide transformation strategy`,
      initialization: "Let me review your onboarding information and set up your transformation journey based on TMS best practices.",
      assessment_coordination: "It's time to assess your team's current state. Based on your challenges, I recommend we start with [specific assessment]. I'll coordinate with our Assessment Agent.",
      transformation_planning: "Based on the assessment results, I'll design your transformation roadmap using our proven TMS methodologies.",
      execution_monitoring: "I'm monitoring your transformation progress. Let me check how your team is progressing against our milestones.",
      progress_review: "Time for a progress review. Let's analyze what's working and what needs adjustment based on TMS success metrics.",
      completion: "Congratulations on completing this transformation cycle! Let's review achievements and plan the next phase of your journey."
    },
    flowConfig: {
      states: [
        'initialization',
        'assessment_coordination',
        'transformation_planning',
        'execution_monitoring',
        'progress_review',
        'completion'
      ],
      transitions: {
        initialization: ['assessment_coordination'],
        assessment_coordination: ['transformation_planning'],
        transformation_planning: ['execution_monitoring'],
        execution_monitoring: ['progress_review', 'assessment_coordination'],
        progress_review: ['execution_monitoring', 'completion'],
        completion: ['initialization']
      }
    },
    extractionRules: {
      transformation_id: {
        type: 'string',
        required: true,
        description: 'Unique identifier for the transformation journey'
      },
      current_phase: {
        type: 'string',
        required: true,
        description: 'Current transformation phase'
      },
      active_agents: {
        type: 'array',
        required: false,
        description: 'List of currently active agents'
      },
      completed_assessments: {
        type: 'array',
        required: false,
        description: 'List of completed assessments'
      },
      pending_tasks: {
        type: 'array',
        required: false,
        description: 'Tasks pending completion'
      },
      blockers: {
        type: 'array',
        required: false,
        description: 'Current blockers or issues'
      }
    }
  },

  DiscoveryAgent: {
    prompts: {
      system: `You are the DiscoveryAgent, specializing in deep team discovery and analysis.
You help teams uncover hidden dynamics, patterns, and opportunities using TMS discovery methodologies.
You have access to research data and benchmarks from 40+ years of team studies.

Your approach:
- Use structured discovery methodology from TMS IP
- Map team structures and relationships
- Analyze work processes and workflows
- Identify communication patterns
- Uncover challenges and opportunities
- Compare findings to TMS benchmarks
- Synthesize findings into actionable insights`,
      introduction: "I'm here to help you discover deep insights about your team using our proven TMS discovery process. We'll explore structure, processes, and dynamics.",
      team_structure: "Let's map out your team structure. Tell me about the different roles, reporting relationships, and how work is distributed.",
      work_processes: "Walk me through your team's key work processes. How does work flow through your team? What are your core deliverables?",
      communication_patterns: "How does your team communicate? What channels, meetings, and informal interactions shape your team culture?",
      challenges_identification: "Based on TMS research, teams like yours often face specific challenges. What friction points have you observed?",
      opportunities_exploration: "Comparing your team to our benchmarks, I see several opportunities. Where do you think the biggest impact could be made?",
      data_synthesis: "Let me synthesize our findings using the TMS framework. Here are the key insights and recommendations..."
    },
    flowConfig: {
      states: [
        'introduction',
        'team_structure',
        'work_processes',
        'communication_patterns',
        'challenges_identification',
        'opportunities_exploration',
        'data_synthesis'
      ],
      transitions: {
        introduction: ['team_structure'],
        team_structure: ['work_processes'],
        work_processes: ['communication_patterns'],
        communication_patterns: ['challenges_identification'],
        challenges_identification: ['opportunities_exploration'],
        opportunities_exploration: ['data_synthesis'],
        data_synthesis: []
      }
    },
    extractionRules: {
      team_structure: {
        type: 'string',
        required: true,
        description: 'Team structure and reporting relationships'
      },
      role_distribution: {
        type: 'array',
        required: true,
        description: 'Distribution of roles within the team'
      },
      work_processes: {
        type: 'array',
        required: true,
        description: 'Key work processes and workflows'
      },
      communication_channels: {
        type: 'array',
        required: true,
        description: 'Communication channels and patterns'
      },
      meeting_cadence: {
        type: 'string',
        patterns: ["(?:meet|meeting|standup|sync)\\s+(?:daily|weekly|biweekly|monthly)"],
        required: false,
        description: 'Frequency and types of meetings'
      },
      identified_challenges: {
        type: 'array',
        required: true,
        description: 'Challenges identified during discovery'
      },
      improvement_opportunities: {
        type: 'array',
        required: true,
        description: 'Opportunities for improvement'
      },
      team_strengths: {
        type: 'array',
        required: false,
        description: 'Identified team strengths'
      }
    }
  },

  AssessmentAgent: {
    prompts: {
      system: `You are the AssessmentAgent, responsible for conducting team assessments using TMS methodologies.
You have deep knowledge of all TMS assessment tools: TMP, QO2, WoWV, LLP, and HET.
You guide managers through the appropriate assessments based on their needs.

Your expertise includes:
- Selecting the right assessment tool
- Explaining assessment methodology
- Guiding through questionnaire completion
- Interpreting results using TMS benchmarks
- Providing actionable recommendations
- Preparing teams for transformation`,
      introduction: "I'll help you assess your team using our proven TMS tools. Based on your challenges, I recommend [specific assessment].",
      assessment_selection: "Let me explain our assessment options: TMP for team dynamics, QO2 for organizational outcomes, WoWV for virtual teams...",
      questionnaire_guidance: "I'll guide you through the assessment questions. Take your time and answer honestly - there are no wrong answers.",
      result_interpretation: "Your results show [key findings]. Compared to our benchmarks, your team scores [comparison]...",
      recommendation_formulation: "Based on your assessment results and TMS best practices, here are my recommendations...",
      handoff_preparation: "Your assessment is complete. Let me prepare you for the next phase with our Transformation Agent."
    },
    flowConfig: {
      states: [
        'introduction',
        'assessment_selection',
        'questionnaire_guidance',
        'result_interpretation',
        'recommendation_formulation',
        'handoff_preparation'
      ],
      transitions: {
        introduction: ['assessment_selection'],
        assessment_selection: ['questionnaire_guidance'],
        questionnaire_guidance: ['result_interpretation'],
        result_interpretation: ['recommendation_formulation'],
        recommendation_formulation: ['handoff_preparation'],
        handoff_preparation: []
      }
    },
    extractionRules: {
      selected_assessment: {
        type: 'string',
        patterns: ["(?:TMP|QO2|WoWV|LLP|HET|Team Management Profile|Quotient of Organizational Outcomes)"],
        required: true,
        description: 'Which assessment was selected'
      },
      assessment_scores: {
        type: 'array',
        required: true,
        description: 'Scores from the assessment'
      },
      key_findings: {
        type: 'array',
        required: true,
        description: 'Key findings from assessment'
      },
      recommendations: {
        type: 'array',
        required: true,
        description: 'Recommendations based on assessment'
      },
      benchmark_comparison: {
        type: 'string',
        required: false,
        description: 'How team compares to benchmarks'
      }
    }
  },

  // Continue with other agents...
  AlignmentAgent: {
    prompts: {
      system: `You are the AlignmentAgent, ensuring team alignment with organizational goals using TMS alignment methodologies.`,
      introduction: "I'll help align your team's efforts with organizational objectives using our proven TMS alignment framework."
    },
    flowConfig: {
      states: ['introduction'],
      transitions: { introduction: [] }
    },
    extractionRules: {}
  },

  LearningAgent: {
    prompts: {
      system: `You are the LearningAgent, facilitating team learning and development using TMS learning methodologies.`,
      introduction: "I'll design a learning journey for your team based on TMS best practices and your specific needs."
    },
    flowConfig: {
      states: ['introduction'],
      transitions: { introduction: [] }
    },
    extractionRules: {}
  },

  NudgeAgent: {
    prompts: {
      system: `You are the NudgeAgent, providing timely behavioral nudges based on TMS research on habit formation and team change.`,
      introduction: "I'll help your team build better habits through strategic nudges based on behavioral science."
    },
    flowConfig: {
      states: ['introduction'],
      transitions: { introduction: [] }
    },
    extractionRules: {}
  },

  ProgressMonitor: {
    prompts: {
      system: `You are the ProgressMonitor, tracking team transformation progress against TMS success metrics.`,
      introduction: "I'll help you track and visualize your team's transformation progress using TMS metrics."
    },
    flowConfig: {
      states: ['introduction'],
      transitions: { introduction: [] }
    },
    extractionRules: {}
  },

  RecognitionAgent: {
    prompts: {
      system: `You are the RecognitionAgent, celebrating team achievements and milestones using TMS recognition frameworks.`,
      introduction: "Let's celebrate your team's achievements! Recognition is crucial for sustaining transformation momentum."
    },
    flowConfig: {
      states: ['introduction'],
      transitions: { introduction: [] }
    },
    extractionRules: {}
  }
};