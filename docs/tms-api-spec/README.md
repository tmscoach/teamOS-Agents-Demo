# TMS API Integration Documentation

This directory contains comprehensive documentation for integrating the TMS Global legacy system with the TeamOS platform.

## 📁 Documentation Structure

### API Specifications
- **[API-SPECIFICATION.md](./API-SPECIFICATION.md)** - Main API design document with architectural decisions
- **[01-authentication.json](./01-authentication.json)** - Authentication endpoints and JWT structure
- **[02-assessments.json](./02-assessments.json)** - Workflow and subscription endpoints
- **[03-reports.json](./03-reports.json)** - Report generation and retrieval endpoints
- **[04-visualizations.json](./04-visualizations.json)** - Chart and graph generation endpoints
- **[05-user-management.json](./05-user-management.json)** - User management with three roles (admin, manager, member)
- **[06-simple-analytics.json](./06-simple-analytics.json)** - Simple analytics (user major role, team distribution)

### Architecture Diagrams
- **[SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md)** - Visual system architecture with Mermaid diagrams
- **[USER-JOURNEY-FLOWS.md](./USER-JOURNEY-FLOWS.md)** - Detailed user journey and data flow diagrams
- **[AGENT-FLOW-ARCHITECTURE.md](./AGENT-FLOW-ARCHITECTURE.md)** - Agent state machine and variable extraction patterns

## 🏗️ System Overview

TeamOS integrates with multiple systems:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   TeamOS    │────▶│  TMS Global │────▶│ TMS Database│
│  (Vercel)   │     │   (Legacy)  │     │  (40+ yrs)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                         
       ├────▶ Clerk (TeamOS Auth - TMS doesn't know)
       ├────▶ Supabase (Database + Storage)     
       ├────▶ OpenAI (AI Processing)            
       └────▶ Stripe (Payments)                 
```

## 🔑 Key Design Decisions

### 1. **JSON-First API**
- Legacy system should return structured JSON instead of HTML
- Enables better AI agent integration
- Allows flexible UI rendering
- Reduces payload sizes

### 2. **Simple API Key Authentication**
- API key + secret for TeamOS application
- Generate JWT tokens for users via TMS API
- No complex SSO or identity mapping needed
- TMS doesn't need to know about Clerk

### 3. **Structured Data Models**
- Consistent field naming (camelCase)
- Semantic sections for AI processing
- Rich metadata for context

### 4. **Report Processing Pipeline**
- Structured JSON with embedded visualization data
- Pre-computed vectorChunks (no Vision API needed)
- Vector embeddings for semantic search
- Chunked storage for efficient retrieval

## 📋 MVP Implementation Checklist

For the external developer building the TMS API:

### Week 1: Simple Authentication
- [ ] Review `API-SPECIFICATION.md` MVP section
- [ ] Implement API key authentication (see `01-authentication.json`)
  - [ ] Create API key management system
  - [ ] Implement POST /auth/token endpoint
  - [ ] Add JWT validation middleware
- [ ] Test with TeamOS integration

### Week 2-3: Core Features
- [ ] Build workflow and subscription APIs (see `02-assessments.json`)
- [ ] Create basic report generation (HTML OK for MVP)
- [ ] Implement user management with role-based access (see `05-user-management.json`)
  - [ ] Abstract legacy two-table system (managers in users table, members in respondents table)
  - [ ] Support three roles: admin, manager, member
- [ ] Test TeamOS integration flow

### Post-MVP: Enhancements
- [ ] Convert reports to structured JSON (see `03-reports.json`)
- [ ] Add visualization APIs (see `04-visualizations.json`)
- [ ] Expand analytics beyond simple role distribution (see `06-simple-analytics.json`)
- [ ] Add support for more SSO providers

## 🔄 Integration Flow Example

```javascript
// 1. TeamOS backend gets token for user
const token = await fetch('/api/v2/auth/token', {
  headers: {
    'x-api-key': process.env.TMS_API_KEY,
    'x-api-secret': process.env.TMS_API_SECRET
  },
  body: JSON.stringify({
    userId: user.email,
    organizationId: user.orgId,
    role: user.role // admin, manager, or member
  })
});

const { token: jwtToken } = await token.json();

// 2. Start workflow subscription
const subscription = await tmsApi.workflows.start({
  userId: tmsAuth.user.id,
  workflowId: 'tmp-workflow'
});

// 3. Get questions
const page = await tmsApi.subscriptions.getPage({
  subscriptionId: subscription.subscriptionId,
  pageId: subscription.navigation.firstPageId
});

// 4. Submit answers
await tmsApi.subscriptions.submitPage({
  subscriptionId: subscription.subscriptionId,
  pageId: page.pageId,
  answers: [...]
});

// 5. Get structured report
const report = await tmsApi.reports.get({
  subscriptionId: subscription.subscriptionId
});
```

## 📊 Benefits of This Design

1. **AI-Friendly**: Structured data for agent processing
2. **Performant**: Smaller payloads, better caching
3. **Flexible**: UI changes without API modifications
4. **Maintainable**: Clear separation of concerns
5. **Scalable**: Designed for growth

## 🛡️ Security Considerations

- All endpoints use HTTPS
- JWT tokens expire after 1 hour
- Refresh tokens for long sessions
- Role-based access control
- Organization-level data isolation
- API rate limiting

## 📞 Contact

For questions about this specification:
- Review the detailed JSON examples in each file
- Check the architecture diagrams for system context
- Contact the TeamOS integration team

## 🚀 Getting Started

1. Start with authentication implementation
2. Build core workflow and subscription system
3. Add report generation
4. Implement remaining endpoints
5. Test end-to-end flows

The mock implementation in `/src/lib/mock-tms-api/` can serve as a reference for expected behavior.