# TMS API Integration Documentation

This directory contains comprehensive documentation for integrating the TMS Global legacy system with the TeamOS platform.

## 📁 Documentation Structure

### API Specifications
- **[API-SPECIFICATION.md](./API-SPECIFICATION.md)** - Main API design document with architectural decisions
- **[01-authentication.json](./01-authentication.json)** - Authentication endpoints and JWT structure
- **[02-assessments.json](./02-assessments.json)** - Assessment workflow endpoints
- **[03-reports.json](./03-reports.json)** - Report generation and retrieval endpoints
- **[04-visualizations.json](./04-visualizations.json)** - Chart and graph generation endpoints
- **[05-user-management.json](./05-user-management.json)** - User and organization management
- **[06-dashboard-analytics.json](./06-dashboard-analytics.json)** - Dashboard and analytics endpoints

### Architecture Diagrams
- **[SYSTEM-ARCHITECTURE.md](./SYSTEM-ARCHITECTURE.md)** - Visual system architecture with Mermaid diagrams
- **[USER-JOURNEY-FLOWS.md](./USER-JOURNEY-FLOWS.md)** - Detailed user journey and data flow diagrams

## 🏗️ System Overview

TeamOS integrates with multiple systems:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   TeamOS    │────▶│  TMS Global │────▶│ TMS Database│
│  (Vercel)   │     │   (Legacy)  │     │  (40+ yrs)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                         
       ├────▶ Clerk (Authentication)            
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

### 2. **Enhanced Authentication**
- JWT tokens with rich claims
- Support for both password and passwordless auth
- Clerk ID ↔ TMS ID mapping

### 3. **Structured Data Models**
- Consistent field naming (camelCase)
- Semantic sections for AI processing
- Rich metadata for context

### 4. **Report Processing Pipeline**
- HTML → Structured JSON transformation
- Vision API for chart extraction
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
- [ ] Build assessment workflow APIs (see `02-assessments.json`)
- [ ] Create basic report generation (HTML OK for MVP)
- [ ] Implement user management basics (see `05-user-management.json`)
- [ ] Test TeamOS integration flow

### Post-MVP: Enhancements
- [ ] Convert reports to structured JSON (see `03-reports.json`)
- [ ] Add visualization APIs (see `04-visualizations.json`)
- [ ] Build analytics endpoints (see `06-dashboard-analytics.json`)
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
    organizationId: user.orgId
  })
});

const { token: jwtToken } = await token.json();

// 2. Start assessment
const subscription = await tmsApi.assessments.start({
  userId: tmsAuth.user.id,
  assessmentId: 'tmp'
});

// 3. Get questions
const page = await tmsApi.assessments.getPage({
  subscriptionId: subscription.subscriptionId,
  pageId: subscription.navigation.firstPageId
});

// 4. Submit answers
await tmsApi.assessments.submitPage({
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
2. Build core assessment workflow
3. Add report generation
4. Implement remaining endpoints
5. Test end-to-end flows

The mock implementation in `/src/lib/mock-tms-api/` can serve as a reference for expected behavior.