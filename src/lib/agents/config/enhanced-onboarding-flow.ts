/**
 * Enhanced TMS-based onboarding flow configuration
 * Based on analysis of TMS methodology and High Energy Teams framework
 */

import { FlowConfiguration } from '../graph/types';

export const ENHANCED_ONBOARDING_FLOW: FlowConfiguration = {
  id: "onboarding-flow-v2",
  name: "TMS-Based Manager Onboarding",
  version: 2,
  states: {
    "greeting": {
      id: "greeting",
      name: "Welcome & Introduction",
      description: "Welcome manager and introduce TMS approach",
      systemPromptOverride: `You are welcoming a new manager to teamOS. Your goal is to:
- Create a warm, professional first impression
- Briefly explain the value of TMS (40+ years of research)
- Set expectations for a 5-10 minute conversation
- Get their name and make them feel comfortable

Keep it conversational and avoid overwhelming them with details.`,
      dataRequirements: {
        required: ["manager_name"],
        optional: ["organization", "referral_source"]
      },
      availableTools: ["knowledge_search"],
      exitConditions: [{
        id: "name_captured",
        type: "data_complete",
        config: { fields: ["manager_name"] }
      }],
      maxDuration: 2
    },
    
    "team_discovery": {
      id: "team_discovery",
      name: "Team Context Discovery",
      description: "Understand team structure and dynamics",
      systemPromptOverride: `Now explore the manager's team context. Ask about:
- Team size and structure
- How long they've been managing this team
- Industry/department context
- Any recent changes or transitions

Use the High Energy Teams question "Who are we?" to guide this discovery.`,
      dataRequirements: {
        required: ["team_size", "team_tenure", "industry"],
        optional: ["team_structure", "recent_changes", "team_location"]
      },
      exitConditions: [{
        id: "team_context_complete",
        type: "data_complete",
        config: { fields: ["team_size", "team_tenure", "industry"] }
      }],
      maxDuration: 5
    },
    
    "challenge_identification": {
      id: "challenge_identification",
      name: "Challenge Exploration",
      description: "Identify primary challenges using TMS framework",
      systemPromptOverride: `Explore their team challenges using the High Energy Teams framework. Consider:
1. Where are we now? (Current state)
2. Where are we going? (Vision alignment)
3. How will we get there? (Implementation challenges)
4. What is expected of us? (Role clarity issues)
5. What support do we need? (Development gaps)
6. How effective are we? (Performance concerns)
7. What recognition do we get? (Motivation issues)

Help them articulate their primary challenge and its impact.`,
      dataRequirements: {
        required: ["primary_challenge", "challenge_impact", "urgency_level"],
        optional: ["secondary_challenges", "attempted_solutions"]
      },
      availableTools: ["knowledge_search", "assessment_matcher"],
      exitConditions: [{
        id: "challenge_identified",
        type: "data_complete",
        config: { fields: ["primary_challenge", "challenge_impact"] }
      }],
      maxDuration: 8
    },
    
    "assessment_recommendation": {
      id: "assessment_recommendation",
      name: "Assessment Selection",
      description: "Recommend appropriate TMS assessments",
      systemPromptOverride: `Based on their challenges, recommend the appropriate TMS assessment sequence:

1. **Team Signals** - Quick pulse check (if they need immediate insights)
2. **TMP (Team Management Profile)** - Understand work preferences and team balance
3. **QO2 (Opportunities-Obstacles Quotient)** - Assess risk orientation and decision-making
4. **WoWV (Window on Work Values)** - Align core values for lasting change
5. **LLP (Linking Leader Profile)** - Develop leadership capabilities

Explain why these assessments address their specific challenges.`,
      dataRequirements: {
        required: ["recommended_assessments", "assessment_timeline"],
        optional: ["budget_range", "stakeholder_buy_in"]
      },
      exitConditions: [{
        id: "assessments_selected",
        type: "data_complete",
        config: { fields: ["recommended_assessments"] }
      }],
      maxDuration: 5
    },
    
    "goal_setting": {
      id: "goal_setting",
      name: "Transformation Goals",
      description: "Define success metrics aligned with TMS methodology",
      systemPromptOverride: `Help them define SMART transformation goals. Consider:
- What specific outcomes do they want to achieve?
- How will they measure success?
- What's their realistic timeline (typically 12-16 weeks)?
- How will this transformation align with organizational objectives?

Reference relevant TMS success stories from the knowledge base if helpful.`,
      dataRequirements: {
        required: ["success_metrics", "timeline_preference"],
        optional: ["specific_outcomes", "constraints"]
      },
      exitConditions: [{
        id: "goals_defined",
        type: "data_complete",
        config: { fields: ["success_metrics", "timeline_preference"] }
      }],
      maxDuration: 5
    },
    
    "parallel_info_gathering": {
      id: "parallel_info_gathering",
      name: "Parallel Information Collection",
      description: "Gather additional context while processing",
      parallel: true,
      nodes: ["stakeholder_mapping", "resource_assessment"],
      dataRequirements: {
        required: [],
        optional: []
      },
      exitConditions: [{
        id: "parallel_complete",
        type: "parallel_complete",
        config: { nodes: ["stakeholder_mapping", "resource_assessment"] }
      }],
      maxDuration: 10
    },
    
    "stakeholder_mapping": {
      id: "stakeholder_mapping",
      name: "Stakeholder Analysis",
      description: "Identify key stakeholders and decision makers",
      systemPromptOverride: `Identify key stakeholders for the transformation:
- Who needs to be involved in the process?
- Who are the champions who will support change?
- Who might be skeptical and need convincing?
- What's the decision-making process?`,
      dataRequirements: {
        required: ["key_stakeholders"],
        optional: ["stakeholder_concerns", "decision_process"]
      },
      exitConditions: [{
        id: "stakeholders_mapped",
        type: "data_complete",
        config: { fields: ["key_stakeholders"] }
      }],
      maxDuration: 5
    },
    
    "resource_assessment": {
      id: "resource_assessment",
      name: "Resource Evaluation",
      description: "Understand available resources and constraints",
      systemPromptOverride: `Assess their resources and readiness:
- How much time can they and their team dedicate?
- What's their budget range for assessments and development?
- Are there any technical or logistical constraints?
- What support do they have from leadership?`,
      dataRequirements: {
        required: ["time_availability", "team_readiness"],
        optional: ["budget_approval", "technical_constraints"]
      },
      exitConditions: [{
        id: "resources_assessed",
        type: "data_complete",
        config: { fields: ["time_availability"] }
      }],
      maxDuration: 5
    },
    
    "plan_creation": {
      id: "plan_creation",
      name: "Transformation Plan",
      description: "Create customized transformation roadmap",
      systemPromptOverride: `Create a customized 12-16 week transformation plan based on everything you've learned:

Week 1-2: Initial assessments (Team Signals + TMP)
Week 3-4: Team debrief and insight sessions
Week 5-8: Targeted interventions based on findings
Week 9-12: Implementation and behavior change
Week 13-16: Reinforcement and measurement

Highlight quick wins they can achieve in the first 30 days.`,
      dataRequirements: {
        required: ["transformation_plan", "next_steps"],
        optional: ["risk_mitigation", "quick_wins"]
      },
      exitConditions: [{
        id: "plan_created",
        type: "data_complete",
        config: { fields: ["transformation_plan", "next_steps"] }
      }],
      maxDuration: 5
    },
    
    "handoff_preparation": {
      id: "handoff_preparation",
      name: "Agent Handoff",
      description: "Prepare for handoff to specialist agent",
      systemPromptOverride: `Prepare for handoff to the appropriate specialist agent:
- Assessment Agent: If they're ready to start with formal assessments
- Discovery Agent: If they need deeper analysis first
- Alignment Agent: If they have clear goals and just need execution support
- Learning Agent: If they need capability building first

Summarize what you've learned and ensure they feel confident about next steps.`,
      dataRequirements: {
        required: ["handoff_agent", "handoff_summary"],
        optional: ["scheduling_preference"]
      },
      exitConditions: [{
        id: "handoff_ready",
        type: "data_complete",
        config: { fields: ["handoff_agent", "handoff_summary"] }
      }],
      maxDuration: 3
    }
  },
  
  transitions: [
    {
      id: "greeting_to_discovery",
      from: "greeting",
      to: "team_discovery",
      condition: {
        type: "all",
        rules: [{ type: "data_exists", field: "manager_name" }]
      },
      priority: 10
    },
    {
      id: "discovery_to_challenges",
      from: "team_discovery",
      to: "challenge_identification",
      condition: {
        type: "all",
        rules: [
          { type: "data_exists", field: "team_size" },
          { type: "data_exists", field: "team_tenure" }
        ]
      },
      priority: 10
    },
    {
      id: "challenges_to_assessment",
      from: "challenge_identification",
      to: "assessment_recommendation",
      condition: {
        type: "all",
        rules: [{ type: "data_exists", field: "primary_challenge" }]
      },
      priority: 10
    },
    {
      id: "assessment_to_goals",
      from: "assessment_recommendation",
      to: "goal_setting",
      condition: {
        type: "all",
        rules: [{ type: "data_exists", field: "recommended_assessments" }]
      },
      priority: 10
    },
    {
      id: "goals_to_parallel",
      from: "goal_setting",
      to: "parallel_info_gathering",
      condition: {
        type: "all",
        rules: [{ type: "data_exists", field: "success_metrics" }]
      },
      priority: 10
    },
    {
      id: "parallel_to_plan",
      from: "parallel_info_gathering",
      to: "plan_creation",
      condition: {
        type: "custom",
        rules: [{ 
          type: "custom",
          expression: "context.parallelResults && Object.keys(context.parallelResults).length >= 2"
        }]
      },
      priority: 10
    },
    {
      id: "plan_to_handoff",
      from: "plan_creation",
      to: "handoff_preparation",
      condition: {
        type: "all",
        rules: [{ type: "data_exists", field: "transformation_plan" }]
      },
      priority: 10
    },
    
    // Alternative paths for different scenarios
    {
      id: "challenges_to_goals_direct",
      from: "challenge_identification",
      to: "goal_setting",
      condition: {
        type: "all",
        rules: [
          { type: "data_exists", field: "primary_challenge" },
          { type: "data_equals", field: "urgency_level", value: "immediate" }
        ]
      },
      priority: 15  // Higher priority for urgent cases
    },
    {
      id: "goals_to_plan_direct",
      from: "goal_setting",
      to: "plan_creation",
      condition: {
        type: "all",
        rules: [
          { type: "data_exists", field: "success_metrics" },
          { type: "data_equals", field: "team_size", value: 5 }  // Small teams skip parallel
        ]
      },
      priority: 12
    }
  ],
  
  settings: {
    initialState: "greeting",
    finalStates: ["handoff_preparation"],
    checkpointStates: ["team_discovery", "challenge_identification", "goal_setting", "plan_creation"],
    defaultTransitionDelay: 500,
    maxTotalDuration: 45,
    abandonmentBehavior: "save_progress",
    parallelExecutionEnabled: true
  }
};

/**
 * Enhanced extraction rules for TMS-based onboarding
 */
export const ENHANCED_EXTRACTION_RULES = {
  manager_name: {
    type: "string",
    patterns: ["my name is", "I'm", "call me", "this is"],
    required: true,
    description: "Manager's preferred name"
  },
  organization: {
    type: "string",
    patterns: ["work at", "from", "with", "company", "organization"],
    description: "Company or organization name"
  },
  team_size: {
    type: "number",
    patterns: ["team of", "manage", "people", "direct reports", "employees"],
    required: true,
    description: "Number of team members"
  },
  team_tenure: {
    type: "string",
    patterns: ["been managing", "years", "months", "started", "new to"],
    required: true,
    description: "How long managing this team"
  },
  industry: {
    type: "string",
    patterns: ["industry", "sector", "field", "business", "work in"],
    required: true,
    description: "Industry or sector"
  },
  primary_challenge: {
    type: "string",
    patterns: ["challenge", "problem", "issue", "struggling with", "difficulty"],
    required: true,
    description: "Main team challenge"
  },
  challenge_impact: {
    type: "string",
    patterns: ["affecting", "impact", "causing", "result", "leads to"],
    required: true,
    description: "Impact of the challenge"
  },
  urgency_level: {
    type: "string",
    patterns: ["urgent", "asap", "immediately", "timeline", "need by", "deadline"],
    required: true,
    description: "How urgent the need is"
  },
  recommended_assessments: {
    type: "array",
    description: "TMS assessments recommended based on needs"
  },
  assessment_timeline: {
    type: "string",
    patterns: ["start assessments", "begin", "timeline for"],
    description: "When to start assessments"
  },
  success_metrics: {
    type: "array",
    patterns: ["success looks like", "goals", "objectives", "achieve", "outcomes"],
    required: true,
    description: "Definition of success"
  },
  timeline_preference: {
    type: "string",
    patterns: ["timeline", "timeframe", "by when", "duration", "how long"],
    required: true,
    description: "Preferred timeline for transformation"
  },
  key_stakeholders: {
    type: "array",
    patterns: ["stakeholders", "involved", "decision makers", "sponsors"],
    required: true,
    description: "Key people involved in transformation"
  },
  time_availability: {
    type: "string",
    patterns: ["dedicate", "commit", "available", "hours per", "time for"],
    required: true,
    description: "Time commitment available"
  },
  team_readiness: {
    type: "string",
    patterns: ["ready", "prepared", "willing", "resistance", "buy-in"],
    description: "Team's readiness for change"
  },
  transformation_plan: {
    type: "string",
    required: true,
    description: "Customized transformation roadmap"
  },
  next_steps: {
    type: "array",
    required: true,
    description: "Immediate next actions"
  },
  handoff_agent: {
    type: "string",
    required: true,
    description: "Which specialist agent to hand off to"
  },
  handoff_summary: {
    type: "string",
    required: true,
    description: "Summary for the next agent"
  }
};