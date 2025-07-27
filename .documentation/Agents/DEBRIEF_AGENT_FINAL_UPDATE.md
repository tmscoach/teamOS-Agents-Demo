# DebriefAgent Final Configuration Update

## Overview

The DebriefAgent has been updated to provide direct Q&A functionality with access to stored report embeddings and the TMS knowledge base. The agent no longer follows a structured debrief flow and instead answers user questions immediately.

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

## Technical Implementation

### 1. Report Search Tools

Two new tools have been added to the DebriefAgent:

#### SearchReportChunksSchema
- Searches through stored report chunks using text search (will be upgraded to vector search)
- Automatically uses report context from the conversation
- Returns relevant sections based on user queries

#### GetReportContextSchema
- Retrieves a full summary of the user's report
- Includes scores, roles, and section summaries
- Uses subscription ID and user ID from context

### 2. Context Enhancement

The debrief route (`/app/api/chat/debrief/route.ts`) now:
- Retrieves the stored report ID from the database
- Passes report ID, user ID, and subscription ID in context metadata
- Provides full report content for immediate access

### 3. Tool Integration

The DebriefAgent (`/src/lib/agents/implementations/debrief-agent.ts`):
- Automatically loads report search tools on initialization
- Passes context to tools for automatic report identification
- No longer requires manual report loading

## Configuration Steps

1. **Update Agent Configuration**
   - Go to http://localhost:3000/admin/agents/config
   - Select DebriefAgent
   - Replace the system prompt with the new version above
   - Remove any flow configuration
   - Save changes

2. **Verify Tools**
   - Ensure the following tools are enabled:
     - search_report_chunks (automatically added)
     - get_report_context (automatically added)
     - search_tms_knowledge
     - get_assessment_methodology

3. **Test the Agent**
   - Open a debrief chat
   - Ask direct questions like:
     - "What are my strengths?"
     - "What does my Upholder-Maintainer role mean?"
     - "How do I communicate better with extroverts?"
   - Verify the agent answers immediately without asking for objectives

## Future Enhancements

1. **Vector Search Implementation**
   - Replace text search with vector embeddings
   - Use OpenAI embeddings for semantic search
   - Store embeddings in pgvector column

2. **Report Chunk Processing**
   - Improve chunking strategy for better search results
   - Add metadata extraction for more precise queries

3. **Analytics Integration**
   - Track which sections users ask about most
   - Provide insights to managers about team interests

## Summary

The DebriefAgent now:
- ✅ Has direct access to stored report data through search tools
- ✅ Can search specific sections of reports
- ✅ Answers questions immediately without a flow
- ✅ Uses actual report data instead of generic responses
- ✅ Has access to TMS knowledge base for concept explanations
- ✅ Automatically gets report context from the conversation

The agent is ready for testing with the simplified Q&A approach.