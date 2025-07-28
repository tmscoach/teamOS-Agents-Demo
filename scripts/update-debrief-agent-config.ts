#!/usr/bin/env ts-node
/**
 * Script to update the DebriefAgent configuration
 * This removes the debrief flow and enables direct Q&A with report access
 */

import { Clerk } from '@clerk/clerk-sdk-node';
import fetch from 'node-fetch';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!CLERK_SECRET_KEY) {
  console.error('❌ CLERK_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize Clerk
const clerk = new Clerk({ secretKey: CLERK_SECRET_KEY });

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
- \`search_tms_knowledge\`: Look up TMS concepts and methodologies (ALWAYS use limit: 5 or more)
- \`get_assessment_methodology\`: Get detailed methodology information

## CRITICAL: Knowledge Base Search Tips
1. **Always use limit: 5 or more** when searching the knowledge base - the default limit: 1 is too restrictive
2. **For acronyms like ICAF, ICBS, EPBF**: Also search for their full meanings or related terms:
   - ICAF → Also search "Creator-Innovator" or "Introverted Creative"
   - ICBS → Also search "Controller-Inspector" or "Introverted Controlling"
   - EPBF → Also search "Explorer-Promoter" or "Extroverted Promoting"
3. **The TMP handbook exists** - it contains 565 chunks. Search with limit: 5 for "Team Management Profile" or specific concepts
4. **If first search fails**: Try related terms, broader concepts, or use get_assessment_methodology tool

## Example Interactions

User: "What are my strengths?"
You: Based on your report, your key strengths as an Upholder-Maintainer include:
- Strong on ideas and innovation
- Quietly confident and persevering in team interests
- Ability to grasp complex issues and commit energy to new approaches
- Establishing harmonious, close-knit teams

User: "What does E:15 mean?"
You: E:15 represents your Extrovert score of 15. In the TMS methodology, this indicates you have a moderate preference for introversion (since the scale typically ranges from 0-30, with lower scores indicating more extroverted preferences).

User: "What does ICAF mean?"
You: [Uses search_tms_knowledge with query="ICAF Creator-Innovator", limit=5]
ICAF stands for Introverted Creative Advising Flexible. It's part of the 16-fold Team Management Wheel coding system and represents the Creator-Innovator role. People with this profile tend to be imaginative, independent thinkers who enjoy working on complex problems and developing innovative solutions.

User: "Tell me about my weaknesses"
You: Your report identifies these areas for development:
- Communication can be challenging as you prefer working alone
- You may make decisions too quickly based on beliefs rather than information
- Others may find it hard to know what you're thinking due to your individualistic nature

## Important Notes
- Always use the report data provided in context
- Don't ask users to confirm details that are already in their report
- Don't go through a structured debrief flow - just answer their questions
- Use your tools to search for specific information when needed
- ALWAYS use limit: 5 or more for knowledge base searches`;

async function updateDebriefAgentConfig() {
  try {
    console.log('🔄 Starting DebriefAgent configuration update...');

    // Get a session token (you would need to authenticate as an admin user)
    // For this script, we'll use the Clerk API to create a session
    console.log('🔐 Creating admin session...');

    // First, find an admin user
    const users = await clerk.users.getUserList({ limit: 100 });
    const adminUser = users.find(user => 
      user.emailAddresses.some(email => 
        email.emailAddress?.includes('admin') || 
        email.emailAddress?.includes('rowan')
      )
    );

    if (!adminUser) {
      console.error('❌ No admin user found');
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.emailAddresses[0]?.emailAddress}`);

    // Create a session token for the admin user
    const sessionToken = await clerk.sessions.createSessionToken(adminUser.id, {
      sessionId: 'script-session'
    });

    // Update the configuration
    console.log('📝 Updating DebriefAgent configuration...');
    
    const response = await fetch(`${BASE_URL}/api/admin/agents/config?action=update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        agentName: 'DebriefAgent',
        systemPrompt: NEW_SYSTEM_PROMPT,
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
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to update configuration:', error);
      return;
    }

    const result = await response.json();
    console.log('✅ Configuration updated successfully!');
    console.log(`📊 New version: ${result.version}`);
    console.log(`🕒 Updated at: ${result.updatedAt}`);
    
    console.log('\n🎉 DebriefAgent configuration has been updated!');
    console.log('The agent will now:');
    console.log('✅ Answer questions directly without a debrief flow');
    console.log('✅ Have access to report search tools');
    console.log('✅ Use actual report data from stored reports');
    console.log('✅ Provide immediate, contextual responses');

  } catch (error) {
    console.error('❌ Error updating configuration:', error);
  }
}

// Run the script
updateDebriefAgentConfig();