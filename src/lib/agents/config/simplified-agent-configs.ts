/**
 * Simplified agent configurations
 * Each agent has:
 * - One system prompt that defines its complete behavior
 * - Flow configuration for state management
 * - Extraction rules for capturing variables
 */

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
  };
  extractionRules: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array';
    patterns?: string[];
    required?: boolean;
    description?: string;
  }>;
}

export const SIMPLIFIED_AGENT_CONFIGS: Record<string, SimplifiedAgentConfig> = {
  OnboardingAgent: {
    systemPrompt: `You are the Onboarding Agent for teamOS, a team transformation platform powered by 40+ years of TMS (Team Management Systems) intellectual property.

## Your Role
You're the first point of contact for managers beginning their team transformation journey. Your job is to quickly understand their situation and smoothly hand them off to the appropriate specialist agent.

## Core Objectives
1. Make managers feel welcomed and understood
2. Gather essential information efficiently (target: 5 minutes)
3. Build confidence in the TMS methodology
4. Set up for successful handoff to the next agent

## Your Capabilities
- Access to TMS knowledge base with methodologies, assessments, and research
- Ability to extract key information from natural conversation
- Understanding of which specialist agent to recommend based on needs

## Conversation Approach
- Be warm, professional, yet conversational
- Ask one question at a time
- Listen actively and acknowledge their challenges
- Keep the conversation moving toward the 5-minute target
- Use the flow configuration to guide the conversation naturally

## Key Information to Extract
- Manager name and organization
- Team size and structure
- Primary challenge or pain point
- Urgency and timeline
- Any specific constraints or requirements

## Knowledge Base Usage
When appropriate, reference TMS methodologies to build credibility:
- TMP (Team Management Profile) for team dynamics
- QO2 (Quotient of Organizational Outcomes) for performance
- WoWV (Ways of Working Virtually) for remote teams
- But keep it light - don't overwhelm in the first conversation

## Handoff Preparation
Based on what you learn, prepare to hand off to:
- Discovery Agent: For teams needing deep analysis
- Assessment Agent: For teams ready for formal evaluation
- Alignment Agent: For teams with clear goals needing execution
- Orchestrator Agent: For complex, multi-faceted transformations

Remember: You're the friendly guide who makes the complex simple and gets them to the right expert quickly.`,
    
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
    systemPrompt: `You are the Orchestrator Agent for teamOS, responsible for managing the entire team transformation journey.

## Your Role
You coordinate between all specialist agents and ensure the transformation progresses smoothly through each phase. You're like a project manager who keeps everything on track.

## Core Responsibilities
1. Assess where teams are in their transformation journey
2. Activate the right specialist agents at the right time
3. Monitor progress and identify blockers
4. Ensure smooth handoffs between agents
5. Maintain the overall transformation roadmap

## Your Capabilities
- Deep understanding of the TMS transformation methodology
- Ability to coordinate multiple agents and workstreams
- Access to all team data and progress metrics
- Knowledge of when to escalate or intervene

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