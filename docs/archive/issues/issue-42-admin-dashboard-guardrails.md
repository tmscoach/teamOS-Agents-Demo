# Issue #42: Enhanced Admin Dashboard with Guardrail Monitoring

GitHub Issue: https://github.com/tmscoach/teamOS-Agents-Demo/issues/42

## Overview
Enhance the admin dashboard to provide comprehensive monitoring of agent interactions, guardrail violations, and variable extraction success rates. Additionally, implement dynamic agent configuration capabilities.

## Analysis of Existing Code

### Current Structure
1. **Admin Dashboard**: Basic structure exists at `/app/admin/`
2. **Guardrails**: Already implemented in `/src/lib/agents/guardrails/onboarding-guardrails.ts`
3. **Types**: Agent types defined in `/src/lib/agents/types/index.ts`
4. **Reference Implementation**: Available at `../openai-cs-agents-demo`

### Key Components to Build
1. Guardrail violation tracking and storage
2. Variable extraction analytics
3. Admin dashboard UI enhancements
4. Dynamic agent configuration system
5. Performance metrics tracking

## Implementation Plan

### Phase 1: Database Schema Updates
1. Create Prisma schema migrations for:
   - GuardrailCheck table
   - VariableExtraction table
   - AgentConfiguration table
2. Update conversation model to include relationships

### Phase 2: Backend Infrastructure
1. Implement guardrail tracking service
   - Create API route `/api/admin/guardrails`
   - Track all guardrail checks (pass/fail)
   - Store violation severity and reasoning
2. Implement variable extraction tracking
   - Create API route `/api/admin/variables`
   - Track extraction attempts and success rates
   - Store confidence scores
3. Create agent configuration API
   - Create API route `/api/admin/agents/config`
   - Enable dynamic prompt updates
   - Version control for configurations

### Phase 3: Frontend Dashboard
1. Create guardrail monitoring page
   - Real-time violation display
   - Severity filtering
   - Pattern analysis
2. Create variable extraction analytics page
   - Success rate charts
   - Field-by-field breakdown
   - Drill-down capabilities
3. Create agent configuration interface
   - Prompt editor with syntax highlighting
   - A/B testing setup
   - Version history and rollback

### Phase 4: Real-time Updates
1. Implement WebSocket connections for real-time data
2. Add push notifications for high-severity violations
3. Create live dashboard updates

### Phase 5: Testing & Documentation
1. Write comprehensive tests for all new features
2. Update API documentation
3. Create admin user guide

## Technical Decisions

### State Management
- Use React Query for data fetching and caching
- Implement WebSocket provider for real-time updates

### UI Components
- Leverage existing Shadcn UI components
- Create reusable analytics components
- Use Recharts for data visualization

### Security
- Implement role-based access control
- Audit logging for configuration changes
- Secure WebSocket connections

## Files to Create/Modify

### New Files
- `/prisma/migrations/[timestamp]_add_guardrail_tracking.sql`
- `/app/api/admin/guardrails/route.ts`
- `/app/api/admin/guardrails/stats/route.ts`
- `/app/api/admin/variables/route.ts`
- `/app/api/admin/variables/stats/route.ts`
- `/app/api/admin/agents/config/route.ts`
- `/app/admin/guardrails/page.tsx`
- `/app/admin/variables/page.tsx`
- `/app/admin/agents/config/page.tsx`
- `/src/lib/services/guardrail-tracking.ts`
- `/src/lib/services/variable-extraction.ts`
- `/src/lib/services/agent-configuration.ts`
- `/components/admin/guardrail-monitor.tsx`
- `/components/admin/variable-analytics.tsx`
- `/components/admin/agent-config-editor.tsx`

### Modified Files
- `/prisma/schema.prisma`
- `/src/lib/agents/base.ts` (add tracking hooks)
- `/components/admin/sidebar.tsx` (add new navigation items)
- `/app/admin/layout.tsx` (add WebSocket provider)

## Next Steps
1. Create feature branch
2. Start with database schema updates
3. Implement backend services incrementally
4. Build frontend components
5. Add comprehensive testing
6. Deploy and monitor