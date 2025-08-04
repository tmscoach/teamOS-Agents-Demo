/**
 * TMS API Utilities
 * Shared constants and utilities for TMS API operations
 */

// API Configuration
export const TMS_API_BASE_URL = 'https://api-test.tms.global';

// Subscription ID prefixes for assessment types
export const SUBSCRIPTION_TYPE_PREFIXES = {
  TMP: '219',
  QO2: '218',
  TEAM_SIGNALS: '217'
} as const;

// Test subscription IDs
export const TEST_SUBSCRIPTION_IDS = {
  TMP: '21989',
  QO2: '21983',
  TEAM_SIGNALS: '21988'
} as const;

/**
 * Determine report type from subscription ID
 */
export function getReportTypeFromSubscriptionId(subscriptionId: string): 'TMP' | 'QO2' | 'TEAM_SIGNALS' {
  if (subscriptionId.startsWith(SUBSCRIPTION_TYPE_PREFIXES.TMP)) return 'TMP';
  if (subscriptionId.startsWith(SUBSCRIPTION_TYPE_PREFIXES.QO2)) return 'QO2';
  return 'TEAM_SIGNALS';
}

/**
 * Wrap HTML fragment in a complete document with TMS styling
 */
export function wrapHTMLFragment(fragment: string): string {
  // Convert relative GetGraph URLs to absolute URLs for processing
  const processedFragment = fragment
    .replace(/src="\/GetGraph/g, `src="${TMS_API_BASE_URL}/GetGraph`)
    .replace(/&amp;/g, '&'); // Convert HTML entities back for URL processing
    
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Summary - TMS Global</title>
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <style>
    body { 
      font-family: 'Roboto', sans-serif;
      font-size: 18px;
      background-color: white;
      padding: 16px;
      text-align: center;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .table { 
      width: 100%; 
      border-collapse: collapse;
      margin: 20px auto;
      background-color: white;
    }
    
    .table td { 
      padding: 12px;
      border: 1px solid #e0e0e0;
      text-align: left;
    }
    
    .table td:first-child {
      font-weight: bold;
      background-color: #f5f5f5;
      width: 40%;
    }
    
    .backgroundWhite { 
      background: white; 
    }
    
    h3 { 
      color: #4472C4;
      font-size: 24px;
      margin: 30px 0 20px 0;
      text-align: center;
      font-weight: 500;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    @media only screen and (max-width: 1024px) {
      body {
        padding: 8px;
        max-width: 100%;
      }
      
      h3 {
        font-size: 20px;
      }
      
      .table td {
        padding: 8px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  ${processedFragment}
</body>
</html>`;
}

/**
 * Check if HTML is a fragment (not a complete document)
 */
export function isHTMLFragment(html: string): boolean {
  return typeof html === 'string' && !html.includes('<!DOCTYPE');
}