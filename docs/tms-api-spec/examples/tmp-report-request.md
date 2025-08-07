# TMP Report API Request Example

## Request

```http
GET https://api.tms-global.com/api/v2/reports/114953
```

### Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNwb25kZW50SUQiOiI2NzkyMSIsImxhc3RNb2RpZmllZCI6IjEzMzk3NzA4MTE5OTc1OTM5NyIsIm1vYmlsZUFwcFR5cGUiOiJ0ZWFtT1MiLCJleHAiOjE3ODQ3NzE5NTgsImlzcyI6IlRNUy5HbG9iYWwiLCJhdWQiOiJUTVMuR2xvYmFsIn0.2hcndV41TVTYeVTsK680QJ9HsLg3M1USBDrORgIb_dk
Content-Type: application/json
Accept: application/json
```

## Expected Response Structure

The response would be a JSON object with:
- Report metadata (user, organization, dates)
- Sections array containing all report content
- Each section having text content and/or visualization data
- Pre-computed vector chunks for AI processing

See `tmp-report-response.json` for the complete response example.