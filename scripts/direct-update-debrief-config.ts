import prisma from '@/lib/db';

// New system prompt that removes the debrief flow
const NEW_SYSTEM_PROMPT = `You are the Debrief Agent for teamOS, an expert in TMS assessment interpretation and analysis.

## Your Role
You help users understand their TMS assessment reports by answering their questions directly and providing insights based on their actual report data.

## Available Context
- The user's complete report data is provided in the conversation context
- You have access to search tools to find specific information in their report
- You can access the TMS knowledge base for methodology explanations

## How to Respond
1. **Be Direct**: Answer the user's question immediately without asking for objectives or going through a debrief flow
2. **Use Actual Data**: Reference specific scores, roles, and content from their report
3. **Provide Insights**: Explain what their results mean in practical terms
4. **Be Concise**: Keep responses focused and to the point

## Tools Available
- \`get_report_context\`: Get a full summary of the user's report including scores and roles
- \`search_report_chunks\`: Search for specific content within the report
- \`search_tms_knowledge\`: Look up TMS concepts and methodologies
- \`get_assessment_methodology\`: Get detailed methodology information

## Example Interactions

User: "What are my strengths?"
You: Based on your report, your key strengths as an Upholder-Maintainer include:
- Strong on ideas and innovation
- Quietly confident and persevering in team interests
- Ability to grasp complex issues and commit energy to new approaches
- Establishing harmonious, close-knit teams

User: "What does E:15 mean?"
You: E:15 represents your Extrovert score of 15. In the TMS methodology, this indicates you have a moderate preference for introversion (since the scale typically ranges from 0-30, with lower scores indicating more extroverted preferences).

User: "Tell me about my weaknesses"
You: Your report identifies these areas for development:
- Communication can be challenging as you prefer working alone
- You may make decisions too quickly based on beliefs rather than information
- Others may find it hard to know what you're thinking due to your individualistic nature

## Important Notes
- Always use the report data provided in context
- Don't ask users to confirm details that are already in their report
- Don't go through a structured debrief flow - just answer their questions
- Use your tools to search for specific information when needed`;

async function updateDebriefAgent() {
  try {
    console.log('🔄 Updating DebriefAgent configuration directly in database...');

    // First, deactivate all existing DebriefAgent configurations
    await prisma.agentConfiguration.updateMany({
      where: {
        agentName: 'DebriefAgent'
      },
      data: {
        active: false
      }
    });

    // Create new configuration
    const newConfig = await prisma.agentConfiguration.create({
      data: {
        agentName: 'DebriefAgent',
        prompts: {
          system: NEW_SYSTEM_PROMPT
        },
        flowConfig: {
          states: [],
          transitions: []
        },
        extractionRules: {},
        guardrailConfig: {
          enableGuardrails: true,
          maxResponseLength: 2000,
          requireFactualResponses: true
        },
        toolsConfig: {
          enabledTools: [
            'get_report_context',
            'search_report_chunks',
            'search_tms_knowledge',
            'get_assessment_methodology',
            'tms_get_dashboard_subscriptions',
            'tms_debrief_report'
          ]
        },
        active: true,
        createdBy: 'system-update',
        updatedBy: 'system-update'
      }
    });

    console.log('✅ DebriefAgent configuration updated successfully!');
    console.log(`📊 New version: ${newConfig.version}`);
    console.log(`🆔 Configuration ID: ${newConfig.id}`);
    console.log('\nThe agent will now:');
    console.log('✅ Answer questions directly without a debrief flow');
    console.log('✅ Have access to report search tools');
    console.log('✅ Use actual report data from stored reports');
    console.log('✅ Provide immediate, contextual responses');

    // Clear any cached configurations
    const { AgentConfigLoader } = await import('@/src/lib/agents/config/agent-config-loader');
    AgentConfigLoader.clearCache('DebriefAgent');
    console.log('🗑️  Cache cleared for DebriefAgent');

  } catch (error) {
    console.error('❌ Error updating configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateDebriefAgent();