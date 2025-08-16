# Testing the Improved Onboarding Agent

## Overview
This guide shows how to test if the onboarding agent properly stays on topic and collects required information.

## Test Scenarios

### 1. Off-Topic Test (Should Redirect)
```
User: "Who is Michael Jackson?"
Expected: Agent redirects to team questions

User: "What's the weather like?"
Expected: Agent redirects to team questions

User: "Can you write Python code?"
Expected: Agent redirects to team questions
```

### 2. Proper Flow Test (Should Progress)
```
User: "Hi, I need help with my team"
Expected: Agent welcomes and asks for name/organization

User: "I'm Sarah from Microsoft"
Expected: Agent acknowledges and asks about team size

User: "I manage 12 engineers"
Expected: Agent asks about challenges

User: "We struggle with communication and missed deadlines"
Expected: Agent digs deeper into challenges

User: "We need better collaboration tools and clearer processes"
Expected: Agent asks about goals/success metrics

User: "Success would be 30% fewer missed deadlines in 6 months"
Expected: Agent asks about timeline and resources

User: "We'd like to start next month, budget is around $50k"
Expected: Agent asks about commitment level

User: "I'm fully committed and have leadership support"
Expected: Agent summarizes and prepares handoff
```

### 3. Resistance Test (Should Persist)
```
User: "I don't want to share that"
Expected: Agent explains why info is needed

User: "ok" (too short)
Expected: Agent asks for more detail

User: "This is stupid"
Expected: Agent acknowledges frustration but redirects
```

## Key Improvements Made

1. **Stronger Topic Guardrail**: Now catches general off-topic questions like celebrities, weather, etc.
2. **Directive System Prompt**: Agent has clear instructions to stay focused and redirect
3. **Progress Tracking**: Agent actively moves through required fields
4. **Better Error Messages**: Clearer guidance when users go off-topic

## Required Information Checklist
- [ ] Manager name
- [ ] Organization/Company  
- [ ] Team size
- [ ] Team tenure
- [ ] Primary challenge
- [ ] Success metrics
- [ ] Timeline preference
- [ ] Budget range
- [ ] Leader commitment

## Testing in Browser
1. Navigate to http://localhost:3000/chat
2. Start a new conversation
3. Try the test scenarios above
4. Verify the agent redirects off-topic questions
5. Verify the agent collects all required fields

## Expected Behavior
- Agent should NEVER answer general knowledge questions
- Agent should ALWAYS redirect to team topics
- Agent should systematically collect all 9 required fields
- Agent should complete onboarding in 5-10 minutes