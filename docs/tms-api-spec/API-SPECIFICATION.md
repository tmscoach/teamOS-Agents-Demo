# TMS Global API Specification v2.0

## Overview

This document outlines the recommended API design for the TMS Global legacy system integration. The design prioritizes structured JSON responses over HTML, enabling better AI agent integration and flexible UI rendering.

## Key Design Principles

### 1. **JSON-First Architecture**
- All endpoints return structured JSON data
- HTML generation happens on the client/agent side
- Enables better caching, smaller payloads, and flexible presentation

### 2. **RESTful Design**
- Consistent resource-based URLs
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Stateless operations

### 3. **Simple API Key Authentication**
- Applications register and receive API key + secret
- Use API key to generate JWT tokens for users
- All API requests use the JWT token
- No complex SSO or identity mapping needed
- Each application manages its own user authentication

### 4. **Structured Data Models**
- Consistent field naming (camelCase)
- Nested objects for related data
- Metadata fields for additional context

## API Structure

### Base URL
```
https://api.tms-global.com/api/v2
```

### Authentication
All authenticated endpoints require:
```
Authorization: Bearer {jwt_token}
```

Some endpoints support API key authentication:
```
x-api-key: {api_key}
```

## Core Endpoints

### 1. Authentication (see `01-authentication.json`)
- `/auth/token` - Generate JWT token using API key
- `/auth/refresh` - Refresh JWT token
- `/auth/validate` - Validate token (optional)

### 2. Assessments (see `02-assessments.json`)
- `/assessments` - List available assessment types
- `/subscriptions/assign` - Assign workflow to user (manager only)
- `/subscriptions/dashboard` - Get dashboard subscriptions
- `/assessments/{id}/start` - Start new assessment
- `/assessments/{subscriptionId}/pages/{pageId}` - Get page questions
- `/assessments/{subscriptionId}/pages/{pageId}/submit` - Submit answers
- `/questions/actions` - Check conditional logic for questions
- `/questions/conditional/{pageId}` - Get questions with conditional logic
- `/assessments/{subscriptionId}/complete` - Complete assessment

### 3. Reports (see `03-reports.json`)
- `/reports/{subscriptionId}` - Get full report data
- `/reports/{subscriptionId}/summary` - Get condensed summary
- `/reports/{subscriptionId}/sections` - Get semantic sections
- `/reports/{subscriptionId}/debrief` - Interactive Q&A

### 4. Visualizations (see `04-visualizations.json`)
- `/visualizations/generate` - Generate charts with data
- `/visualizations/templates` - List available templates

### 5. User Management (see `05-user-management.json`)
- `/organizations` - Create organization with admin user
- `/users` - Create user
- `/users/{userId}` - Get user details
- `/users/{userId}/role` - Change user role
- `/organizations/{orgId}/users` - List organization users
- `/teams` - Create team

### 6. Dashboard & Analytics (see `06-dashboard-analytics.json`)
- `/dashboard` - Get personalized dashboard
- `/analytics/team-composition` - Team composition analysis
- `/analytics/trends` - Engagement trends

## Benefits of This Design

### 1. **AI Agent Integration**
- Structured data is easier for agents to parse and understand
- Semantic sections enable better context retrieval
- Debrief endpoints support conversational interactions

### 2. **Performance**
- JSON payloads are smaller than HTML
- Better caching strategies possible
- Reduced server-side rendering load

### 3. **Flexibility**
- UI can be updated without API changes
- Multiple clients can render data differently
- Easier to support mobile/desktop variations

### 4. **Maintainability**
- Clear separation of concerns
- Easier to version and evolve
- Better testability

## MVP Implementation Guide

### Week 1: Simple Authentication
```javascript
// 1. Create API key management
POST /api/v2/auth/token
Headers: {
  "x-api-key": "pk_live_teamOS_abc123",
  "x-api-secret": "sk_live_teamOS_xyz789"
}
Body: {
  "userId": "user@company.com",
  "organizationId": "org_123",
  "role": "facilitator"
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

Implementation steps:
1. Create API key table and management
2. Implement token generation endpoint
3. Add JWT validation middleware
4. That's it - no complex identity mapping!

### Week 2-3: Core Features
1. Assessment workflow endpoints
2. Basic report generation (HTML is fine for MVP)
3. User management endpoints

### Post-MVP Enhancements
1. Convert reports from HTML to structured JSON
2. Add analytics and visualization endpoints
3. Implement webhook system

## Migration Strategy

### Phase 1: MVP (2-3 weeks)
1. Flexible auth with Clerk + native only
2. Core assessment workflow
3. Basic HTML report generation

### Phase 2: Enhanced Features (Month 2)
1. Structured JSON reports
2. Additional SSO providers
3. Analytics endpoints

### Phase 3: Advanced Integration (Month 3)
1. Full OAuth 2.0 support
2. Webhook system
3. Advanced analytics

## Example Integration Flow

```javascript
// 1. Authenticate
const { token } = await tmsApi.auth.tokenExchange({ clerkUserId });

// 2. Start assessment
const { subscriptionId, navigation } = await tmsApi.assessments.start({
  userId,
  assessmentId: 'tmp'
});

// 3. Get questions
const { questions } = await tmsApi.assessments.getPage({
  subscriptionId,
  pageId: navigation.firstPageId
});

// 4. Submit answers
await tmsApi.assessments.submitPage({
  subscriptionId,
  pageId,
  answers: [...]
});

// 5. Complete assessment
await tmsApi.assessments.complete({ subscriptionId });

// 6. Get report
const { results, insights } = await tmsApi.reports.get({ subscriptionId });

// 7. Generate visualization
const { formats } = await tmsApi.visualizations.generate({
  type: 'tmp_wheel',
  data: results.tmp.wheelData
});
```

## Security Considerations

1. **Authentication**
   - JWT tokens expire after 1 hour
   - Refresh tokens expire after 30 days
   - API keys are rate-limited

2. **Authorization**
   - Role-based access control (facilitator vs respondent)
   - Organization-level data isolation
   - Resource-level permissions

3. **Data Protection**
   - All endpoints use HTTPS
   - PII is never included in URLs
   - Audit logging for sensitive operations

## Rate Limiting

- Authentication: 10 requests per minute
- API endpoints: 100 requests per minute
- Report generation: 10 requests per hour
- Bulk operations: 5 requests per minute

## Error Handling

All errors follow consistent format:
```json
{
  "success": false,
  "error": {
    "code": "ERR_001",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Versioning

- API version in URL path (`/api/v2/`)
- Breaking changes require new version
- Deprecation notices 6 months in advance
- Backward compatibility for 12 months

## Support

For implementation questions or clarifications, please refer to the individual JSON specification files or contact the integration team.