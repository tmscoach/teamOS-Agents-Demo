# Updating DebriefAgent Configuration

## New System Prompt

Replace the current DebriefAgent system prompt with this simplified version:

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

## Steps to Update

1. **Navigate to Admin Config Page**
   - Go to: http://localhost:3000/admin/agents/config
   - You should see the Agent Configuration page

2. **Select DebriefAgent**
   - Click on "DebriefAgent" from the list of agents on the left
   - You'll see the current configuration details

3. **Edit Configuration**
   - Click the "Edit Configuration" button (pencil icon)
   - The System Prompt field will become editable

4. **Replace System Prompt**
   - Clear the existing system prompt
   - Paste the new system prompt from above
   - Keep the other settings as they are:
     - Flow Config: Leave empty or minimal
     - Extraction Rules: Leave empty
     - Guardrail Config: Keep existing
     - Tools Config: Keep enabled tools (search_tms_knowledge, get_assessment_methodology)

5. **Save Changes**
   - Click "Save Changes" button
   - You should see "Configuration saved successfully" message

6. **Test the Changes**
   - Go to a debrief chat session
   - Ask questions like:
     - "What are my strengths?"
     - "Tell me about my weaknesses"
     - "What does E:15 mean?"
     - "How do I work best with others?"
   
The agent should now directly answer questions using the report data without trying to load reports or ask unnecessary questions.

## Key Changes

The new system prompt:
1. Removes the "CRITICAL: Proactive Report Detection" section
2. Removes instructions to use tms_get_dashboard_subscriptions
3. Emphasizes that the report data is already available in context
4. Focuses on directly answering user questions
5. Provides clear examples of expected questions