# Recommended Flow Architecture for TeamOS Agents

## Overview

A hybrid approach that uses JSON configuration to define flows, with a runtime engine that interprets these configurations - similar to how LangGraph works but admin-configurable.

## Architecture Components

### 1. Enhanced Flow Configuration Schema

```typescript
interface FlowConfiguration {
  id: string;
  name: string;
  version: number;
  
  // Define all possible states
  states: {
    [stateId: string]: {
      name: string;
      description: string;
      systemPromptOverride?: string; // Optional state-specific prompt
      
      // What data to collect in this state
      dataRequirements: {
        required: string[];
        optional: string[];
      };
      
      // Tools available in this state
      availableTools?: string[];
      
      // Exit conditions
      exitConditions: Array<{
        id: string;
        type: 'data_complete' | 'time_elapsed' | 'user_intent' | 'custom';
        config: any; // Type-specific configuration
      }>;
      
      // Max time in state (minutes)
      maxDuration?: number;
    };
  };
  
  // Define transitions between states
  transitions: Array<{
    id: string;
    from: string; // state ID
    to: string; // state ID
    
    // Condition that triggers this transition
    condition: {
      type: 'all' | 'any' | 'custom';
      rules: Array<{
        type: 'data_exists' | 'data_equals' | 'data_matches' | 'custom';
        field?: string;
        value?: any;
        expression?: string; // For custom conditions
      }>;
    };
    
    // Priority when multiple transitions are valid
    priority: number;
  }>;
  
  // Global settings
  settings: {
    initialState: string;
    finalStates: string[]; // States that end the flow
    defaultTransitionDelay?: number; // ms
    maxTotalDuration?: number; // minutes
    abandonmentBehavior?: 'save_progress' | 'reset' | 'handoff';
  };
}
```

### 2. Flow Engine Implementation

```typescript
class ConfigurableFlowEngine {
  private currentState: string;
  private collectedData: Record<string, any> = {};
  private stateHistory: Array<{state: string, timestamp: Date}> = [];
  
  constructor(
    private config: FlowConfiguration,
    private agent: BaseAgent
  ) {
    this.currentState = config.settings.initialState;
  }
  
  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    const stateConfig = this.config.states[this.currentState];
    
    // 1. Apply state-specific prompt if available
    const effectivePrompt = stateConfig.systemPromptOverride || 
                          this.agent.getSystemPrompt();
    
    // 2. Process message with current state context
    const response = await this.agent.processWithPrompt(
      message, 
      effectivePrompt,
      {
        ...context,
        currentState: this.currentState,
        stateConfig,
        collectedData: this.collectedData
      }
    );
    
    // 3. Extract data based on state requirements
    await this.extractRequiredData(response, stateConfig);
    
    // 4. Check exit conditions
    const shouldTransition = await this.checkExitConditions(stateConfig);
    
    // 5. Handle state transition if needed
    if (shouldTransition) {
      await this.handleStateTransition();
    }
    
    return response;
  }
  
  private async handleStateTransition() {
    // Evaluate all possible transitions from current state
    const validTransitions = this.config.transitions
      .filter(t => t.from === this.currentState)
      .filter(t => this.evaluateCondition(t.condition))
      .sort((a, b) => b.priority - a.priority);
    
    if (validTransitions.length > 0) {
      const nextState = validTransitions[0].to;
      this.transitionTo(nextState);
    }
  }
}
```

### 3. Admin UI Enhancements

#### Visual Flow Editor
```typescript
// Component for visual flow editing
const FlowEditor: React.FC = () => {
  return (
    <div className="flow-editor">
      {/* Node-based visual editor */}
      <ReactFlow
        nodes={flowToNodes(flowConfig)}
        edges={flowToEdges(flowConfig)}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
      >
        <Controls />
        <Background />
      </ReactFlow>
      
      {/* JSON editor as fallback */}
      <JsonEditor
        value={flowConfig}
        onChange={handleJsonChange}
        schema={flowConfigSchema}
      />
    </div>
  );
};
```

#### Testing Interface
```typescript
const FlowTester: React.FC = () => {
  return (
    <div className="flow-tester">
      {/* Simulate conversations */}
      <ConversationSimulator
        flowConfig={flowConfig}
        onStateChange={handleStateChange}
      />
      
      {/* Visual state tracker */}
      <StateVisualizer
        currentState={currentState}
        stateHistory={stateHistory}
        collectedData={collectedData}
      />
    </div>
  );
};
```

### 4. Integration with Existing System

```typescript
// Update OnboardingAgent to use configurable flow
export class OnboardingAgent extends KnowledgeEnabledAgent {
  private flowEngine: ConfigurableFlowEngine;
  
  async initialize() {
    // Load flow configuration from database
    const flowConfig = await this.loadFlowConfiguration();
    this.flowEngine = new ConfigurableFlowEngine(flowConfig, this);
  }
  
  async processMessage(
    message: Message, 
    context: AgentContext
  ): Promise<AgentResponse> {
    // Delegate to flow engine
    return this.flowEngine.processMessage(message.content, context);
  }
}
```

## Benefits of This Approach

1. **Full Admin Control**: Flows can be modified without code changes
2. **Visual Editing**: Non-technical admins can design flows
3. **Version Control**: Built-in versioning for configurations
4. **Testing**: Can test flows before deploying
5. **Flexibility**: Supports complex branching logic
6. **LangGraph-like Power**: State machines, conditions, and transitions
7. **Maintainability**: Clear separation of flow logic and agent behavior

## Migration Path

### Phase 1: Basic Implementation (2-3 weeks)
- Implement ConfigurableFlowEngine
- Migrate existing OnboardingStateMachine to JSON config
- Basic JSON editor in admin UI

### Phase 2: Visual Editor (3-4 weeks)
- Add visual flow editor using React Flow
- Implement drag-and-drop state creation
- Add connection/transition editor

### Phase 3: Advanced Features (4-6 weeks)
- Conversation simulator
- A/B testing support
- Analytics integration
- Template library

## Example: Onboarding Flow in JSON

```json
{
  "id": "onboarding-flow-v1",
  "name": "Manager Onboarding Flow",
  "version": 1,
  "states": {
    "greeting": {
      "name": "Welcome & Introduction",
      "description": "Welcome the manager and introduce TeamOS",
      "dataRequirements": {
        "required": ["manager_name"],
        "optional": ["company_name", "initial_concern"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": {
          "fields": ["manager_name"]
        }
      }],
      "maxDuration": 5
    },
    "team_context": {
      "name": "Team Context",
      "description": "Gather information about the team",
      "dataRequirements": {
        "required": ["team_size", "team_tenure", "primary_challenge"],
        "optional": ["team_structure", "recent_changes"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": {
          "fields": ["team_size", "team_tenure", "primary_challenge"]
        }
      }],
      "maxDuration": 10
    },
    "goals": {
      "name": "Goals Setting",
      "description": "Define transformation goals",
      "dataRequirements": {
        "required": ["success_metrics", "timeline_preference"],
        "optional": ["budget_range", "specific_outcomes"]
      },
      "exitConditions": [{
        "type": "data_complete",
        "config": {
          "fields": ["success_metrics", "timeline_preference"]
        }
      }],
      "maxDuration": 10
    }
  },
  "transitions": [
    {
      "id": "greeting-to-context",
      "from": "greeting",
      "to": "team_context",
      "condition": {
        "type": "all",
        "rules": [{
          "type": "data_exists",
          "field": "manager_name"
        }]
      },
      "priority": 10
    },
    {
      "id": "context-to-goals",
      "from": "team_context",
      "to": "goals",
      "condition": {
        "type": "all",
        "rules": [
          { "type": "data_exists", "field": "team_size" },
          { "type": "data_exists", "field": "team_tenure" },
          { "type": "data_exists", "field": "primary_challenge" }
        ]
      },
      "priority": 10
    }
  ],
  "settings": {
    "initialState": "greeting",
    "finalStates": ["goals"],
    "maxTotalDuration": 30,
    "abandonmentBehavior": "save_progress"
  }
}
```

## Comparison with Pure LangGraph

| Feature | LangGraph | Our Approach |
|---------|-----------|--------------|
| Configuration | Python/TS code | JSON in database |
| Runtime Modification | Requires deployment | Instant through admin UI |
| Visual Editing | No | Yes (with React Flow) |
| Non-developer Friendly | No | Yes |
| Complex Logic Support | Yes | Yes (via conditions) |
| Version Control | Git | Database versioning |
| Testing | Unit tests | Visual simulator |

## Conclusion

This architecture provides the power of LangGraph-style state machines and flow control while maintaining the flexibility of admin-configurable systems. It's the best of both worlds for TeamOS's needs.