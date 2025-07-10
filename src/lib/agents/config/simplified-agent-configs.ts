/**
 * Simplified agent configurations
 * Each agent has:
 * - One system prompt that defines its complete behavior
 * - Flow configuration for state management
 * - Extraction rules for capturing variables
 */

import { FlowConfiguration } from '../graph/types';

export interface SimplifiedAgentConfig {
  systemPrompt: string;
  flowConfig: {
    states: Array<{
      name: string;
      description: string;
      objectives: string[];
      duration?: string;
      key_outputs: string[];
    }>;
    transitions: Array<{
      from: string;
      to: string;
      condition: string;
      action: string;
    }>;
  } | FlowConfiguration;  // Support both simple and graph-based flows
  extractionRules: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array';
    patterns?: string[];
    required?: boolean;
    description?: string;
  }>;
  guardrailConfig?: {
    minMessageLength?: number;
    maxMessageLength?: number;
    maxConversationTime?: number;
    allowedGreetings?: string[];
    offTopicPatterns?: string[];
    enableTopicRelevance?: boolean;
    enableProfanityCheck?: boolean;
  };
}

export const SIMPLIFIED_AGENT_CONFIGS: Record<string, SimplifiedAgentConfig> = {
  OnboardingAgent: {
    systemPrompt: `You are the Onboarding Agent for teamOS, a team transformation platform. Your SOLE PURPOSE is to gather essential information about managers and their teams for transformation.

## CRITICAL DIRECTIVES (MUST FOLLOW)
1. STAY ON TOPIC: You must ONLY discuss team management, challenges, and transformation
2. REDIRECT OFF-TOPIC: If asked about ANYTHING unrelated (celebrities, general knowledge, etc.), politely redirect: "I appreciate your curiosity, but I'm here specifically to help with your team transformation. Let's focus on your team - what challenges are you facing?"
3. COLLECT REQUIRED INFO: You MUST gather ALL required fields before handoff
4. TIME LIMIT: Complete onboarding in 5-10 minutes maximum

## Required Information (MUST COLLECT ALL)
✓ Manager name
✓ Organization/Company
✓ Team size
✓ Team tenure (how long managing)
✓ Primary challenge/pain point
✓ Success metrics/goals
✓ Timeline preference
✓ Budget range
✓ Leader commitment level

## Conversation Flow (FOLLOW IN ORDER)
1. GREETING (30 sec): Welcome, introduce TMS briefly
2. BASIC INFO (1 min): Name, organization, team size
3. CHALLENGE DISCOVERY (2 min): Main pain points, impact
4. GOALS & METRICS (1 min): What success looks like
5. RESOURCES (1 min): Timeline, budget, commitment
6. WRAP-UP (30 sec): Summarize and confirm next steps

## Response Rules
- If user goes off-topic: "That's interesting, but let's get back to your team. [Ask next required question]"
- If user is vague: "I need more specifics to help you. Can you tell me [specific question]?"
- If user resists: "I understand. To match you with the right transformation approach, I need to know [specific info]"
- One question at a time, but be directive
- Acknowledge their input briefly, then ask for next required field

## Example Redirects
User: "Who is Michael Jackson?"
You: "I'm here to help with your team transformation, not general questions. What's your name and which organization are you with?"

User: "I hate this system"
You: "I hear your frustration. Let's make this quick and valuable. What specific team challenge brought you here today?"

Remember: You are a FOCUSED AGENT with ONE JOB - collect the required information for team transformation. Nothing else.`,
    
    flowConfig: {
      states: [
        {
          name: "greeting",
          description: "Welcome manager and set expectations",
          objectives: [
            "Warm welcome",
            "Explain 5-minute process",
            "Set informal tone"
          ],
          duration: "30 seconds",
          key_outputs: []
        },
        {
          name: "basic_info",
          description: "Collect basic identification information",
          objectives: [
            "Get manager's name",
            "Get organization name",
            "Get team size"
          ],
          duration: "1 minute",
          key_outputs: [
            "manager_name",
            "organization",
            "team_size"
          ]
        },
        {
          name: "challenge_capture",
          description: "Understand primary team challenge",
          objectives: [
            "Identify main pain point",
            "Understand urgency"
          ],
          duration: "2 minutes",
          key_outputs: [
            "primary_challenge",
            "challenge_impact"
          ]
        },
        {
          name: "timeline_check",
          description: "Understand their timeline preferences",
          objectives: [
            "When they want to start",
            "How fast they need results"
          ],
          duration: "1 minute",
          key_outputs: [
            "start_preference",
            "urgency_level"
          ]
        },
        {
          name: "wrap_up",
          description: "Confirm details and set next steps",
          objectives: [
            "Summarize what we learned",
            "Confirm next step",
            "Thank them"
          ],
          duration: "30 seconds",
          key_outputs: [
            "confirmed_details",
            "next_action"
          ]
        }
      ],
      transitions: [
        {
          from: "greeting",
          to: "basic_info",
          condition: "greeting_acknowledged",
          action: "start_questions"
        },
        {
          from: "basic_info",
          to: "challenge_capture",
          condition: "basic_info_complete",
          action: "dig_into_challenges"
        },
        {
          from: "challenge_capture",
          to: "timeline_check",
          condition: "challenge_identified",
          action: "check_timeline"
        },
        {
          from: "timeline_check",
          to: "wrap_up",
          condition: "timeline_captured",
          action: "summarize_and_close"
        },
        {
          from: "wrap_up",
          to: "END",
          condition: "confirmation_received",
          action: "schedule_discovery"
        }
      ]
    },
    
    extractionRules: {
      manager_name: {
        type: 'string',
        patterns: [
          "(?:I'm|I am|My name is|Call me)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)",
          "^([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\s+here"
        ],
        required: true,
        description: "Manager's name"
      },
      organization: {
        type: 'string',
        patterns: [
          "(?:work at|from|with|represent)\\s+([A-Za-z0-9\\s&,.-]+)",
          "(?:company|organization|org)\\s+(?:is|called)?\\s+([A-Za-z0-9\\s&,.-]+)"
        ],
        required: true,
        description: "Organization name"
      },
      team_size: {
        type: 'number',
        patterns: [
          "(\\d+)\\s*(?:people|members|employees|staff|direct reports|folks)"
        ],
        required: true,
        description: "Number of team members"
      },
      primary_challenge: {
        type: 'string',
        patterns: [
          "(?:challenge|problem|issue|struggle)\\s+(?:is|we have)\\s+(.+)",
          "(?:facing|dealing with|struggling with)\\s+(.+)"
        ],
        required: true,
        description: "Main team challenge"
      },
      challenge_impact: {
        type: 'string',
        description: "How the challenge affects the team"
      },
      start_preference: {
        type: 'string',
        patterns: [
          "(?:start|begin|kick off)\\s+(.+)",
          "(?:timeline|timeframe)\\s+(?:is|would be)\\s+(.+)"
        ],
        description: "When they want to start"
      },
      urgency_level: {
        type: 'string',
        patterns: [
          "(?:urgent|asap|immediately|critical)",
          "(?:no rush|flexible|whenever)"
        ],
        description: "How urgent the need is"
      }
    }
  },

  OrchestratorAgent: {
    systemPrompt: `You are the Orchestrator Agent for teamOS, the master conductor of team transformation journeys based on 40+ years of Team Management Systems research.

Your Core Purpose:
Manage the entire team transformation lifecycle by coordinating specialized agents, monitoring progress, and ensuring teams successfully navigate the eight fundamental questions of High Energy Teams.

The 8 HET Questions:
1. Who are we - Understanding differences
2. Where are we now - Current state
3. Where are we going - Vision and purpose
4. How will we get there - Implementation
5. What is expected of us - Role clarity
6. What support do we need - Development
7. How effective are we - Performance
8. What recognition do we get - Motivation

Primary Responsibilities:

Journey Management:
- Assess where teams are in their transformation journey
- Create customized transformation roadmaps spanning 12-16 weeks
- Adjust timelines based on team readiness
- Ensure continuous progress through the HET framework

Agent Coordination:
- Discovery Agent for initial team analysis
- Onboarding Agent to engage managers
- Assessment Agent to deploy tools
- Alignment Agent for values workshops
- Learning Agent for development content
- Nudge Agent for timely insights
- Progress Monitor for tracking metrics
- Recognition Agent for celebrations

Tool Selection Strategy:
- New teams: Team Signals then TMP then WoWV
- Performance issues: Diagnose root cause first
- Leadership development: LLP 360 assessment
- Crisis intervention: WoWV for values alignment
- Comprehensive transformation: Full suite

Decision Framework:
For new teams - Start with Discovery and Onboarding
For teams with conflict - Prioritize values alignment
For teams facing change - Assess change readiness
For leadership needs - Deploy 360 assessment
Otherwise - Run Team Signals pulse check

Success Indicators:
- Early values alignment within 4 weeks
- 60-70 percent preference-task match
- Balanced team composition
- Regular pulse checks showing improvement
- Strong leader participation
- Documented action plans
- Linking skills development

Risk Patterns to Watch:
- Assessment without action
- Leader non-participation
- Values misalignment ignored
- Tool overload
- Lack of psychological safety
- Short-term thinking

Key Principles:
- Every team transformation is unique
- All recommendations grounded in TMS research
- Technology enables but does not replace human connection
- Regular reviews and course corrections
- Balance individual development with team success
- Transformation is a journey not an event

You are the guardian of transformation quality, ensuring teams achieve genuine lasting high performance.

## Transformation Phases You Manage
1. Discovery & Assessment
2. Strategy & Planning
3. Implementation & Change
4. Monitoring & Optimization
5. Continuous Improvement

## Decision Framework
- For new teams: Start with Discovery Agent
- For teams with clear problems: Activate Assessment Agent
- For teams ready to change: Deploy implementation agents
- For mature teams: Focus on optimization agents

Remember: You're the conductor of the orchestra, ensuring each specialist plays their part at the right time.`,
    
    flowConfig: {
      states: [
        {
          name: "status_check",
          description: "Check current transformation status",
          objectives: ["Review progress", "Identify current phase", "Check for blockers"],
          key_outputs: ["current_phase", "completion_percentage", "active_agents"]
        },
        {
          name: "phase_planning",
          description: "Plan next phase of transformation",
          objectives: ["Determine next steps", "Select appropriate agents", "Set milestones"],
          key_outputs: ["next_phase", "agent_sequence", "milestones"]
        },
        {
          name: "agent_coordination",
          description: "Coordinate agent activities",
          objectives: ["Activate agents", "Monitor progress", "Manage handoffs"],
          key_outputs: ["active_agents", "handoff_schedule"]
        },
        {
          name: "progress_review",
          description: "Review transformation progress",
          objectives: ["Analyze metrics", "Identify successes", "Address challenges"],
          key_outputs: ["progress_report", "recommendations"]
        }
      ],
      transitions: [
        {
          from: "status_check",
          to: "phase_planning",
          condition: "status_assessed",
          action: "plan_next_phase"
        },
        {
          from: "phase_planning",
          to: "agent_coordination",
          condition: "phase_planned",
          action: "activate_agents"
        },
        {
          from: "agent_coordination",
          to: "progress_review",
          condition: "milestone_reached",
          action: "review_progress"
        },
        {
          from: "progress_review",
          to: "status_check",
          condition: "review_complete",
          action: "update_status"
        }
      ]
    },
    
    extractionRules: {
      current_phase: {
        type: 'string',
        required: true,
        description: "Current transformation phase"
      },
      completion_percentage: {
        type: 'number',
        description: "Overall transformation completion"
      },
      active_agents: {
        type: 'array',
        description: "List of currently active agents"
      },
      blockers: {
        type: 'array',
        description: "Current blockers or issues"
      }
    }
  },

  // Add other agents with similar simplified structure...
  DiscoveryAgent: {
    systemPrompt: `You are the Discovery Agent for teamOS, specializing in deep team analysis and insight generation.

## Your Role
You conduct thorough discovery sessions to understand team dynamics, challenges, and opportunities. You're like an organizational detective, uncovering the real story behind team performance.

## Core Objectives
1. Map team structure and relationships
2. Understand work processes and workflows
3. Identify communication patterns
4. Uncover hidden challenges and opportunities
5. Generate actionable insights

## Your Approach
- Ask probing questions that go beyond surface issues
- Look for patterns and connections
- Use TMS research to validate findings
- Create comprehensive team profiles

Remember: Great transformations start with great understanding.`,
    
    flowConfig: {
      states: [
        {
          name: "discovery_intro",
          description: "Introduce discovery process",
          objectives: ["Set expectations", "Build trust", "Explain value"],
          key_outputs: []
        },
        {
          name: "team_mapping",
          description: "Map team structure and roles",
          objectives: ["Understand hierarchy", "Identify key players", "Map relationships"],
          key_outputs: ["team_structure", "key_roles", "relationship_map"]
        },
        {
          name: "process_analysis",
          description: "Analyze work processes",
          objectives: ["Map workflows", "Identify bottlenecks", "Understand tools"],
          key_outputs: ["work_processes", "bottlenecks", "tools_used"]
        },
        {
          name: "insight_synthesis",
          description: "Synthesize findings into insights",
          objectives: ["Connect patterns", "Generate insights", "Create recommendations"],
          key_outputs: ["key_insights", "recommendations", "priority_areas"]
        }
      ],
      transitions: [
        {
          from: "discovery_intro",
          to: "team_mapping",
          condition: "intro_complete",
          action: "start_mapping"
        },
        {
          from: "team_mapping",
          to: "process_analysis",
          condition: "structure_mapped",
          action: "analyze_processes"
        },
        {
          from: "process_analysis",
          to: "insight_synthesis",
          condition: "analysis_complete",
          action: "synthesize_findings"
        }
      ]
    },
    
    extractionRules: {
      team_structure: {
        type: 'string',
        required: true,
        description: "How the team is organized"
      },
      work_processes: {
        type: 'array',
        required: true,
        description: "Key work processes"
      },
      bottlenecks: {
        type: 'array',
        description: "Process bottlenecks identified"
      },
      key_insights: {
        type: 'array',
        required: true,
        description: "Main insights from discovery"
      }
    }
  }
};