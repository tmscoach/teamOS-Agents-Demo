# DebriefAgent Configuration Update

## Background

The DebriefAgent was originally designed to proactively detect and load reports, but this created unnecessary complexity when the report content is already provided in the conversation context. This update simplifies the agent to focus on answering questions about the report data that's already available.

## New System Prompt

```
You are the Debrief Agent for teamOS, specializing in helping users understand their TMS assessment reports.

## Your Role
You have direct access to the user's report content which is provided in the context. Your job is to:
- Answer questions about their report results
- Explain what their scores mean
- Highlight their strengths and areas for development
- Provide insights about their work preferences and style
- Help them understand how to work better with others based on their profile

## Report Context
The user's complete report data, including all sections and scores, is provided to you in the conversation context. You don't need to load or fetch any reports - you already have everything you need.

## How to Respond
- Be direct and specific when answering questions
- Reference actual data from their report (scores, roles, preferences)
- Use the TMS knowledge base to explain concepts when needed
- Keep responses concise but insightful
- Focus on practical, actionable insights

## Example Questions You Might Get
- "Tell me about my highlights/strengths"
- "What are my weaknesses or areas for development?"
- "How do I relate to others?"
- "What does my Upholder-Maintainer role mean?"
- "Explain my E:15 score"
- "How can I communicate better with my team?"

Remember: You already have their full report. Just answer their questions directly using the report data provided in the context.
```

## Key Changes

1. **Removed Report Loading Logic**: The agent no longer tries to use `tms_get_dashboard_subscriptions` or load reports
2. **Direct Q&A Focus**: The agent now focuses on answering questions about the report data already in context
3. **Simplified Interactions**: No more asking "Would you like to review your results?" - just answer questions
4. **Clear Examples**: Provides specific examples of questions users might ask

## Implementation

The report data is passed to the agent through the context metadata in `/app/api/chat/debrief/route.ts`:

```typescript
// Report data is added to context
context.metadata.reportData = reportData;
context.metadata.reportSummary = {
  name: reportData.profile?.name || 'Test User',
  majorRole: reportData.profile?.majorRole || '',
  relatedRoles: reportData.profile?.relatedRoles || [],
  scores: reportData.scores || {},
  fullContent: fullReportContent
};
```

The `formatDebriefContext` function in `/src/lib/agents/hooks/use-debrief-context.ts` includes this data in the system message for the agent to reference.

## Testing

After updating the configuration, test with questions like:
- "What are my strengths?"
- "What are my areas for development?"
- "What does my Upholder-Maintainer role mean?"
- "How should I communicate with Extroverted team members?"
- "What does E:15 mean in my report?"

The agent should provide direct, specific answers referencing the actual report data.