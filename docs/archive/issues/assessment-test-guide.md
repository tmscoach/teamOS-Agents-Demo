# Assessment Agent Testing Guide

## Prerequisites
1. Ensure the development server is running: `npm run dev` (usually on port 3000 or 3002)
2. Make sure you have seeded the mock data in `/admin/tms-api-test`

## Testing Steps

1. **Seed the Mock Data** (if not already done):
   - Navigate to http://localhost:3002/admin/tms-api-test
   - Click the "Seed" button to populate sample data
   - You should see success messages for seeding users and subscriptions

2. **Configure the Assessment Agent**:
   - Go to http://localhost:3002/admin/agents/config
   - Find "AssessmentAgent" in the list
   - If not configured, add this system prompt:
     ```
     You are the Assessment Agent, designed to guide users through TMS assessments.
     
     You have access to:
     - Natural language command processing for answering questions
     - TMS knowledge base for answering questions about the methodology
     - Assessment workflow navigation
     
     Help users complete their assessments efficiently while providing guidance and answering any questions they have about the process or content.
     ```
   - Save the configuration

3. **Test the Assessment Interface**:
   - From the agents config page, click "Test in Chat" next to AssessmentAgent
   - OR navigate directly to: http://localhost:3002/chat/assessment?agent=AssessmentAgent&new=true
   
4. **What to Test**:
   - The interface should load with a collapsible chat on the left
   - Available assessments should be displayed (TMP, QO2, Team Signals)
   - Select an assessment to start
   - Test natural language commands in the chat:
     - "answer 2-1 for question 1"
     - "set answer for the first question to 2-0"
     - "help me understand this question"
     - "what does 2-1 mean?"
   - Navigate through pages using the "Next Section" button
   - Check that answers are saved between pages
   - Complete the assessment to trigger report generation

5. **Expected Behavior**:
   - Chat interface provides contextual help
   - Natural language commands update the assessment form
   - Navigation tracks progress through hierarchical workflow
   - Completion triggers report generation
   - Chat maintains conversation history

## Troubleshooting

- If you see "AssessmentAgent not configured", follow step 2
- If assessments don't load, check the browser console and ensure mock data is seeded
- If the server is not responding, ensure it's running on port 3002

## Architecture Notes

The assessment agent uses:
- Hierarchical URL routing: `/api/mock-tms/workflow/process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}`
- Workflow update chaining: Updates automatically fetch the next page
- Natural language processing tools for command interpretation
- Integration with TMS knowledge base for contextual help