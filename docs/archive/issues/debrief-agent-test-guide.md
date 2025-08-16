# Debrief Agent Testing Guide

## Overview
This guide walks through testing the Debrief Agent implementation for PR #122.

## Prerequisites
1. Ensure the dev server is running: `npm run dev`
2. Access the admin interface at: http://localhost:3000/admin

## Testing Steps

### Step 1: Seed Test Data
1. Navigate to `/admin/tms-api-test`
2. Click "Seed Mock Data" button
3. Wait for confirmation that test data has been created

### Step 2: Generate a Test Report
1. Stay on `/admin/tms-api-test`
2. Select `tms_generate_html_report` from the dropdown
3. Fill in parameters:
   - Subscription ID: `21989` (or any seeded subscription)
   - Template ID: `1`
4. Click "Execute"
5. Verify the HTML report is generated successfully

### Step 3: Test Direct Debrief API
1. Select `tms_debrief_report` from the dropdown
2. Fill in parameters:
   - Subscription ID: `21989` (same as above)
   - Query: Try these examples:
     - "What does the green section in my TMP wheel represent?"
     - "What is my major role?"
     - "Can you explain my assessment results?"
     - "What are my raw scores?"
     - "What should I do next?"
3. Click "Execute"
4. Verify the response includes:
   - A meaningful answer to your question
   - Relevant sections from the report
   - Suggested follow-up questions

### Step 4: Test in Agent Chat
1. Navigate to `/admin/agents/config`
2. Select "DebriefAgent" from the dropdown
3. Click "Test in Chat" button
4. In the chat interface, try these interactions:

#### Example 1: Direct subscription reference
```
User: I have subscription ID 21989, can you help me understand my report?
```

#### Example 2: Asking about visuals
```
User: What does my TMP wheel show?
```

#### Example 3: Asking about scores
```
User: What are my work preference scores?
```

#### Example 4: Asking for interpretation
```
User: What does my Major Role of Upholder-Maintainer mean?
```

### Expected Behavior

1. **Report Generation**: Should create an HTML report with visual elements (wheels, charts)
2. **Debrief API**: Should return contextual answers based on the actual report content
3. **Agent Chat**: Should be able to:
   - Access report data using subscription ID
   - Answer questions about visual elements
   - Explain scores and results
   - Provide actionable next steps
   - Suggest relevant follow-up questions

### Common Issues

1. **"No report context found"**: Generate the report first using `tms_generate_html_report`
2. **Access denied errors**: Make sure you're using a valid subscription ID from the seeded data
3. **OpenAI errors**: The system falls back to pattern-based responses if OpenAI is unavailable

### Test Data Reference

Seeded subscriptions include:
- `21989`: TMP assessment (Manager 1)
- `21990`: Team Signals assessment (Manager 1)
- `21991`: QO2 assessment (Team Member 1)
- `21992`: WoW Values assessment (Team Member 2)

Each has different assessment types for comprehensive testing.