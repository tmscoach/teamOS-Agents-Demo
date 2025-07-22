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

    // Separate path params from body params
    const bodyParams = { ...parameters };
    if (pathParams) {
      pathParams.forEach(param => {
        const key = param.slice(1, -1);
        delete bodyParams[key];
      });
    }

    // Execute request
    const response = await mockApi.request({
      method: toolDef.method,
      endpoint,
      data: toolDef.method !== "GET" ? bodyParams : undefined,
      jwt: toolDef.requiresAuth ? jwtToken : undefined
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error executing test API call:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute API call" },
      { status: 500 }
    );
  }
}