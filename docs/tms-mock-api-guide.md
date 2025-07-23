# TMS Mock API Implementation Guide

## Overview

The TMS Mock API provides a complete simulation of the TMS Global API for development and testing purposes. It includes stateful workflow management, realistic data generation, and comprehensive report generation for TMP, QO2, and Team Signals assessments.

## Architecture

### Core Components

1. **Mock API Client** (`src/lib/mock-tms-api/mock-api-client.ts`)
   - Routes requests to appropriate endpoint handlers
   - Manages JWT token generation and validation
   - Simulates network delay for realistic behavior

2. **Mock Data Store** (`src/lib/mock-tms-api/mock-data-store.ts`)
   - In-memory data storage with global singleton pattern
   - Stores organizations, users, subscriptions, and teams
   - Maintains relationships between entities

3. **Workflow State Manager** (`src/lib/mock-tms-api/workflow-state-manager.ts`)
   - Tracks assessment progress across API calls
   - Calculates navigation info and completion percentage
   - Preserves answers throughout the session

4. **Assessment Definitions** (`src/lib/mock-tms-api/assessment-definitions.ts`)
   - Defines structure for TMP, QO2, and Team Signals
   - Maps workflow IDs to assessment configurations
   - Specifies question types and page structures

5. **Report Generators** (`src/lib/mock-tms-api/report-generators.ts`)
   - Generates realistic reports based on workflow answers
   - Provides HTML summaries and PDF generation endpoints
   - Implements assessment-specific scoring algorithms

## API Endpoints

### Authentication

#### POST /api/v1/auth/signup
Creates organization and facilitator account
```typescript
{
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  OrganizationName: string;
  PhoneNumber?: string;
}
```

#### POST /api/v1/auth/login
Facilitator/team manager login
```typescript
{
  Email: string;
  Password: string;
}
```

#### GET /api/v1/team-os/auth/validate
Validates JWT token and returns user info

### Workflow Management

#### GET /Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}
Gets current workflow page with questions
- Returns questions based on assessment type
- Includes navigation info (can go back/forward)
- Maintains state across pages

#### POST /Workflow/Update
Updates workflow with answers
```typescript
{
  subscriptionID: number;
  pageID: number;
  questions: Array<{
    questionID: number;
    value: string;
  }>;
}
```

#### GET /Workflow/Start/{workflowId}/{subscriptionId}
Starts a workflow and returns first page URL

### Subscriptions

#### GET /Respondent/GetDashboardSubscription
Gets all subscriptions for the authenticated user
- Facilitators see all organization subscriptions
- Respondents see only their own subscriptions

### Reports

#### GET /api/v1/workflow/report-summary/{subscriptionId}
Gets HTML report summary for completed assessment
- Calculates scores based on answers
- Generates insights and recommendations
- Returns formatted HTML content

#### GET /api/v1/workflow/report-templates/{subscriptionId}
Gets available report templates for an assessment

#### POST /api/v1/workflow/generate-report
Generates PDF report for completed assessment
```typescript
{
  subscriptionId: string;
  templateId: string;
}
```

## Assessment Types

### TMP (Team Management Profile)
- **Question Type**: Seesaw (Type 18)
- **Scale**: 0-40 points distributed between two statements
- **Categories**: Work Preferences, Team Roles, Leadership Style, Decision Making
- **Pages**: 15 pages with 5-6 questions each

### QO2 (Opportunities-Obstacles Quotient)
- **Question Type**: Multiple Choice (Type 2)
- **Focus**: Opportunity vs obstacle orientation
- **Analysis**: Balance between optimism and risk awareness
- **Pages**: 20 pages with 4-5 questions each

### Team Signals
- **Question Type**: Likert Scale (Type 6)
- **Framework**: 8 Strategic Development Questions
- **Traffic Light System**: Green (>75%), Orange (50-75%), Pink (<50%)
- **Pages**: 10 pages covering all 8 strategic areas

## Mock-to-Live API Switching

### Configuration

The system supports switching between mock and live API implementations:

#### Environment Variables
```bash
NEXT_PUBLIC_TMS_API_MODE=mock|live
NEXT_PUBLIC_TMS_API_URL=https://api.tms-global.com
NEXT_PUBLIC_TMS_MOCK_DELAY=100
NEXT_PUBLIC_TMS_API_LOGGING=true|false
```

#### Runtime Configuration
Use the admin interface at `/admin/api-mode` to:
- Toggle between mock and live modes
- Configure live API base URL
- Set mock response delay
- Enable/disable debug logging

### Unified Client

The `UnifiedTMSClient` automatically routes requests based on configuration:
```typescript
import { unifiedTMSClient } from '@/src/lib/tms-api/unified-client';

// Works with both mock and live APIs
const response = await unifiedTMSClient.request({
  method: 'POST',
  endpoint: '/api/v1/auth/login',
  data: { Email: 'user@example.com', Password: 'password' }
});
```

## Testing

### Admin Interface

Test the mock API at `/admin/tms-api-test`:
1. Click "Seed" to create test data
2. Use quick scenarios for common workflows
3. Test individual endpoints with custom parameters
4. View formatted responses

### Test Scenarios

#### Complete TMP Assessment Flow
1. Seed test data
2. Login as facilitator
3. Get dashboard subscriptions
4. Start TMP workflow
5. Get workflow pages
6. Submit seesaw answers
7. Navigate through pages
8. Generate report summary

#### Test Report Generation
1. Complete assessment answers
2. Get report summary
3. View available templates
4. Generate PDF report
5. Check access permissions

### Jest Tests

Run comprehensive tests:
```bash
npm test -- src/lib/mock-tms-api/__tests__/mock-api.test.ts
```

Tests cover:
- Authentication flows
- Workflow state management
- Navigation calculations
- Report generation
- Access control

## State Management

### Workflow State

Each subscription maintains:
- Current page/section position
- All submitted answers
- Completion percentage
- Navigation possibilities

### Data Persistence

Mock data is stored in-memory:
- Resets on server restart
- Use seed endpoint to recreate test data
- State preserved during session

## Report Generation

### Scoring Algorithms

#### TMP Scoring
- Seesaw values converted to percentages
- Category scores averaged from questions
- Overall score from category averages

#### QO2 Scoring
- Opportunity vs obstacle orientation
- Strategic thinking and adaptability metrics
- Balance analysis

#### Team Signals Scoring
- Traffic light status per strategic question
- Range analysis for team consistency
- Overall team development percentage

### Report Templates

Each assessment type offers:
- Standard PDF report
- Detailed PDF with extended analysis
- Excel export (QO2, Team Signals)

## Best Practices

1. **Testing**
   - Always seed test data before testing
   - Use consistent subscription IDs from recordings
   - Test both facilitator and respondent access

2. **Development**
   - Set mock delay to simulate network latency
   - Enable logging for debugging
   - Use recorded API patterns as reference

3. **Integration**
   - Use unified client for API abstraction
   - Handle both mock and live error formats
   - Test switching between modes

## Troubleshooting

### Common Issues

1. **"Subscription not found" errors**
   - Ensure test data is seeded
   - Check subscription ID matches seeded data
   - Verify mock data store is initialized

2. **JWT validation failures**
   - Login to get fresh token
   - Check token-to-user mapping
   - Verify organization access

3. **Navigation issues**
   - Check workflow state initialization
   - Verify page IDs match assessment definition
   - Ensure section/page hierarchy is correct

### Debug Tips

1. Enable API logging in configuration
2. Check browser console for detailed logs
3. Use admin interface to inspect responses
4. Verify mock data store contents

## Future Enhancements

1. **Persistence Layer**
   - Add database storage for mock data
   - Implement data export/import
   - Support multiple test scenarios

2. **Advanced Features**
   - Team-based assessments
   - Conditional questions
   - Custom report formats
   - Webhook simulations

3. **Testing Improvements**
   - Automated scenario testing
   - Performance benchmarks
   - Load testing capabilities
   - API compatibility tests