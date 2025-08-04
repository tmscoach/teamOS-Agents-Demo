import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { MockTMSAPIClient } from "@/src/lib/mock-tms-api/mock-api-client";
import { TMS_TOOL_REGISTRY } from "@/src/lib/agents/tools/tms-tool-registry";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tool, parameters, jwtToken, headers = {}, enableVisionProcessing = false } = await request.json();

    // Validate tool exists
    const toolDef = TMS_TOOL_REGISTRY[tool];
    if (!toolDef) {
      return NextResponse.json(
        { error: "Invalid tool" },
        { status: 400 }
      );
    }

    // Create mock API client
    const mockApi = new MockTMSAPIClient();

    // Build endpoint URL with path parameters
    let endpoint = toolDef.endpoint;
    const pathParams = endpoint.match(/{(\w+)}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const key = param.slice(1, -1);
        if (parameters[key]) {
          endpoint = endpoint.replace(param, parameters[key]);
        }
      });
    }
    
    // Special handling for GetGraph endpoint - build query string
    if (tool === 'tms_generate_graph' && parameters.chartType) {
      const queryParams = [`${parameters.chartType}`];
      
      // Add additional parameters
      if (parameters.params) {
        Object.entries(parameters.params).forEach(([key, value]) => {
          queryParams.push(`${key}=${encodeURIComponent(String(value))}`);
        });
      }
      
      endpoint += '?' + queryParams.join('&');
    }

    // Separate path params from body params
    const bodyParams = { ...parameters };
    if (pathParams) {
      pathParams.forEach(param => {
        const key = param.slice(1, -1);
        delete bodyParams[key];
      });
    }

    // Convert parameters based on tool type
    let convertedParams = bodyParams;
    if (toolDef.method !== "GET") {
      // Apply parameter conversion for specific tools
      if (tool === 'tms_create_org') {
        convertedParams = {
          Email: bodyParams.email,
          Password: bodyParams.password,
          FirstName: bodyParams.firstName,
          LastName: bodyParams.lastName,
          OrganizationName: bodyParams.organizationName,
          PhoneNumber: bodyParams.phoneNumber,
          ClerkUserId: bodyParams.clerkUserId
        };
      } else if (tool === 'tms_facilitator_login') {
        convertedParams = {
          Email: bodyParams.email,
          Password: bodyParams.password
        };
      } else if (tool === 'tms_respondent_login') {
        convertedParams = {
          RespondentEmail: bodyParams.respondentEmail,
          RespondentPassword: bodyParams.respondentPassword,
          MobileAppType: bodyParams.mobileAppType || 'teamOS'
        };
      } else if (tool === 'tms_create_respondent' || tool === 'tms_create_facilitator') {
        convertedParams = {
          email: bodyParams.email,
          firstName: bodyParams.firstName,
          lastName: bodyParams.lastName,
          organizationId: bodyParams.organizationId,
          clerkUserId: bodyParams.clerkUserId,
          userType: bodyParams.userType || (tool === 'tms_create_respondent' ? 'Respondent' : 'Facilitator'),
          respondentName: bodyParams.respondentName
        };
      } else if (tool === 'tms_token_exchange') {
        convertedParams = {
          clerkUserId: bodyParams.clerkUserId
        };
      } else if (tool === 'tms_assign_subscription') {
        convertedParams = {
          userId: bodyParams.userId,
          workflowId: bodyParams.workflowId,
          organizationId: bodyParams.organizationId
        };
      }
    }

    // Execute request
    const response = await mockApi.request({
      method: toolDef.method,
      endpoint,
      data: toolDef.method !== "GET" ? convertedParams : undefined,
      jwt: toolDef.requiresAuth ? jwtToken : undefined,
      headers
    });

    // Special handling for graph responses - convert Buffer to base64
    if (tool === 'tms_generate_graph' && response instanceof Buffer) {
      return NextResponse.json({
        type: 'image/png',
        data: response.toString('base64')
      });
    }

    // For HTML reports and summaries, trigger storage with immediate processing
    if ((tool === 'tms_generate_html_report' || tool === 'tms_generate_html_summary') && response) {
      try {
        const reportType = parameters.subscriptionId.startsWith('219') ? 'TMP' : 
                          parameters.subscriptionId.startsWith('218') ? 'QO2' : 'TEAM_SIGNALS';
        
        const logPrefix = tool === 'tms_generate_html_summary' ? '[TMS API Test Summary]' : '[TMS API Test]';
        console.log(`${logPrefix} Storing HTML ${tool === 'tms_generate_html_summary' ? 'summary' : 'report'} for immediate processing...`);
        
        // For summaries, we need to wrap the fragment in a basic HTML document for proper rendering
        let htmlToStore = response;
        if (tool === 'tms_generate_html_summary' && typeof response === 'string' && !response.includes('<!DOCTYPE')) {
          // It's a fragment, wrap it in basic HTML
          // URLs are already absolute in the fragment, no need to replace them
          htmlToStore = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Assessment Summary</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 10px; }
    .backgroundWhite { background: white; }
    h3 { color: #333; margin: 20px 0 10px 0; }
  </style>
</head>
<body>
  ${response}
</body>
</html>`;
        }
        
        const storeResponse = await fetch(`${request.url.replace('/api/admin/tms-api/test', '/api/reports/store')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cookie: request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            reportType,
            subscriptionId: parameters.subscriptionId,
            templateId: parameters.templateId || '6',
            rawHtml: htmlToStore,
            organizationId: 'default',
            teamId: null,
            processImmediately: enableVisionProcessing,
            jwt: jwtToken
          })
        });

        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          console.log(`${logPrefix} ${tool === 'tms_generate_html_summary' ? 'Summary' : 'Report'} stored successfully:`, storeData.reportId);
        } else {
          console.error(`${logPrefix} Failed to store ${tool === 'tms_generate_html_summary' ? 'summary' : 'report'}:`, await storeResponse.text());
        }
      } catch (storeError) {
        console.error(`${logPrefix} Error storing ${tool === 'tms_generate_html_summary' ? 'summary' : 'report'}:`, storeError);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error executing test API call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute API call" },
      { status: 500 }
    );
  }
}