# Simplified Authentication Approach

## The Simple Solution

You're right - we're overcomplicating this. Here's the simpler approach:

## How It Works

```mermaid
sequenceDiagram
    participant TeamOS
    participant TMS as TMS Global API
    
    Note over TeamOS,TMS: One-time Setup
    TeamOS->>TMS: Register application
    TMS->>TeamOS: API Key + Secret
    
    Note over TeamOS,TMS: Runtime Flow
    TeamOS->>TMS: POST /api/v2/auth/token<br/>Headers: x-api-key, x-api-secret<br/>Body: {userId: "user@company.com"}
    TMS->>TeamOS: JWT Token for user
    
    TeamOS->>TMS: GET /api/v2/workflows<br/>Headers: Authorization: Bearer {JWT}
    TMS->>TeamOS: Workflow data
```

## API Implementation

### 1. Application Registration (One-time)
TMS Global provides TeamOS with:
- API Key: `pk_live_teamOS_abc123`
- API Secret: `sk_live_teamOS_xyz789`
- Linked to a distributor account in TMS Global
- All organizations created via this API key belong to this distributor

### 2. Get User Token Endpoint
```json
POST /api/v2/auth/token
Headers: {
  "x-api-key": "pk_live_teamOS_abc123",
  "x-api-secret": "sk_live_teamOS_xyz789"
}
Body: {
  "userId": "user@company.com",  // or any unique identifier
  "organizationId": "org_123",
  "role": "admin|manager|member",  // user's role
  "metadata": {
    "firstName": "John",
    "lastName": "Doe",
    "department": "Engineering"
  }
}

Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "tms_usr_123",
    "email": "user@company.com"
  }
}
```

### 3. Use Token for All Requests
```json
GET /api/v2/reports/{subscriptionId}
Headers: {
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
}
```

## Benefits

1. **Dead Simple** - Just API key auth + user token generation
2. **Secure** - API keys never exposed to frontend
3. **Flexible** - Works for any client app
4. **No Identity Mapping** - TMS can use email as unique ID
5. **No SSO Complexity** - Each app handles its own auth

## TeamOS Implementation

```typescript
// Backend only - never expose API keys to frontend
class TMSAuthService {
  private apiKey = process.env.TMS_API_KEY;
  private apiSecret = process.env.TMS_API_SECRET;
  
  async getUserToken(userEmail: string) {
    // Check if we have cached token
    const cached = await cache.get(`tms_token_${userEmail}`);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }
    
    // Get new token
    const response = await fetch(`${TMS_API}/auth/token`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'x-api-secret': this.apiSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userEmail,
        organizationId: user.organizationId,
        role: user.role,
        metadata: {
          firstName: user.firstName,
          lastName: user.lastName
        }
      })
    });
    
    const { token, expiresIn } = await response.json();
    
    // Cache token
    await cache.set(`tms_token_${userEmail}`, {
      token,
      expiresAt: Date.now() + (expiresIn * 1000)
    });
    
    return token;
  }
}
```

## For Other Customers

Each customer gets their own API key:
- Customer A: `pk_live_customerA_def456`
- Customer B: `pk_live_customerB_ghi789`

They follow the same pattern - use their API key to get user tokens.

## MVP Implementation

1. Create API key management system
2. Implement `/api/v2/auth/token` endpoint
3. All other endpoints require Bearer token
4. That's it!

No complex SSO, no identity mapping, no provider-specific code.