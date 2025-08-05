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

### 3. **Enhanced JWT Authentication**
- JWT tokens include rich claims for authorization
- Support for both password and passwordless (Clerk) authentication
- Refresh token mechanism for long-lived sessions

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
- `/auth/signup` - Create organization and facilitator
- `/auth/token-exchange` - Exchange Clerk ID for JWT
- `/auth/refresh` - Refresh JWT token

### 2. Assessments (see `02-assessments.json`)
- `/assessments` - List available assessment types
- `/assessments/{id}/start` - Start new assessment
- `/assessments/{subscriptionId}/pages/{pageId}` - Get page questions
- `/assessments/{subscriptionId}/pages/{pageId}/submit` - Submit answers
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
- `/users` - Create user
- `/users/{userId}` - Get user details
- `/organizations/{orgId}/users` - List organization users
- `/organizations/{orgId}` - Get organization details

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

## Migration Strategy

### Phase 1: Core Endpoints
1. Authentication and user management
2. Assessment workflow (start, pages, submit)
3. Basic report generation

### Phase 2: Enhanced Features
1. Structured report data
2. Analytics endpoints
3. Visualization APIs

### Phase 3: Advanced Integration
1. Debrief/Q&A endpoints
2. Team composition analysis
3. Predictive insights

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