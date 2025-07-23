/**
 * TMS Mock API Test Scenarios
 * Pre-configured test scenarios for common workflows
 */

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedOutcome: string;
}

export interface TestStep {
  tool: string;
  params: Record<string, any>;
  description: string;
  expectedResponse?: Record<string, any>;
}

export const TMS_TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'complete-tmp-assessment',
    name: 'Complete TMP Assessment',
    description: 'Full workflow for completing a Team Management Profile assessment',
    steps: [
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'facilitator@example.com',
          password: 'TestPassword123!'
        },
        description: 'Login as facilitator'
      },
      {
        tool: 'tms_get_dashboard_subscriptions',
        params: {},
        description: 'Get available assessments'
      },
      {
        tool: 'tms_workflow_start',
        params: {
          workflowId: 'tmp-workflow',
          subscriptionId: '21989'
        },
        description: 'Start TMP workflow'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21989',
          baseContentId: '3',
          sectionId: '2',
          pageId: '2'
        },
        description: 'Get first page of questions'
      },
      {
        tool: 'tms_update_workflow',
        params: {
          subscriptionID: 21989,
          pageID: 2,
          questions: [
            { questionID: 20, value: "30" },
            { questionID: 21, value: "12" },
            { questionID: 22, value: "21" },
            { questionID: 23, value: "03" },
            { questionID: 24, value: "20" }
          ]
        },
        description: 'Submit seesaw answers for page 1'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21989',
          baseContentId: '3',
          sectionId: '2',
          pageId: '3'
        },
        description: 'Navigate to next page'
      },
      {
        tool: 'tms_get_report_summary',
        params: {
          subscriptionId: '21989'
        },
        description: 'Get assessment report'
      }
    ],
    expectedOutcome: 'TMP assessment completed with scores calculated and report generated'
  },
  {
    id: 'qo2-assessment-flow',
    name: 'QO2 Assessment Flow',
    description: 'Complete Opportunities-Obstacles Quotient assessment',
    steps: [
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'facilitator@example.com',
          password: 'TestPassword123!'
        },
        description: 'Login as facilitator'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21983',
          baseContentId: '5',
          sectionId: '93',
          pageId: '408'
        },
        description: 'Get QO2 overview page'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21983',
          baseContentId: '5',
          sectionId: '6',
          pageId: '24'
        },
        description: 'Navigate to first question page'
      },
      {
        tool: 'tms_update_workflow',
        params: {
          subscriptionID: 21983,
          pageID: 24,
          questions: [
            { questionID: 100, value: "1" },
            { questionID: 101, value: "3" },
            { questionID: 102, value: "2" },
            { questionID: 103, value: "4" }
          ]
        },
        description: 'Submit multiple choice answers'
      },
      {
        tool: 'tms_get_report_templates',
        params: {
          subscriptionId: '21983'
        },
        description: 'Get available report formats'
      },
      {
        tool: 'tms_generate_subscription_report',
        params: {
          subscriptionId: '21983',
          templateId: 'qo2-detailed-pdf'
        },
        description: 'Generate detailed PDF report'
      }
    ],
    expectedOutcome: 'QO2 assessment completed with opportunity/obstacle balance analyzed'
  },
  {
    id: 'team-signals-traffic-lights',
    name: 'Team Signals Traffic Light Analysis',
    description: 'Complete Team Signals assessment and view traffic light status',
    steps: [
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'facilitator@example.com',
          password: 'TestPassword123!'
        },
        description: 'Login as facilitator'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21988',
          baseContentId: '12',
          sectionId: '13',
          pageId: '97'
        },
        description: 'Get Team Signals first page'
      },
      {
        tool: 'tms_update_workflow',
        params: {
          subscriptionID: 21988,
          pageID: 97,
          questions: [
            { questionID: 200, value: "5" }, // Strongly agree
            { questionID: 201, value: "4" }, // Agree
            { questionID: 202, value: "2" }, // Disagree
            { questionID: 203, value: "3" }  // Neutral
          ]
        },
        description: 'Submit Likert scale responses'
      },
      {
        tool: 'tms_get_report_summary',
        params: {
          subscriptionId: '21988'
        },
        description: 'View traffic light analysis'
      }
    ],
    expectedOutcome: 'Team Signals assessment showing green/orange/pink status for 8 strategic questions'
  },
  {
    id: 'test-access-control',
    name: 'Test Access Control',
    description: 'Verify facilitator vs respondent access permissions',
    steps: [
      {
        tool: 'tms_create_org',
        params: {
          email: 'neworg@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'Manager',
          organizationName: 'Access Test Org'
        },
        description: 'Create new organization'
      },
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'neworg@example.com',
          password: 'SecurePass123!'
        },
        description: 'Login as new facilitator'
      },
      {
        tool: 'tms_get_dashboard_subscriptions',
        params: {},
        description: 'View all org subscriptions (facilitator access)'
      },
      {
        tool: 'tms_check_user_permissions',
        params: {},
        description: 'Verify facilitator permissions'
      }
    ],
    expectedOutcome: 'Facilitator can see all organization subscriptions, respondent sees only own'
  },
  {
    id: 'workflow-navigation',
    name: 'Test Workflow Navigation',
    description: 'Test forward/backward navigation through assessment',
    steps: [
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'facilitator@example.com',
          password: 'TestPassword123!'
        },
        description: 'Login as facilitator'
      },
      {
        tool: 'tms_workflow_start',
        params: {
          workflowId: 'tmp-workflow',
          subscriptionId: '21989'
        },
        description: 'Start workflow'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21989',
          baseContentId: '3',
          sectionId: '2',
          pageId: '2'
        },
        description: 'Get page 1 (cannot go back)'
      },
      {
        tool: 'tms_update_workflow',
        params: {
          subscriptionID: 21989,
          pageID: 2,
          questions: [
            { questionID: 20, value: "20" },
            { questionID: 21, value: "20" }
          ]
        },
        description: 'Submit answers'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21989',
          baseContentId: '3',
          sectionId: '2',
          pageId: '3'
        },
        description: 'Go to page 2 (can now go back)'
      },
      {
        tool: 'tms_get_workflow_process',
        params: {
          subscriptionId: '21989',
          baseContentId: '3',
          sectionId: '2',
          pageId: '2'
        },
        description: 'Go back to page 1 (answers preserved)'
      }
    ],
    expectedOutcome: 'Navigation works correctly with state preserved across pages'
  },
  {
    id: 'report-generation-all-types',
    name: 'Generate All Report Types',
    description: 'Test report generation for all assessment types',
    steps: [
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'facilitator@example.com',
          password: 'TestPassword123!'
        },
        description: 'Login as facilitator'
      },
      {
        tool: 'tms_get_report_summary',
        params: {
          subscriptionId: '21989'
        },
        description: 'Get TMP HTML report'
      },
      {
        tool: 'tms_get_report_summary',
        params: {
          subscriptionId: '21983'
        },
        description: 'Get QO2 HTML report'
      },
      {
        tool: 'tms_get_report_summary',
        params: {
          subscriptionId: '21988'
        },
        description: 'Get Team Signals HTML report'
      },
      {
        tool: 'tms_generate_subscription_report',
        params: {
          subscriptionId: '21989',
          templateId: 'tmp-standard-pdf'
        },
        description: 'Generate TMP PDF'
      },
      {
        tool: 'tms_generate_subscription_report',
        params: {
          subscriptionId: '21983',
          templateId: 'qo2-data-excel'
        },
        description: 'Generate QO2 Excel export'
      }
    ],
    expectedOutcome: 'All report types generated with appropriate content and formatting'
  },
  {
    id: 'api-mode-switching',
    name: 'Test API Mode Switching',
    description: 'Test switching between mock and live API modes',
    steps: [
      {
        tool: 'tms_facilitator_login',
        params: {
          email: 'facilitator@example.com',
          password: 'TestPassword123!'
        },
        description: 'Login in mock mode'
      },
      {
        tool: 'tms_get_dashboard_subscriptions',
        params: {},
        description: 'Get subscriptions from mock API'
      },
      // Note: Actual mode switching would be done via admin interface
      // This scenario tests that the same tools work in both modes
    ],
    expectedOutcome: 'Same API calls work seamlessly in both mock and live modes'
  }
];

/**
 * Get scenario by ID
 */
export function getScenario(id: string): TestScenario | undefined {
  return TMS_TEST_SCENARIOS.find(scenario => scenario.id === id);
}

/**
 * Get scenarios by category
 */
export function getScenariosByCategory(category: string): TestScenario[] {
  // Categories could be derived from scenario IDs or tags
  const categoryMap: Record<string, string[]> = {
    'assessment': ['complete-tmp-assessment', 'qo2-assessment-flow', 'team-signals-traffic-lights'],
    'navigation': ['workflow-navigation'],
    'reports': ['report-generation-all-types'],
    'access': ['test-access-control'],
    'integration': ['api-mode-switching']
  };

  return TMS_TEST_SCENARIOS.filter(scenario => 
    categoryMap[category]?.includes(scenario.id) || false
  );
}

/**
 * Execute a test scenario (for automated testing)
 */
export async function executeScenario(
  scenarioId: string,
  toolExecutor: (tool: string, params: any) => Promise<any>
): Promise<{
  success: boolean;
  results: Array<{ step: string; result: any; error?: any }>;
}> {
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  const results: Array<{ step: string; result: any; error?: any }> = [];
  let success = true;

  for (const step of scenario.steps) {
    try {
      const result = await toolExecutor(step.tool, step.params);
      results.push({
        step: step.description,
        result
      });
    } catch (error) {
      success = false;
      results.push({
        step: step.description,
        result: null,
        error
      });
      // Continue execution to see all failures
    }
  }

  return { success, results };
}