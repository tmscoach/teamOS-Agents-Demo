import { NextResponse } from "next/server";

interface TestResult {
  endpoint: string;
  status: 'success' | 'error';
  statusCode?: number;
  error?: string;
  data?: any;
}

export async function GET() {
  const results: TestResult[] = [];
  
  // List of admin API endpoints to test
  const endpoints = [
    // Dashboard
    { name: 'Dashboard Stats', url: '/api/admin/dashboard/stats' },
    { name: 'Dashboard Recent Activity', url: '/api/admin/dashboard/recent-activity' },
    
    // Conversations
    { name: 'Conversations List', url: '/api/admin/conversations' },
    { name: 'Conversations Stats', url: '/api/admin/conversations/stats' },
    
    // Guardrails
    { name: 'Guardrails Stats', url: '/api/admin/guardrails/stats' },
    { name: 'Guardrails List', url: '/api/admin/guardrails' },
    { name: 'Guardrails Recent', url: '/api/admin/guardrails/stats?recent=true&limit=10' },
    
    // Variables
    { name: 'Variables Stats', url: '/api/admin/variables/stats' },
    { name: 'Variables List', url: '/api/admin/variables' },
    { name: 'Variables Problematic', url: '/api/admin/variables/stats?endpoint=problematic-fields' },
    { name: 'Variables Trends', url: '/api/admin/variables/stats?endpoint=trends' },
    
    // Agents
    { name: 'Agents Stats', url: '/api/admin/agents/stats' },
    { name: 'Agents List', url: '/api/admin/agents' },
    { name: 'Agent Configs', url: '/api/admin/agents/configs' },
    
    // Teams
    { name: 'Teams List', url: '/api/admin/teams' },
    { name: 'Teams Stats', url: '/api/admin/teams/stats' },
    
    // System
    { name: 'System Health', url: '/api/admin/system/health' },
    { name: 'System Metrics', url: '/api/admin/system/metrics' },
  ];
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.url}`, {
        headers: {
          // Add any required headers
          'Content-Type': 'application/json',
        },
      });
      
      const result: TestResult = {
        endpoint: endpoint.name,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
      };
      
      if (response.ok) {
        try {
          const data = await response.json();
          // Check for empty or invalid data structures
          if (data && typeof data === 'object') {
            // Check for common issues
            const issues = [];
            
            // Check for undefined arrays that should be empty
            if (data.results === undefined && endpoint.url.includes('list')) {
              issues.push('Missing results array');
            }
            
            // Check for NaN values
            const checkForNaN = (obj: any): boolean => {
              for (const key in obj) {
                if (typeof obj[key] === 'number' && isNaN(obj[key])) {
                  issues.push(`NaN value in ${key}`);
                  return true;
                }
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  checkForNaN(obj[key]);
                }
              }
              return false;
            };
            
            checkForNaN(data);
            
            if (issues.length > 0) {
              result.error = `Data issues: ${issues.join(', ')}`;
            }
            
            // Add summary of data structure
            result.data = {
              keys: Object.keys(data).slice(0, 5),
              hasData: Object.keys(data).length > 0,
              arrayFields: Object.entries(data)
                .filter(([_, value]) => Array.isArray(value))
                .map(([key, value]) => ({ field: key, length: (value as any[]).length }))
            };
          }
        } catch (e) {
          result.error = 'Failed to parse JSON response';
        }
      } else {
        try {
          const errorData = await response.json();
          result.error = errorData.error || `HTTP ${response.status}`;
        } catch (e) {
          result.error = `HTTP ${response.status}`;
        }
      }
      
      results.push(result);
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Summary
  const summary = {
    total: results.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    errors: results.filter(r => r.status === 'error').map(r => ({
      endpoint: r.endpoint,
      error: r.error,
      statusCode: r.statusCode
    })),
  };
  
  return NextResponse.json({
    summary,
    results,
    timestamp: new Date().toISOString(),
  });
}