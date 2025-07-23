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

    const { tool, parameters, jwtToken } = await request.json();

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
          PhoneNumber: bodyParams.phoneNumber
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
      }
    }

    // Execute request
    const response = await mockApi.request({
      method: toolDef.method,
      endpoint,
      data: toolDef.method !== "GET" ? convertedParams : undefined,
      jwt: toolDef.requiresAuth ? jwtToken : undefined
    });

    // Special handling for graph responses - convert Buffer to base64
    if (tool === 'tms_generate_graph' && response instanceof Buffer) {
      return NextResponse.json({
        type: 'image/png',
        data: response.toString('base64')
      });
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