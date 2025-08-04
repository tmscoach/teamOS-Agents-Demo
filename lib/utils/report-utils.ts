/**
 * Process HTML to replace TMS API URLs with our proxy routes
 */
export function processHtmlUrls(html: string): string {
  if (!html) return '';
  
  return html
    // Replace template variables
    .replaceAll('{{BASE_URL}}', '/api/reports/images')
    // Replace direct TMS API URLs
    .replaceAll('https://api-test.tms.global', '/api/reports/images')
    .replaceAll('https://api.tms.global', '/api/reports/images')
    // Fix malformed asset paths (backslash to forward slash)
    .replaceAll('/Asset\\Get\\', '/Asset/Get/')
    .replaceAll('\\', '/'); // Fix any remaining backslashes in paths
}

/**
 * Generate HTML summary for a subscription
 */
export async function generateSummary(subscriptionId: string, jwt?: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/tms-api/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'tms_generate_html_summary',
        parameters: { subscriptionId },
        jwtToken: jwt
      })
    });

    if (!response.ok) {
      console.error('Failed to generate summary:', response.statusText);
      return '<p>Summary not available</p>';
    }

    const data = await response.json();
    return data || '<p>Summary not available</p>';
  } catch (error) {
    console.error('Error generating summary:', error);
    return '<p>Summary not available</p>';
  }
}

/**
 * Generate full HTML report for a subscription
 */
export async function generateFullReport(
  subscriptionId: string, 
  templateId: string = '6',
  jwt?: string
): Promise<string> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/tms-api/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'tms_generate_html_report',
        parameters: { 
          subscriptionId,
          templateId 
        },
        jwtToken: jwt,
        enableVisionProcessing: false // Default OFF as requested
      })
    });

    if (!response.ok) {
      console.error('Failed to generate report:', response.statusText);
      return '<p>Report not available</p>';
    }

    const data = await response.json();
    return data || '<p>Report not available</p>';
  } catch (error) {
    console.error('Error generating report:', error);
    return '<p>Report not available</p>';
  }
}