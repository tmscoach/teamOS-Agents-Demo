# Issue #114: TMS Tool Integration Implementation Plan

**GitHub Issue**: https://github.com/tmscoach/teamOS-Agents-Demo/issues/114

## Overview

Implement TMS tool integration system allowing agents to interact with TMS Global through mock APIs. Each agent will have access only to specific tools to prevent confusion while providing necessary functionality.

## Key Requirements

1. **Authentication**: Clerk remains master; TMS JWT for API calls only
2. **Agent-specific tools**: Based on provided tool mappings
3. **Mock implementation first**: Easy switch to real API later
4. **No breaking changes**: Preserve existing chat/LLM infrastructure
5. **Admin interface**: Visual tool assignment per agent

## Architecture Analysis

### Current State
- **Tool Structure**: Tools follow AgentTool interface with execute() method
- **Data Query Tools**: Already implemented in `/src/lib/agents/tools/data-query-tools.ts`
- **Agent Config**: Stored in database with JSON fields, managed via admin UI
- **Tool Loading**: Currently hardcoded in agent implementations

### Integration Points
- **Auth Flow**: Clerk user → TMS JWT → API calls
- **Tool Registry**: Central registry for all TMS tools
- **Dynamic Loading**: Tools loaded based on agent configuration
- **Mock Service**: In-memory storage with real API structure

## Implementation Phases

### Phase 1: Database & Core Infrastructure
1. **Update Prisma Schema**
   - Add `toolsConfig` field to AgentConfiguration
   - Create TMSAuthToken model for JWT storage
   - Run migrations

2. **Create TMS Types**
   - API request/response types
   - Tool metadata interfaces
   - JWT token structure

### Phase 2: Mock TMS API Service
1. **Base Infrastructure** (`/src/lib/mock-tms-api/`)
   - `mock-api-client.ts` - HTTP client with JWT handling
   - `mock-data-store.ts` - In-memory data storage
   - `types.ts` - TypeScript interfaces

2. **Endpoint Implementations**
   - **Auth** (`endpoints/auth.ts`)
     - POST /api/v1/auth/signup
     - POST /api/v1/auth/login
     - GET /api/v1/team-os/auth/validate
   
   - **Workflows** (`endpoints/workflows.ts`)
     - GET /Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}
     - POST /Workflow/Update
     - GET /Workflow/Start/{workflowId}/{subscriptionId}
   
   - **Questions** (`endpoints/questions.ts`)
     - POST /Question/GetActions
     - GET /Question/GetQuestionIdsThatHaveActions/{pageId}
   
   - **Subscriptions** (`endpoints/subscriptions.ts`)
     - GET /Respondent/GetDashboardSubscription
     - GET /PageContent/GetSubscriptionSummary/{subscriptionId}
     - GET /Subscription/GetTemplates/{subscriptionId}
     - GET /Subscription/GenerateReport/{subscriptionId}/{templateId}
   
   - **Reports** (`endpoints/reports.ts`)
     - POST /api/v1/reports/generate
     - GET /api/v1/reports/product-usage

3. **Mock Data**
   - Extract from TMS IP documents
   - Team Signals, TMP, QO2, WoW, LLP assessments
   - Sample teams and users

### Phase 3: Tool Registry & Factory
1. **Tool Registry** (`/src/lib/agents/tools/tms-tool-registry.ts`)
   ```typescript
   export const TMS_TOOL_REGISTRY = {
     // Onboarding tools
     tms_create_org: { ... },
     tms_facilitator_login: { ... },
     tms_check_user_permissions: { ... },
     
     // Assessment tools
     tms_get_workflow_process: { ... },
     tms_update_workflow: { ... },
     // ... etc
   };
   ```

2. **Tool Factory** (`/src/lib/agents/tools/tms-tool-factory.ts`)
   - Creates AgentTool instances from registry
   - Handles JWT token injection
   - Formats responses for natural language

3. **Auth Service** (`/src/lib/agents/tools/tms-auth-service.ts`)
   - Manages TMS JWT tokens
   - Auto-refresh on expiry
   - Store/retrieve from database

### Phase 4: Agent Integration
1. **Update Base Agent Classes**
   - Modify KnowledgeEnabledAgent to support dynamic tools
   - Add toolsConfig loading from agent configuration
   - Filter tools based on configuration

2. **Tool Loading Pattern**
   ```typescript
   async loadConfiguredTools() {
     const toolsConfig = this.config.toolsConfig || {};
     const enabledTools = Object.keys(toolsConfig)
       .filter(key => toolsConfig[key])
       .map(toolName => createTMSTool(toolName));
     
     this.tools = [...this.tools, ...enabledTools];
   }
   ```

### Phase 5: Admin Interface Enhancement
1. **Tools Tab** (`/app/admin/agents/config/components/ToolsTab.tsx`)
   - Category-based tool display
   - Checkboxes for enable/disable
   - Tool documentation viewer
   - Save/cancel with validation

2. **UI Components**
   - Tool category selector
   - Tool card with description
   - Bulk operations (enable all/none)
   - Search/filter functionality

### Phase 6: Visual API Testing Interface
1. **Test Page** (`/app/admin/tms-api-test/page.tsx`)
   - Endpoint explorer
   - Request builder
   - Response viewer
   - JWT token management

2. **Features**
   - Pre-built test scenarios
   - Mock data management
   - Response time tracking
   - Error simulation

## Task Breakdown

### Task 1: Database Setup
- [ ] Update Prisma schema
- [ ] Create migration
- [ ] Update types

### Task 2: Mock API Core
- [ ] Create base client
- [ ] Implement data store
- [ ] Add type definitions

### Task 3: Mock Endpoints - Auth
- [ ] Implement signup endpoint
- [ ] Implement login endpoint
- [ ] Implement validate endpoint
- [ ] Add JWT generation

### Task 4: Mock Endpoints - Workflows
- [ ] Implement workflow process
- [ ] Implement workflow update
- [ ] Implement workflow start
- [ ] Add mock assessment data

### Task 5: Mock Endpoints - Reports
- [ ] Implement report summary
- [ ] Implement report templates
- [ ] Implement report generation
- [ ] Add mock report data

### Task 6: Tool Registry
- [ ] Create registry structure
- [ ] Define all 14 tools
- [ ] Add metadata and docs
- [ ] Create categorization

### Task 7: Tool Factory
- [ ] Implement factory function
- [ ] Add JWT injection
- [ ] Format responses
- [ ] Error handling

### Task 8: Auth Service
- [ ] JWT storage logic
- [ ] Token refresh
- [ ] Database integration
- [ ] Error handling

### Task 9: Agent Updates
- [ ] Update base classes
- [ ] Add tool loading
- [ ] Test with agents
- [ ] Update configs

### Task 10: Admin UI - Tools Tab
- [ ] Create component
- [ ] Add to tabs
- [ ] Implement save
- [ ] Add validation

### Task 11: API Test Interface
- [ ] Create test page
- [ ] Add endpoint list
- [ ] Request builder
- [ ] Response viewer

### Task 12: Testing & Documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] Update docs
- [ ] Migration guide

## Testing Strategy

1. **Unit Tests**
   - Mock API endpoints
   - Tool execution
   - JWT management

2. **Integration Tests**
   - Agent with tools
   - Admin UI updates
   - API test interface

3. **E2E Tests**
   - Tool assignment flow
   - Agent conversations
   - Mock API responses

## Success Criteria

- ✅ All 14 TMS tools implemented
- ✅ Tools assignable per agent via admin
- ✅ Mock API matches real API structure
- ✅ Easy switch to real API
- ✅ No breaking changes to existing system
- ✅ Visual testing interface working
- ✅ JWT management automated

## Risk Mitigation

1. **Breaking Changes**: Extensive testing, feature flags
2. **Performance**: Efficient tool loading, caching
3. **Security**: Proper JWT handling, org boundaries
4. **Migration**: Clear documentation, gradual rollout