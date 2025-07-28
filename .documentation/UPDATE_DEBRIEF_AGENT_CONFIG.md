# Updating DebriefAgent Configuration

The DebriefAgent is currently using an old configuration (version 17) that includes a debrief flow. This guide explains how to update it to the new direct Q&A configuration.

## Issue
The debrief agent is still:
- Asking for objectives, highlights, and communication tips
- Following a structured debrief flow
- Not using the new report search tools
- Using configuration version 17

## Solution

### Option 1: Update via Admin UI (Recommended)

1. Go to the admin panel: http://localhost:3000/admin/agents/config
2. Select "DebriefAgent" from the list
3. Replace the entire System Prompt with the new prompt (see below)
4. Clear the Flow Configuration:
   ```json
   {
     "states": [],
     "transitions": []
   }
   ```
5. Update Tools Configuration:
   ```json
   {
     "enabledTools": [
       "get_report_context",
       "search_report_chunks", 
       "search_tms_knowledge",
       "get_assessment_methodology",
       "tms_get_dashboard_subscriptions",
       "tms_debrief_report"
     ]
   }
   ```
6. Save the configuration

### Option 2: Run the Update Script

```bash
# Run the script that shows the new configuration
node scripts/update-debrief-config.js

# The script will display the new system prompt and instructions
```

### Option 3: Direct Database Update

```bash
# Run with ts-node
npx ts-node scripts/direct-update-debrief-config.ts
```

## New System Prompt

```
You are the Debrief Agent for teamOS, an expert in TMS assessment interpretation and analysis.

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
- `get_report_context`: Get a full summary of the user's report including scores and roles
- `search_report_chunks`: Search for specific content within the report
- `search_tms_knowledge`: Look up TMS concepts and methodologies
- `get_assessment_methodology`: Get detailed methodology information

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
- Use your tools to search for specific information when needed
```

## Verification

After updating, verify the changes:

1. Start a new debrief chat
2. Ask a direct question like "What are my strengths?"
3. The agent should:
   - Answer immediately without asking for objectives
   - Use specific data from your report
   - Not go through a debrief flow

## Troubleshooting

If the agent still uses the old configuration:

1. **Clear the cache**: The configuration might be cached. Restart the Next.js server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Check the version**: In the logs, look for:
   ```
   [DebriefAgent] Loaded configuration version X
   ```
   It should show a version higher than 17.

3. **Force reload**: Clear your browser cache and reload the page

4. **Database check**: Verify the active configuration:
   ```sql
   SELECT version, active, updatedAt 
   FROM AgentConfiguration 
   WHERE agentName = 'DebriefAgent' 
   ORDER BY version DESC 
   LIMIT 5;
   ```

## Technical Details

The new configuration:
- Removes all flow states and transitions
- Adds report search tools (`search_report_chunks`, `get_report_context`)
- Updates the system prompt for direct Q&A
- Maintains access to TMS knowledge tools

The report search tools are automatically loaded by the DebriefAgent class and will:
- Search through stored report chunks
- Retrieve full report context
- Use the conversation metadata (userId, subscriptionId, reportId)