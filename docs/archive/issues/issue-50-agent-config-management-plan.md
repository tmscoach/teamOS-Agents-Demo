# Issue #50: Agent Configuration Management Interface Implementation Plan

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/50

## Overview
Implement a comprehensive agent configuration management interface that allows admins to configure all 9 agent types through a visual UI. The backend infrastructure is already complete with version control, rollback, and comparison features.

## Current State Analysis
- **Backend**: Fully implemented with `AgentConfigurationService` and API endpoints
- **Frontend**: Empty state UI at `/admin/agents/config` 
- **Agents**: Only OnboardingAgent is implemented (1/9)
- **Database**: `AgentConfiguration` model supports versioning and JSON config fields

## Implementation Plan

### Phase 1: Core UI Components (Priority 1)
1. **Configuration Editor Layout**
   - Tabbed interface for different config sections
   - Auto-save functionality with debounce
   - Loading and error states

2. **JSON Editor Component**
   - Syntax highlighting with CodeMirror or Monaco
   - Schema validation
   - Format on save
   - Undo/redo support

3. **Prompt Editor Component**
   - Multi-line text areas with template variable highlighting
   - Variable reference panel
   - Preview mode showing rendered prompts
   - State-specific prompt sections

### Phase 2: Advanced Editors (Priority 2)
4. **Visual Flow Editor**
   - Node-based state machine editor (using React Flow or similar)
   - Drag-and-drop states
   - Visual connections for transitions
   - Condition editor for transitions
   - Import/export from JSON

5. **Extraction Rules Editor**
   - Form-based field definitions
   - Validation rule builder
   - Confidence threshold settings
   - Field mapping to conversation states

6. **Version History Component**
   - Timeline view of configuration changes
   - Diff viewer for comparing versions
   - Rollback functionality
   - Version metadata (who, when, why)

### Phase 3: Testing & Validation (Priority 3)
7. **Test Playground**
   - Simulated conversation interface
   - Step through conversation states
   - View extracted variables
   - Debug mode showing state transitions

8. **Configuration Validation**
   - Validate prompts have required variables
   - Check state transitions are complete
   - Verify extraction rules match states
   - Lint for common issues

### Phase 4: Agent Implementations (Priority 4)
9. **Implement Remaining 8 Agents**
   - Orchestrator Agent: Manages overall transformation workflow
   - Discovery Agent: Team assessment and data gathering
   - Assessment Agent: Analyzes team data and generates insights
   - Alignment Agent: Facilitates goal alignment processes
   - Learning Agent: Manages learning paths and resources
   - Nudge Agent: Sends behavioral nudges and reminders
   - Progress Monitor: Tracks and reports on progress
   - Recognition Agent: Manages recognition and celebration

## Technical Architecture

### Component Structure
```
/app/admin/agents/config/
├── page.tsx (main page container)
├── components/
│   ├── agent-selector.tsx
│   ├── config-tabs.tsx
│   ├── version-history.tsx
│   └── test-playground.tsx
│
/components/admin/agent-config/
├── editors/
│   ├── json-editor.tsx
│   ├── prompt-editor.tsx
│   ├── flow-editor/
│   │   ├── index.tsx
│   │   ├── nodes.tsx
│   │   └── edges.tsx
│   └── extraction-editor.tsx
├── version/
│   ├── history-timeline.tsx
│   ├── diff-viewer.tsx
│   └── rollback-dialog.tsx
└── test/
    ├── conversation-simulator.tsx
    └── debug-panel.tsx
```

### State Management
- Use React Query for server state (configurations, versions)
- Local state for unsaved changes with auto-save
- Optimistic updates for better UX
- Conflict resolution for concurrent edits

### API Integration
- Leverage existing endpoints at `/api/admin/agents/config`
- Implement proper error handling and retry logic
- Add WebSocket support for real-time collaboration (future)

## Implementation Steps

### Step 1: Update Main Config Page
- Replace empty state with agent selector and tabs
- Add loading states and error handling
- Integrate with existing API

### Step 2: Build JSON Editor
- Integrate CodeMirror or Monaco editor
- Add JSON schema validation
- Implement auto-formatting

### Step 3: Create Prompt Editor
- Build template-aware text editor
- Add variable highlighting
- Create preview functionality

### Step 4: Implement Version History
- Create timeline component
- Build diff viewer
- Add rollback confirmation dialog

### Step 5: Visual Flow Editor
- Integrate React Flow library
- Create custom node and edge components
- Build transition condition editor

### Step 6: Extraction Rules Editor
- Design form-based editor
- Add validation rule builder
- Implement field mapping UI

### Step 7: Test Playground
- Build conversation simulator
- Add debug panel
- Create test report generator

### Step 8: Implement Remaining Agents
- Use OnboardingAgent as template
- Define states and transitions for each
- Create agent-specific prompts and rules

## Testing Strategy
1. Unit tests for each component
2. Integration tests for API interactions
3. E2E tests for complete workflows
4. Manual testing of visual editors
5. Load testing for version history

## Success Metrics
- All 9 agents are configurable through UI
- Configuration changes are versioned
- Visual flow editor works smoothly
- Non-technical users can modify agents
- UI matches existing admin dashboard design

## Dependencies
- React Flow (or similar) for visual editor
- CodeMirror/Monaco for JSON editing
- Existing API endpoints
- Current OnboardingAgent as reference

## Risks & Mitigations
- **Risk**: Complex UI might be overwhelming
  - **Mitigation**: Progressive disclosure, good defaults
- **Risk**: Performance with large configs
  - **Mitigation**: Virtualization, lazy loading
- **Risk**: Concurrent editing conflicts
  - **Mitigation**: Optimistic locking, merge strategies