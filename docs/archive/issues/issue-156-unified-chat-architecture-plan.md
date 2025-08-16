# Issue 156: Unified Chat Architecture Implementation Plan

**Issue Link**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/156

## Executive Summary

This plan outlines the implementation of a unified chat architecture with a plugin system to support 10+ agents without code duplication. The solution will consolidate 4 separate chat implementations into 1 extensible system with plugins for specialized features.

## Current State Analysis

### Existing Chat Implementations (4 separate systems)
1. **ChatClient.tsx** - Standard chat using `/api/agents/chat-simple`
2. **ChatClientStreaming.tsx** - Streaming chat using `/api/agents/chat-streaming`
3. **AssessmentChatClient.tsx** - Assessment-specific using AI SDK and `/api/chat/assessment`
4. **DebriefChatClient.tsx** - Debrief-specific using AI SDK and `/api/chat/debrief`
5. **EmbeddedChat.tsx** - Dashboard widget using `/api/agents/chat-streaming`

### API Routing Patterns (3 different approaches)
1. **Custom Agent Router** - Used by chat-simple and chat-streaming
2. **AI SDK Direct** - Used by assessment and debrief
3. **Mixed Approach** - Streaming with AI SDK conversion

### Key Problems
- 80% code duplication across chat implementations
- Each new agent requires new chat implementation (3-5 days)
- Inconsistent UX and API patterns
- No cross-agent action execution
- Specialized features (voice, workflows) tightly coupled

## Proposed Architecture

### Core Components

```typescript
// 1. Unified Chat Component
interface UnifiedChatProps {
  agentType: string;
  mode?: 'full' | 'embedded' | 'modal';
  plugins?: ChatPlugin[];
  initialContext?: AgentContext;
}

// 2. Plugin System
interface ChatPlugin {
  name: string;
  version: string;
  components?: {
    header?: React.ComponentType<PluginHeaderProps>;
    messageRenderer?: React.ComponentType<MessageRendererProps>;
    inputExtensions?: React.ComponentType<InputExtensionProps>;
    sidePanel?: React.ComponentType<SidePanelProps>;
  };
  handlers?: {
    onMessage?: (message: Message) => Promise<MessageHandlerResult>;
    onAction?: (action: Action) => Promise<ActionResult>;
    onStateChange?: (state: ChatState) => void;
  };
  tools?: PluginTool[];
  styles?: PluginStyles;
}

// 3. Unified Agent Service
class UnifiedAgentService {
  private router: SmartRouter;
  private actionExecutor: ActionExecutor;
  private pluginManager: PluginManager;
  
  async processMessage(message: string, context: ChatContext): Promise<ProcessedMessage> {
    // 1. Check for direct actions
    const action = await this.actionExecutor.detectAction(message);
    if (action) {
      return this.executeAction(action, context);
    }
    
    // 2. Route to appropriate agent
    const route = await this.router.route(message, context);
    
    // 3. Process with agent + plugins
    return this.processWithAgent(route.agent, message, context);
  }
}
```

## Implementation Plan

### Phase 1: Foundation (Weeks 1-4)

#### Week 1-2: Unified Chat Component
1. **Create Core Components**
   - `UnifiedChat.tsx` - Main chat component
   - `UnifiedChatProvider.tsx` - Context provider for chat state
   - `MessageRenderer.tsx` - Pluggable message rendering
   - `InputArea.tsx` - Pluggable input extensions

2. **Base Features**
   - Message history management
   - Streaming support
   - Error handling
   - Loading states
   - Keyboard shortcuts

3. **Migration Compatibility**
   - Adapter for existing chat props
   - Backwards compatible API

#### Week 3: Plugin System
1. **Plugin Infrastructure**
   - `PluginManager` - Plugin lifecycle management
   - `PluginRegistry` - Plugin registration and discovery
   - `PluginContext` - Plugin isolation and communication
   - `PluginComposer` - UI composition

2. **Plugin API**
   - Component injection points
   - Event subscription system
   - State management hooks
   - Tool registration

3. **Core Plugins**
   - `BasePlugin` - Default chat functionality
   - `StreamingPlugin` - Streaming message support
   - `ErrorHandlingPlugin` - Unified error handling

#### Week 4: Unified API Layer
1. **New API Endpoint**
   - `/api/agents/unified` - Single endpoint for all chat interactions
   - Mode-aware routing (standard, assessment, debrief)
   - Unified request/response format
   - Backwards compatible adapters

2. **Agent Service Unification**
   - `UnifiedAgentService` - Central agent management
   - `ActionExecutor` - Cross-agent action execution
   - `SmartRouter` - Intelligent agent routing
   - Tool format standardization

### Phase 2: Core Plugins (Weeks 5-8)

#### Week 5-6: Assessment Plugin
```typescript
const AssessmentPlugin: ChatPlugin = {
  name: 'assessment',
  version: '1.0.0',
  components: {
    messageRenderer: AssessmentQuestionRenderer,
    sidePanel: AssessmentProgressPanel,
    inputExtensions: VoiceInputExtension
  },
  handlers: {
    onMessage: handleAssessmentMessage,
    onStateChange: updateAssessmentWorkflow
  },
  tools: [
    answersUpdateTool,
    saveAssessmentTool,
    navigateQuestionTool
  ]
};
```

**Features to Migrate**:
- Workflow state management
- Question rendering
- Answer tracking
- Voice navigation
- Bulk answer commands

#### Week 7: Voice Plugin (Reusable)
```typescript
const VoicePlugin: ChatPlugin = {
  name: 'voice',
  version: '1.0.0',
  components: {
    inputExtensions: VoiceToggle,
    header: VoiceIndicator
  },
  handlers: {
    onVoiceCommand: processVoiceCommand,
    onTranscript: updateTranscript
  }
};
```

**Features**:
- Voice toggle UI
- Real-time transcription
- Command processing
- Audio feedback
- Permission management

#### Week 8: Debrief Plugin
```typescript
const DebriefPlugin: ChatPlugin = {
  name: 'debrief',
  version: '1.0.0',
  components: {
    messageRenderer: ReportMessageRenderer,
    sidePanel: ReportNavigator
  },
  tools: [
    reportSearchTool,
    imageAnalysisTool,
    reportStorageTool
  ]
};
```

**Features to Migrate**:
- Report rendering
- Image display
- Section navigation
- Knowledge base search

### Phase 3: Migration & New Agents (Weeks 9-12)

#### Week 9: Migration Strategy
1. **Feature Flags**
   ```typescript
   const FEATURE_FLAGS = {
     USE_UNIFIED_CHAT: process.env.NEXT_PUBLIC_USE_UNIFIED_CHAT === 'true',
     UNIFIED_CHAT_PAGES: ['chat', 'dashboard'], // Gradual rollout
   };
   ```

2. **Migration Steps**
   - Deploy unified chat alongside existing
   - A/B test with subset of users
   - Monitor performance and errors
   - Gradual page-by-page migration

3. **Data Migration**
   - Conversation compatibility
   - Message format standardization
   - Context preservation

#### Week 10: Page Migrations
1. **Standard Chat Pages**
   - `/chat` - Main chat page
   - `/chat/assessment` - Assessment page
   - `/chat/debrief` - Debrief page

2. **Embedded Instances**
   - Dashboard embedded chat
   - Modal chat instances

3. **Testing**
   - E2E tests for each migration
   - Performance benchmarks
   - User acceptance testing

#### Week 11: New Agent Templates
1. **CLI Tool for Agent Creation**
   ```bash
   npm run create-agent -- --name DiscoveryAgent --plugins base,voice
   ```

2. **Example New Agents**
   - **DiscoveryAgent** - Simple chat-based
   - **RecognitionAgent** - With custom UI plugin
   - **TeamHealthAgent** - With analytics plugin

3. **Documentation**
   - Agent creation guide
   - Plugin development guide
   - Best practices

#### Week 12: Polish & Optimization
1. **Performance**
   - Code splitting for plugins
   - Lazy loading
   - Bundle optimization
   - Memory leak prevention

2. **Testing**
   - Load testing
   - Cross-browser testing
   - Accessibility testing
   - Security audit

3. **Documentation**
   - Architecture overview
   - Migration guide
   - API documentation
   - Troubleshooting guide

## Technical Details

### Action Execution System
```typescript
class ActionExecutor {
  private actions = new Map<string, ActionHandler>();
  
  registerAction(pattern: string, handler: ActionHandler) {
    this.actions.set(pattern, handler);
  }
  
  async detectAction(message: string): Promise<Action | null> {
    // 1. Quick pattern matching
    for (const [pattern, handler] of this.actions) {
      const match = message.match(new RegExp(pattern, 'i'));
      if (match) {
        return { type: 'pattern', handler, params: match };
      }
    }
    
    // 2. LLM-based detection for complex cases
    if (this.shouldUseLLM(message)) {
      return this.detectWithLLM(message);
    }
    
    return null;
  }
}

// Example registrations
actionExecutor.registerAction(
  'start (tmp|team signals|qo2|wow|llp)',
  async (params) => ({
    type: 'redirect',
    url: `/chat/assessment?type=${params[1]}&autoStart=true`
  })
);
```

### Smart Routing
```typescript
class SmartRouter {
  async route(message: string, context: ChatContext): Promise<RouteResult> {
    // 1. Check current agent capabilities
    if (context.currentAgent && await this.canHandleMessage(context.currentAgent, message)) {
      return { agent: context.currentAgent, confidence: 0.9 };
    }
    
    // 2. Quick pattern matching for obvious routes
    const quickRoute = this.quickMatcher.match(message);
    if (quickRoute.confidence > 0.85) {
      return quickRoute;
    }
    
    // 3. LLM routing for complex cases
    return this.llmRouter.route(message, context);
  }
}
```

### Plugin Composition
```typescript
class PluginComposer {
  composeMessageRenderer(plugins: ChatPlugin[]): React.ComponentType {
    return ({ message, context }) => {
      // Find first plugin that can render this message
      for (const plugin of plugins) {
        if (plugin.components?.messageRenderer) {
          const canRender = plugin.canRenderMessage?.(message) ?? true;
          if (canRender) {
            const Renderer = plugin.components.messageRenderer;
            return <Renderer message={message} context={context} />;
          }
        }
      }
      
      // Fall back to default renderer
      return <DefaultMessageRenderer message={message} />;
    };
  }
}
```

## Migration Checklist

### Pre-Migration
- [ ] Create feature flags
- [ ] Set up monitoring
- [ ] Document rollback procedures
- [ ] Train support team

### During Migration
- [ ] Deploy unified chat infrastructure
- [ ] Migrate one page at a time
- [ ] Monitor error rates
- [ ] Gather user feedback
- [ ] A/B test performance

### Post-Migration
- [ ] Remove old chat implementations
- [ ] Update documentation
- [ ] Optimize bundle size
- [ ] Celebrate! 🎉

## Success Metrics
- **Code Reduction**: 80% less chat-related code
- **Development Speed**: New agent in < 4 hours
- **Performance**: < 100ms overhead
- **Reliability**: Zero regression in features
- **User Satisfaction**: Consistent UX across agents

## Risk Mitigation

### Technical Risks
1. **Performance Degradation**
   - Mitigation: Lazy load plugins, optimize renders
   - Monitoring: Real-time performance metrics

2. **Plugin Conflicts**
   - Mitigation: Isolated plugin contexts
   - Testing: Plugin compatibility matrix

3. **Migration Bugs**
   - Mitigation: Feature flags, gradual rollout
   - Recovery: Quick rollback capability

### Business Risks
1. **User Disruption**
   - Mitigation: Transparent communication
   - Support: Dedicated migration support

2. **Development Delays**
   - Mitigation: Parallel development tracks
   - Contingency: Phased delivery options

## Next Steps
1. Review and approve plan
2. Set up development branch
3. Create feature flags
4. Begin Phase 1 implementation

## References
- [GitHub Issue #156](https://github.com/tmscoach/teamOS-Agents-Demo/issues/156)
- [Current Chat Implementations](../app/chat/)
- [Agent Framework](../src/lib/agents/)
- [Plugin Pattern Examples](../components/dashboard/)