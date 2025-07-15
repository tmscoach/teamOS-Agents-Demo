# Knowledge Base Toggle Feature

## Overview

The Knowledge Base Toggle feature allows administrators to enable or disable access to the TMS knowledge base for individual agents through the admin interface. This provides fine-grained control over which agents can access the 40+ years of TMS intellectual property.

## Implementation Details

### Database Schema

Added a `knowledgeConfig` JSON field to the `AgentConfiguration` model:
```prisma
model AgentConfiguration {
  // ... existing fields
  knowledgeConfig Json?    // Stores { enabled: boolean, tools?: string[] }
}
```

### Admin UI

Added a new "Knowledge Base" tab in the agent configuration page (`/admin/agents/config`):
- Toggle switch to enable/disable knowledge base access
- Visual display of available knowledge tools when enabled
- Automatically saves configuration when toggled

### Agent Integration

The `OnboardingAgent` (and other agents extending `KnowledgeEnabledAgent`) now:
1. Check the `knowledgeConfig` during initialization
2. Conditionally load knowledge base tools based on the configuration
3. Update system prompts to exclude knowledge base instructions when disabled

### Service Methods

New methods in `AgentConfigurationService`:
- `updateKnowledgeConfig()` - Update knowledge configuration for an agent
- `isKnowledgeEnabled()` - Check if knowledge base is enabled for an agent

## Usage

### Via Admin UI

1. Navigate to `/admin/agents/config`
2. Select the agent (e.g., "Onboarding Agent")
3. Click on the "Knowledge Base" tab
4. Toggle the "Enable Knowledge Base" switch
5. Click "Save Configuration"

### Via API

```typescript
// Enable knowledge base
await AgentConfigurationService.updateKnowledgeConfig(
  'OnboardingAgent',
  { enabled: true },
  userId
);

// Disable knowledge base
await AgentConfigurationService.updateKnowledgeConfig(
  'OnboardingAgent',
  { enabled: false },
  userId
);

// Check if enabled
const isEnabled = await AgentConfigurationService.isKnowledgeEnabled('OnboardingAgent');
```

## Available Knowledge Tools

When enabled, agents have access to these knowledge base tools:
- `search_tms_knowledge` - Search across all TMS documents
- `get_assessment_methodology` - Retrieve specific assessment methodologies
- `get_questionnaire_items` - Access questionnaire items and scoring
- `search_intervention_strategies` - Find team intervention strategies
- `get_benchmark_data` - Access benchmark data and research findings

## Benefits

1. **Performance Testing** - Easily compare agent performance with and without knowledge base
2. **Cost Control** - Disable knowledge base to reduce LLM token usage
3. **Staged Rollout** - Enable knowledge base for specific agents as needed
4. **Debugging** - Isolate issues by toggling knowledge access

## Technical Notes

- Configuration changes take effect for new conversations only
- Existing conversations continue with their initial configuration
- Knowledge tools are removed from the agent's tool array when disabled
- System prompts are updated to exclude knowledge base instructions when disabled