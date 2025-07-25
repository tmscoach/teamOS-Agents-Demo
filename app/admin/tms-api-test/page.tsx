"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Play, Loader2, Copy, Check, RefreshCw, Key, Database } from "lucide-react";
import { TMS_TOOL_REGISTRY } from "@/src/lib/agents/tools/tms-tool-registry";

interface ApiTestResult {
  request: {
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    statusText: string;
    data: any;
    duration: number;
  };
  timestamp: string;
}

export default function TMSApiTestPage() {
  const { userId } = useAuth();
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [jwtToken, setJwtToken] = useState<string>("");
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [mockDataStatus, setMockDataStatus] = useState<{
    users: number;
    organizations: number;
    subscriptions: number;
    workflows: number;
  }>({ users: 0, organizations: 0, subscriptions: 0, workflows: 0 });
  const [testData, setTestData] = useState<{
    facilitator?: { id: string; email: string; organizationId: string; token: string };
    respondent?: { id: string; email: string; organizationId: string; password: string };
    subscriptions?: Array<{ subscriptionId: string; workflowId: string; workflowName: string; assessmentType: string; status: string }>;
  }>({});
  const [workflowScenarios] = useState([
    {
      name: "TMP Workflow - Start",
      tool: "tms_workflow_start",
      params: { workflowId: "tmp-workflow", subscriptionId: "21989" }
    },
    {
      name: "TMP Workflow - Get Page 1", 
      tool: "tms_get_workflow_process",
      params: { subscriptionId: "21989", baseContentId: "3", sectionId: "2", pageId: "2" }
    },
    {
      name: "TMP Workflow - Submit Answers",
      tool: "tms_update_workflow",
      params: {
        subscriptionID: 21989,
        pageID: 2,
        questions: [
          { questionID: 20, value: "20" },
          { questionID: 21, value: "12" },
          { questionID: 22, value: "21" },
          { questionID: 23, value: "02" },
          { questionID: 24, value: "11" },
          { questionID: 1041, value: "Test Organization" }
        ]
      }
    },
    {
      name: "QO2 Workflow - Get Overview",
      tool: "tms_get_workflow_process",
      params: { subscriptionId: "21983", baseContentId: "5", sectionId: "93", pageId: "408" }
    },
    {
      name: "Team Signals - Get Page 1",
      tool: "tms_get_workflow_process",
      params: { subscriptionId: "21988", baseContentId: "12", sectionId: "13", pageId: "97" }
    },
    {
      name: "TMP HTML Report",
      tool: "tms_generate_html_report",
      params: { subscriptionId: "21989", templateId: "6" }
    },
    {
      name: "QO2 HTML Report",
      tool: "tms_generate_html_report",
      params: { subscriptionId: "21983", templateId: "10" }
    },
    {
      name: "Team Signals HTML Report",
      tool: "tms_generate_html_report",
      params: { subscriptionId: "21988", templateId: "2" }
    },
    {
      name: "Team Signals 360 HTML Report",
      tool: "tms_generate_html_report",
      params: { subscriptionId: "21988", templateId: "360" }
    },
    {
      name: "TMP Wheel Graph",
      tool: "tms_generate_graph",
      params: { 
        chartType: "CreateTMPQWheel",
        params: { mr: "8", rr1: "7", rr2: "5" }
      }
    },
    {
      name: "QO2 Model Graph",
      tool: "tms_generate_graph",
      params: {
        chartType: "CreateQO2Model",
        params: { gva: "38", pav: "33", ov: "48", tv: "70", povn: "53", enq: "0.9", clear: "yes" }
      }
    },
    {
      name: "Team Signals Graph",
      tool: "tms_generate_graph",
      params: {
        chartType: "CreateTeamSignals",
        params: { colors: "amber|red|amber|amber|red|red|amber|amber" }
      }
    },
    {
      name: "Team Signals 360 Graph",
      tool: "tms_generate_graph",
      params: {
        chartType: "CreateTeamSignals",
        params: { colors: "amber|amber|red|amber|amber|red|amber|amber" }
      }
    },
    {
      name: "Report Debrief Q&A",
      tool: "tms_debrief_report",
      params: {
        subscriptionId: "21988",
        query: "What does the green section in my TMP wheel represent?"
      }
    }
  ]);

  // Load JWT token from database or use test token
  useEffect(() => {
    if (userId) {
      fetchJwtToken();
    }
    // If no token, use the test JWT from env
    if (!jwtToken && process.env.NEXT_PUBLIC_TMS_TEST_JWT) {
      setJwtToken(process.env.NEXT_PUBLIC_TMS_TEST_JWT);
    }
  }, [userId]);

  // Load mock data status
  useEffect(() => {
    fetchMockDataStatus();
  }, []);

  const fetchJwtToken = async () => {
    try {
      const res = await fetch("/api/admin/tms-auth/token");
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setJwtToken(data.token);
        }
      }
    } catch (error) {
      console.error("Error fetching JWT token:", error);
    }
  };

  const fetchMockDataStatus = async () => {
    try {
      const res = await fetch("/api/admin/tms-api/status");
      if (res.ok) {
        const data = await res.json();
        setMockDataStatus(data);
      }
    } catch (error) {
      console.error("Error fetching mock data status:", error);
    }
  };

  const seedTestData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tms-api/seed", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setTestData(data.data);
        // Automatically set the JWT token from seed data
        if (data.data.facilitator?.token) {
          setJwtToken(data.data.facilitator.token);
        }
        toast.success("Test data created successfully - JWT token updated");
        fetchMockDataStatus();
      }
    } catch (error) {
      toast.error("Failed to create test data");
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = (tool: string) => {
    const toolDef = TMS_TOOL_REGISTRY[tool];
    if (!toolDef) return {};

    // Use test data if available
    const subscriptionId = testData.subscriptions?.[0]?.subscriptionId || "sub_123";
    const workflowId = testData.subscriptions?.[0]?.workflowId || "tmp-workflow";
    const orgId = testData.facilitator?.organizationId || "org_123";

    const samples: Record<string, any> = {
      tms_create_org: {
        email: "manager@example.com",
        password: "securePassword123!",
        firstName: "John",
        lastName: "Doe",
        organizationName: "Acme Corp",
        phoneNumber: "+1234567890",
        clerkUserId: "" // Optional - leave empty for password-based
      },
      tms_facilitator_login: {
        email: testData.facilitator?.email || "facilitator@example.com",
        password: "TestPassword123!"
      },
      tms_respondent_login: {
        respondentEmail: testData.respondent?.email || "respondent@example.com",
        respondentPassword: testData.respondent?.password || "Welcome123!",
        mobileAppType: "teamOS"
      },
      tms_get_workflow_process: {
        subscriptionId: subscriptionId,
        baseContentId: "base_123",
        sectionId: "section_1",
        pageId: "tmp-page-1"
      },
      tms_update_workflow: {
        subscriptionID: parseInt(subscriptionId) || 21989,
        pageID: 2,
        questions: [
          { questionID: 20, value: "20" },
          { questionID: 21, value: "12" }
        ]
      },
      tms_generate_html_report: {
        subscriptionId: subscriptionId,
        templateId: workflowId === "tmp-workflow" ? "6" : 
                    workflowId === "qo2-workflow" ? "10" : 
                    workflowId === "team-signals-workflow" ? "2" :
                    "360" // Team Signals 360
      },
      tms_generate_graph: {
        chartType: "CreateTMPQWheel",
        params: {
          mr: "8",
          rr1: "7", 
          rr2: "5"
        }
      },
      tms_generate_report: {
        organizationId: orgId,
        reportType: "team_summary",
        format: "PDF"
      },
      tms_start_workflow: {
        workflowId: workflowId,
        subscriptionId: subscriptionId
      },
      tms_get_question_actions: {
        subscriptionId: subscriptionId,
        pageId: "tmp-page-1",
        answers: {}
      },
      tms_get_question_ids_with_actions: {
        pageId: "tmp-page-1"
      },
      tms_create_respondent: {
        email: "test.respondent@example.com",
        firstName: "Test",
        lastName: "Respondent",
        organizationId: orgId,
        clerkUserId: "clerk_test_resp_" + Date.now(),
        respondentName: "Test Respondent"
      },
      tms_create_facilitator: {
        email: "test.facilitator@example.com",
        firstName: "Test",
        lastName: "Facilitator",
        organizationId: orgId,
        clerkUserId: "clerk_test_fac_" + Date.now()
      },
      tms_token_exchange: {
        clerkUserId: "clerk_test_123"
      },
      tms_assign_subscription: {
        userId: testData.facilitator?.id || "user_123",
        workflowId: "tmp-workflow",
        organizationId: testData.facilitator?.organizationId || orgId
      }
    };

    return samples[tool] || {};
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    setParameters(generateSampleData(tool));
    setResult(null);
    
    // Set default headers for password-less tools
    if (tool === 'tms_create_respondent' || tool === 'tms_create_facilitator' || tool === 'tms_token_exchange') {
      setCustomHeaders({ 'x-api-key': 'mock-api-key-12345' });
    } else {
      setCustomHeaders({});
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters({
      ...parameters,
      [key]: value
    });
  };

  const executeTool = async () => {
    if (!selectedTool) {
      toast.error("Please select a tool to test");
      return;
    }

    const toolDef = TMS_TOOL_REGISTRY[selectedTool];
    if (!toolDef) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      // Prepare request
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (toolDef.requiresAuth && jwtToken) {
        headers["Authorization"] = `Bearer ${jwtToken}`;
      }

      // Build URL with path parameters
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

      const request = {
        method: toolDef.method,
        endpoint,
        headers,
        body: toolDef.method !== "GET" ? bodyParams : undefined
      };

      // Execute request through mock API
      const res = await fetch("/api/admin/tms-api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tool: selectedTool,
          parameters,
          jwtToken: toolDef.requiresAuth ? jwtToken : undefined,
          headers: customHeaders
        })
      });

      const data = await res.json();
      const duration = Date.now() - startTime;

      setResult({
        request,
        response: {
          status: res.status,
          statusText: res.statusText,
          data,
          duration
        },
        timestamp: new Date().toISOString()
      });

      if (res.ok) {
        toast.success(`API call successful (${duration}ms)`);
      } else {
        toast.error(`API call failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      setResult({
        request: {
          method: toolDef.method,
          endpoint: toolDef.endpoint,
          headers: {},
          body: parameters
        },
        response: {
          status: 500,
          statusText: "Internal Server Error",
          data: { error: error instanceof Error ? error.message : "Unknown error" },
          duration
        },
        timestamp: new Date().toISOString()
      });
      toast.error("API call failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const refreshJwtToken = async () => {
    setLoading(true);
    try {
      // Create a test user and get JWT token
      const res = await fetch("/api/admin/tms-auth/refresh", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setJwtToken(data.token);
        toast.success("JWT token refreshed");
      }
    } catch (error) {
      toast.error("Failed to refresh JWT token");
    } finally {
      setLoading(false);
    }
  };

  const resetMockData = async () => {
    if (!confirm("Are you sure you want to reset all mock data? This will clear all test data.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/tms-api/reset", {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Mock data reset successfully");
        fetchMockDataStatus();
      }
    } catch (error) {
      toast.error("Failed to reset mock data");
    } finally {
      setLoading(false);
    }
  };

  // Group tools by category
  const toolsByCategory = Object.entries(TMS_TOOL_REGISTRY).reduce((acc, [key, tool]) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push({ key, ...tool });
    return acc;
  }, {} as Record<string, Array<typeof TMS_TOOL_REGISTRY[string] & { key: string }>>);

  const selectedToolDef = selectedTool ? TMS_TOOL_REGISTRY[selectedTool] : null;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>
          TMS API Test Interface
        </h2>
        <p style={{ color: '#6b7280' }}>
          Test mock TMS Global API endpoints with sample data
        </p>
      </div>

      {/* Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Key style={{ width: '20px', height: '20px', color: '#10b981' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>JWT Token</h3>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
            {jwtToken ? 'Active' : 'Not Set'}
          </p>
          {jwtToken && (
            <button
              onClick={refreshJwtToken}
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw style={{ width: '12px', height: '12px' }} />
              Refresh
            </button>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Database style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Mock Data</h3>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            <div>Users: {mockDataStatus.users}</div>
            <div>Orgs: {mockDataStatus.organizations}</div>
            <div>Subscriptions: {mockDataStatus.subscriptions}</div>
            {testData.facilitator && (
              <div style={{ marginTop: '4px', color: '#10b981', fontSize: '11px' }}>
                Facilitator: {testData.facilitator.email}<br/>
                Respondent: {testData.respondent?.email}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={seedTestData}
              disabled={loading}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Database style={{ width: '12px', height: '12px' }} />
              Seed
            </button>
            <button
              onClick={resetMockData}
              disabled={loading}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw style={{ width: '12px', height: '12px' }} />
            Reset
          </button>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '24px'
      }}>
        {/* Tool Selector */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          height: 'fit-content'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Select API Endpoint
          </h3>

          {Object.entries(toolsByCategory).map(([category, tools]) => (
            <div key={category} style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                {category}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tools.map(tool => (
                  <button
                    key={tool.key}
                    onClick={() => handleToolSelect(tool.key)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: selectedTool === tool.key ? '2px solid #111827' : '1px solid #e5e7eb',
                      backgroundColor: selectedTool === tool.key ? '#f9fafb' : 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTool !== tool.key) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTool !== tool.key) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ fontWeight: '500', color: '#111827' }}>
                      {tool.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        padding: '1px 4px',
                        borderRadius: '3px',
                        backgroundColor: tool.method === 'GET' ? '#dbeafe' : '#fef3c7',
                        color: tool.method === 'GET' ? '#1e40af' : '#92400e',
                        fontWeight: '600'
                      }}>
                        {tool.method}
                      </span>
                      {tool.requiresAuth && (
                        <span style={{
                          padding: '1px 4px',
                          borderRadius: '3px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          Auth
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Test Interface */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {!selectedTool ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#6b7280'
            }}>
              <p>Select an API endpoint from the left to begin testing</p>
            </div>
          ) : selectedToolDef && (
            <>
              {/* Tool Info */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '8px'
                }}>
                  {selectedToolDef.name}
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                  {selectedToolDef.description}
                </p>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: selectedToolDef.method === 'GET' ? '#1e40af' : '#92400e'
                  }}>
                    {selectedToolDef.method}
                  </span>
                  {' '}
                  {selectedToolDef.endpoint}
                </div>
                {selectedToolDef.requiresAuth && !jwtToken && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>This endpoint requires authentication. JWT token not found.</span>
                    <button
                      onClick={refreshJwtToken}
                      disabled={loading}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Generate Token
                    </button>
                  </div>
                )}
              </div>

              {/* Workflow and Report Scenarios */}
              {selectedTool && (selectedTool.includes('workflow') || selectedTool.includes('tms_get_workflow') || selectedTool === 'tms_get_dashboard_subscriptions' || selectedTool.includes('report') || selectedTool === 'tms_generate_html_report' || selectedTool === 'tms_generate_graph' || selectedTool === 'tms_debrief_report') && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>
                    Quick Test Scenarios
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    {workflowScenarios
                      .filter(scenario => scenario.tool === selectedTool)
                      .map((scenario, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setParameters(scenario.params);
                            toast.success(`Loaded scenario: ${scenario.name}`);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb',
                            color: '#374151',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }}
                        >
                          {scenario.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Parameters */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px'
                }}>
                  Parameters
                </h4>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  {Object.entries(selectedToolDef.parameters.properties).length === 0 ? (
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      No parameters required
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(selectedToolDef.parameters.properties).map(([key, schema]: [string, any]) => (
                        <div key={key}>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            {key}
                            {selectedToolDef.parameters.required.includes(key) && (
                              <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                            )}
                          </label>
                          {schema.description && (
                            <p style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              marginBottom: '4px'
                            }}>
                              {schema.description}
                            </p>
                          )}
                          {schema.type === 'object' || schema.type === 'array' ? (
                            <textarea
                              value={typeof parameters[key] === 'object' ? JSON.stringify(parameters[key], null, 2) : ''}
                              onChange={(e) => {
                                try {
                                  const value = JSON.parse(e.target.value);
                                  handleParameterChange(key, value);
                                } catch {
                                  // Invalid JSON, don't update
                                }
                              }}
                              rows={4}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                resize: 'vertical'
                              }}
                            />
                          ) : (
                            <input
                              type={schema.type === 'number' ? 'number' : 'text'}
                              value={parameters[key] || ''}
                              onChange={(e) => handleParameterChange(key, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                fontSize: '14px'
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Headers */}
              {(selectedTool === 'tms_create_respondent' || selectedTool === 'tms_create_facilitator' || selectedTool === 'tms_token_exchange') && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>
                    Headers
                  </h4>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Key style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          x-api-key
                        </span>
                      </div>
                      <input
                        type="text"
                        value={customHeaders['x-api-key'] || ''}
                        onChange={(e) => setCustomHeaders({ ...customHeaders, 'x-api-key': e.target.value })}
                        placeholder="Enter API key"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          fontSize: '14px',
                          fontFamily: 'monospace'
                        }}
                      />
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Required for password-less user creation endpoints. Default: mock-api-key-12345
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={executeTool}
                disabled={loading || (selectedToolDef.requiresAuth && !jwtToken)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#111827',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: (loading || (selectedToolDef.requiresAuth && !jwtToken)) ? 0.5 : 1,
                  pointerEvents: (loading || (selectedToolDef.requiresAuth && !jwtToken)) ? 'none' : 'auto'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play style={{ width: '16px', height: '16px' }} />
                    Execute API Call
                  </>
                )}
              </button>

              {/* Result */}
              {result && (
                <div style={{ marginTop: '32px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      Result
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: result.response.status < 400 ? '#d1fae5' : '#fee2e2',
                        color: result.response.status < 400 ? '#065f46' : '#991b1b'
                      }}>
                        {result.response.status} {result.response.statusText}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#e0e7ff',
                        color: '#4338ca'
                      }}>
                        {result.response.duration}ms
                      </span>
                    </div>
                  </div>

                  {/* Request */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Request
                      </h5>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(result.request, null, 2))}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                        Copy
                      </button>
                    </div>
                    <pre style={{
                      padding: '12px',
                      backgroundColor: '#1e293b',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#e2e8f0',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </div>

                  {/* Response */}
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        Response
                      </h5>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(result.response.data, null, 2))}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                        Copy
                      </button>
                    </div>
                    {/* Special rendering for HTML reports and images */}
                    {selectedTool === 'tms_generate_html_report' && result.response.status === 200 && typeof result.response.data === 'string' ? (
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <iframe
                            srcDoc={result.response.data}
                            style={{
                              width: '100%',
                              height: '600px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: 'white'
                            }}
                            title="Report Preview"
                          />
                        </div>
                        <details>
                          <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
                            View HTML Source
                          </summary>
                          <pre style={{
                            padding: '12px',
                            backgroundColor: '#1e293b',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#e2e8f0',
                            overflow: 'auto',
                            maxHeight: '400px',
                            marginTop: '8px'
                          }}>
                            {result.response.data}
                          </pre>
                        </details>
                      </div>
                    ) : selectedTool === 'tms_generate_graph' && result.response.status === 200 && result.response.data ? (
                      <div>
                        <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                          <img
                            src={`data:image/png;base64,${
                              // Check if response has base64 data
                              result.response.data.data || ''
                            }`}
                            alt="Generated Chart"
                            style={{
                              maxWidth: '100%',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              padding: '12px'
                            }}
                          />
                        </div>
                        <details>
                          <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
                            View Raw Response
                          </summary>
                          <pre style={{
                            padding: '12px',
                            backgroundColor: '#1e293b',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#e2e8f0',
                            overflow: 'auto',
                            maxHeight: '400px',
                            marginTop: '8px'
                          }}>
                            {JSON.stringify(result.response.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : selectedTool === 'tms_debrief_report' && result.response.status === 200 && result.response.data ? (
                      <div>
                        {/* Main Response */}
                        <div style={{ marginBottom: '16px' }}>
                          <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Debrief Response:
                          </h6>
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#111827',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {result.response.data.response}
                          </div>
                        </div>

                        {/* Relevant Sections */}
                        {result.response.data.relevantSections && result.response.data.relevantSections.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                              Relevant Report Sections:
                            </h6>
                            {result.response.data.relevantSections.map((section: any, idx: number) => (
                              <div key={idx} style={{
                                padding: '12px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '6px',
                                marginBottom: '8px'
                              }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                  Type: {section.type}
                                </div>
                                {section.explanation && (
                                  <div style={{ fontSize: '13px', color: '#374151' }}>
                                    {section.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested Questions */}
                        {result.response.data.suggestedQuestions && result.response.data.suggestedQuestions.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <h6 style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                              Suggested Follow-up Questions:
                            </h6>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {result.response.data.suggestedQuestions.map((question: string, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setParameters({ ...parameters, query: question });
                                    toast.success('Question loaded into parameters');
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontSize: '13px',
                                    color: '#374151',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#d1d5db';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                                  }}
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <details>
                          <summary style={{ cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
                            View Raw Response
                          </summary>
                          <pre style={{
                            padding: '12px',
                            backgroundColor: '#1e293b',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: '#e2e8f0',
                            overflow: 'auto',
                            maxHeight: '400px',
                            marginTop: '8px'
                          }}>
                            {JSON.stringify(result.response.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : (
                      <pre style={{
                        padding: '12px',
                        backgroundColor: '#1e293b',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#e2e8f0',
                        overflow: 'auto',
                        maxHeight: '400px'
                      }}>
                        {JSON.stringify(result.response.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}