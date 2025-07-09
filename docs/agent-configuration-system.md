# Agent Configuration System

## Overview

The agent configuration system allows administrators to customize agent behavior through a web interface. The system has been simplified to use a single comprehensive system prompt per agent instead of multiple state-specific prompts.

## Architecture

### Components

1. **Admin UI** (`/app/admin/agents/config`)
   - Agent selector showing all 9 agents
   - Tabs for System Prompt, Flow Configuration, Extraction Rules, Test Playground, and Version History
   - Real-time metrics showing configuration status
   - Save/rollback functionality

2. **Configuration Service** (`/src/lib/services/agent-configuration.ts`)
   - Manages database operations for agent configurations
   - Supports versioning with automatic version incrementing
   - Handles rollback to previous versions

3. **Configuration Loader** (`/src/lib/agents/config/agent-config-loader.ts`)
   - Loads configurations with 5-minute caching
   - Provides fallback to default configurations
   - Manages cache invalidation on updates

4. **Default Configurations** (`/src/lib/agents/config/simplified-agent-configs.ts`)
   - Comprehensive default prompts for all 9 agents
   - Flow configurations defining conversation states
   - Extraction rules for capturing information

### Data Model

```typescript
interface AgentConfiguration {
  id: string;
  agentName: string;
  version: number;
  prompts: Record<string, string>; // { system: "..." }
  flowConfig: Record<string, any>;
  extractionRules: Record<string, any>;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## How It Works

1. **Configuration Loading**
   - Agents load their configuration on initialization
   - Configuration is cached for 5 minutes to improve performance
   - If no configuration exists, defaults are used

2. **System Prompt Usage**
   - The system prompt is stored as `prompts.system` in the database
   - Agents use this prompt to define their behavior
   - Prompts can reference flow states and extraction rules

3. **Updates and Caching**
   - When configuration is updated via the admin UI, cache is cleared
   - New conversations immediately use the updated configuration
   - Existing conversations continue with their current configuration

## Agent Types

1. **OrchestratorAgent** - Coordinates multi-agent workflows
2. **OnboardingAgent** - First contact, gathers initial information
3. **DiscoveryAgent** - Deep analysis of team challenges
4. **AssessmentAgent** - Conducts formal team assessments
5. **AlignmentAgent** - Helps teams align on goals and strategies
6. **LearningAgent** - Delivers training and development
7. **NudgeAgent** - Provides ongoing behavioral nudges
8. **ProgressMonitor** - Tracks transformation progress
9. **RecognitionAgent** - Manages team recognition and rewards

## Testing

Test scripts are available in `/scripts`:
- `test-agent-config.ts` - Tests configuration CRUD operations
- `test-config-direct.ts` - Tests direct configuration loading
- `test-onboarding-agent-prompt.ts` - Tests prompt usage in agents

## Future Enhancements

1. A/B testing of different configurations
2. Analytics on configuration effectiveness
3. Template library for common scenarios
4. Configuration import/export functionality