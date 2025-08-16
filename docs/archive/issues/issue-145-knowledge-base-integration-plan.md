# Issue #145: Integrate TMS Knowledge Base with Assessment Agent Chat

**Issue URL**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/145
**Date**: 2025-07-30

## Problem Summary
The assessment agent chat interface currently uses hardcoded/mock responses when users ask questions about the questionnaire. The AssessmentAgent class already extends TMSEnabledAgent and KnowledgeEnabledAgent, giving it access to knowledge base tools, but these aren't being utilized in the chat interface.

## Current State Analysis

### 1. Infrastructure Already Exists
- AssessmentAgent extends TMSEnabledAgent which extends KnowledgeEnabledAgent
- Knowledge base tools are defined in `/src/lib/knowledge-base/tools/agent-tools.ts`
- The agent has `knowledgeEnabled: true` and `tmsToolsEnabled: true`
- Knowledge base was implemented in PR #38 and is working for other agents

### 2. Available Knowledge Base Tools
- `search_tms_knowledge` - Search using natural language queries
- `get_assessment_methodology` - Retrieve specific assessment methodology details  
- `get_questionnaire_items` - Retrieve questionnaire items with scoring info
- `search_intervention_strategies` - Find team intervention strategies
- `get_benchmark_data` - Get benchmark data and research findings

### 3. Current Implementation Issues
- Assessment route creates inline tools but doesn't include agent's inherited tools
- The agent is created but `initialize()` is never called to load TMS tools
- The hardcoded `explain_question` tool doesn't use knowledge base
- Tools are not converted from AgentTool format to AI SDK format

### 4. Pattern from Debrief Agent
The debrief agent successfully uses knowledge base tools by:
1. Creating the agent and calling `await agent.initialize()`
2. Getting agent tools from `agent.tools`
3. Converting AgentTool format to AI SDK format using the `tool()` function
4. Passing converted tools to `streamText()`

## Implementation Plan

### Step 1: Initialize the Assessment Agent
- After creating the agent with `createAssessmentAgent()`, the function already calls `await agent.initialize()`
- This loads the TMS tools based on configuration

### Step 2: Get and Convert Agent Tools
- Get tools from `agent.tools` after initialization
- Convert from AgentTool format to AI SDK tool format
- Follow the same conversion pattern as debrief agent

### Step 3: Merge with Assessment-Specific Tools
- Keep the assessment-specific tools (answer_question, navigate_page)
- Remove or enhance the explain_question tool to use knowledge base
- Merge all tools together for streamText

### Step 4: Update System Instructions
- Add instructions about using knowledge base for explanations
- Encourage citing sources when using knowledge base
- Add natural language understanding for tool usage

### Step 5: Handle Tool Results
- Ensure proper error handling if knowledge base queries fail
- Format responses appropriately for the chat interface

## Implementation Details

### Files to Modify:
1. `/app/api/chat/assessment/route.ts` - Main changes here
   - Get agent tools after initialization
   - Convert tools to AI SDK format
   - Merge with assessment-specific tools
   - Update system instructions

### Code Changes Overview:

1. **Get Agent Tools** (after line 132):
```typescript
// Get agent's tools after initialization
const agentTools = agent.tools || [];
```

2. **Convert Tools** (before streamText):
```typescript
// Convert agent tools to AI SDK format
if (agentTools.length > 0) {
  for (const agentTool of agentTools) {
    // Skip if already defined
    if (tools[agentTool.name]) continue;
    
    // Convert using the same pattern as debrief
    tools[agentTool.name] = tool({
      description: agentTool.description,
      parameters: createZodSchema(agentTool.parameters),
      execute: agentTool.execute
    });
  }
}
```

3. **Update System Instructions** (enhance existing):
```typescript
systemMessage += `

You have access to TMS knowledge base tools. When users ask about:
- What a question measures or means
- The methodology behind assessments
- Why certain questions are asked
- The theory or research behind TMS

Use the knowledge base tools to provide accurate, cited information.
Always cite your sources (e.g., "According to the TMP Handbook...").
`
```

### Testing Plan

1. **Manual Testing**:
   - Ask "What does question 34 measure?"
   - Ask "Explain the TMP methodology"
   - Ask "Why do you ask about persuade vs sell?"
   - Verify knowledge base is searched and sources are cited

2. **Automated Tests**:
   - Update existing assessment tests if needed
   - Ensure tool conversion works correctly

3. **Integration Testing**:
   - Verify existing functionality still works (answering questions, navigation)
   - Test error handling when knowledge base is unavailable
   - Check that responses are properly formatted

## Success Criteria

1. ✅ Assessment agent can explain questions using actual TMS knowledge base content
2. ✅ Agent cites sources when providing explanations  
3. ✅ Existing assessment functionality (answering questions, navigation) still works
4. ✅ Agent can answer general questions about TMS methodology
5. ✅ Proper error handling if knowledge base queries fail

## Risks & Mitigations

- **Risk**: Tool conversion might fail for complex schemas
  - **Mitigation**: Use simplified conversion like debrief agent, test thoroughly

- **Risk**: Knowledge base queries might slow down responses
  - **Mitigation**: Knowledge base already optimized with vector search, monitor performance

- **Risk**: Breaking existing assessment functionality
  - **Mitigation**: Keep assessment-specific tools separate, test thoroughly