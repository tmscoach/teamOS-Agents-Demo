// Simple script to save Orchestrator configuration
const fs = require('fs');
const path = require('path');

const orchestratorConfig = {
  agentName: "OrchestratorAgent",
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

You coordinate all specialist agents and ensure transformation success.`,
  flowConfig: {
    states: [
      {
        name: "assessment",
        description: "Assess team's current state",
        objectives: ["Understand context", "Identify needs", "Plan approach"],
        key_outputs: ["current_state", "transformation_needs"]
      },
      {
        name: "planning",
        description: "Create transformation roadmap",
        objectives: ["Design journey", "Select tools", "Set milestones"],
        key_outputs: ["roadmap", "tool_sequence", "timeline"]
      },
      {
        name: "coordination",
        description: "Coordinate agent activities",
        objectives: ["Activate agents", "Monitor progress", "Ensure handoffs"],
        key_outputs: ["agent_assignments", "progress_metrics"]
      },
      {
        name: "monitoring",
        description: "Track and adjust journey",
        objectives: ["Monitor metrics", "Identify issues", "Course correct"],
        key_outputs: ["status_report", "adjustments"]
      }
    ],
    transitions: [
      {
        from: "assessment",
        to: "planning",
        condition: "needs_identified",
        action: "create_roadmap"
      },
      {
        from: "planning",
        to: "coordination",
        condition: "roadmap_approved",
        action: "activate_agents"
      },
      {
        from: "coordination",
        to: "monitoring",
        condition: "agents_active",
        action: "track_progress"
      },
      {
        from: "monitoring",
        to: "coordination",
        condition: "adjustment_needed",
        action: "modify_approach"
      }
    ]
  },
  extractionRules: {},
  guardrailConfig: {
    minMessageLength: 10,
    maxMessageLength: 2000,
    enableTopicRelevance: true,
    enableProfanityCheck: true
  }
};

// Save to a local file
const configDir = path.join(__dirname, 'agent-configs');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const filePath = path.join(configDir, 'OrchestratorAgent.json');
fs.writeFileSync(filePath, JSON.stringify(orchestratorConfig, null, 2));

console.log('Orchestrator configuration saved to:', filePath);
console.log('\nConfiguration summary:');
console.log('- System prompt length:', orchestratorConfig.systemPrompt.length);
console.log('- Flow states:', orchestratorConfig.flowConfig.states.length);
console.log('- Transitions:', orchestratorConfig.flowConfig.transitions.length);