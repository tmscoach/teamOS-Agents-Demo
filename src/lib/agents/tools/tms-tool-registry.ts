/**
 * TMS Tool Registry
 * Defines all available TMS tools and their metadata
 */

export interface TMSToolDefinition {
  name: string;
  description: string;
  category: 'onboarding' | 'assessment' | 'debrief' | 'reporting';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth: boolean;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export const TMS_TOOL_REGISTRY: Record<string, TMSToolDefinition> = {
  // Onboarding Tools (3)
  tms_create_org: {
    name: 'tms_create_org',
    description: 'Create organization and facilitator account in TMS Global',
    category: 'onboarding',
    endpoint: '/api/v1/auth/signup',
    method: 'POST',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address for the facilitator account'
        },
        password: {
          type: 'string',
          description: 'Password for the facilitator account'
        },
        firstName: {
          type: 'string',
          description: 'First name of the facilitator'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the facilitator'
        },
        organizationName: {
          type: 'string',
          description: 'Name of the organization to create'
        },
        phoneNumber: {
          type: 'string',
          description: 'Optional phone number'
        }
      },
      required: ['email', 'password', 'firstName', 'lastName', 'organizationName']
    }
  },

  tms_facilitator_login: {
    name: 'tms_facilitator_login',
    description: 'Facilitator/team manager login to TMS Global',
    category: 'onboarding',
    endpoint: '/api/v1/auth/login',
    method: 'POST',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address of the facilitator'
        },
        password: {
          type: 'string',
          description: 'Password for the facilitator account'
        }
      },
      required: ['email', 'password']
    }
  },

  tms_check_user_permissions: {
    name: 'tms_check_user_permissions',
    description: 'Validate JWT token and get user permissions from TMS Global',
    category: 'onboarding',
    endpoint: '/api/v1/team-os/auth/validate',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // Assessment Tools (6)
  tms_get_workflow_process: {
    name: 'tms_get_workflow_process',
    description: 'Get current workflow state with questions for an assessment',
    category: 'assessment',
    endpoint: '/Workflow/Process/{subscriptionId}/{baseContentId}/{sectionId}/{pageId}',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the assessment'
        },
        baseContentId: {
          type: 'string',
          description: 'The base content ID'
        },
        sectionId: {
          type: 'string',
          description: 'The section ID'
        },
        pageId: {
          type: 'string',
          description: 'The page ID to retrieve'
        }
      },
      required: ['subscriptionId', 'baseContentId', 'sectionId', 'pageId']
    }
  },

  tms_update_workflow: {
    name: 'tms_update_workflow',
    description: 'Submit answers and update workflow progress',
    category: 'assessment',
    endpoint: '/Workflow/Update',
    method: 'POST',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the assessment'
        },
        pageId: {
          type: 'string',
          description: 'The page ID being submitted'
        },
        answers: {
          type: 'array',
          description: 'Array of question answers',
          items: {
            type: 'object',
            properties: {
              questionId: {
                type: 'string',
                description: 'The question ID'
              },
              answer: {
                type: 'any',
                description: 'The answer value'
              }
            }
          }
        }
      },
      required: ['subscriptionId', 'pageId', 'answers']
    }
  },

  tms_get_question_actions: {
    name: 'tms_get_question_actions',
    description: 'Check conditional logic for questions based on current answers',
    category: 'assessment',
    endpoint: '/Question/GetActions',
    method: 'POST',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the assessment'
        },
        pageId: {
          type: 'string',
          description: 'The current page ID'
        },
        answers: {
          type: 'object',
          description: 'Current answers object'
        }
      },
      required: ['subscriptionId', 'pageId', 'answers']
    }
  },

  tms_get_question_ids_with_actions: {
    name: 'tms_get_question_ids_with_actions',
    description: 'Get questions that have conditional logic on a specific page',
    category: 'assessment',
    endpoint: '/Question/GetQuestionIdsThatHaveActions/{pageId}',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to check for conditional questions'
        }
      },
      required: ['pageId']
    }
  },

  tms_get_dashboard_subscriptions: {
    name: 'tms_get_dashboard_subscriptions',
    description: 'Get user\'s assessment subscriptions (Respondent only)',
    category: 'assessment',
    endpoint: '/Respondent/GetDashboardSubscription',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  tms_start_workflow: {
    name: 'tms_start_workflow',
    description: 'Start or initialize an assessment workflow',
    category: 'assessment',
    endpoint: '/Workflow/Start/{workflowId}/{subscriptionId}',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'The workflow ID to start'
        },
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the assessment'
        }
      },
      required: ['workflowId', 'subscriptionId']
    }
  },

  // Debrief Tools (3)
  tms_get_report_summary: {
    name: 'tms_get_report_summary',
    description: 'Get HTML report summary for a completed assessment',
    category: 'debrief',
    endpoint: '/PageContent/GetSubscriptionSummary/{subscriptionId}',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the completed assessment'
        }
      },
      required: ['subscriptionId']
    }
  },

  tms_get_report_templates: {
    name: 'tms_get_report_templates',
    description: 'Get available report templates for an assessment',
    category: 'debrief',
    endpoint: '/Subscription/GetTemplates/{subscriptionId}',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the assessment'
        }
      },
      required: ['subscriptionId']
    }
  },

  tms_generate_subscription_report: {
    name: 'tms_generate_subscription_report',
    description: 'Generate PDF report for a completed assessment',
    category: 'debrief',
    endpoint: '/Subscription/GenerateReport/{subscriptionId}/{templateId}',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the completed assessment'
        },
        templateId: {
          type: 'string',
          description: 'The template ID to use for report generation'
        }
      },
      required: ['subscriptionId', 'templateId']
    }
  },

  // Reporting Tools (2)
  tms_generate_report: {
    name: 'tms_generate_report',
    description: 'Generate custom organization-wide reports',
    category: 'reporting',
    endpoint: '/api/v1/reports/generate',
    method: 'POST',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        organizationId: {
          type: 'string',
          description: 'The organization ID'
        },
        reportType: {
          type: 'string',
          description: 'Type of report to generate'
        },
        dateRange: {
          type: 'object',
          description: 'Optional date range for the report',
          properties: {
            start: {
              type: 'string',
              description: 'Start date (ISO format)'
            },
            end: {
              type: 'string',
              description: 'End date (ISO format)'
            }
          }
        },
        includeTeams: {
          type: 'array',
          description: 'Optional list of team IDs to include',
          items: {
            type: 'string'
          }
        },
        format: {
          type: 'string',
          enum: ['PDF', 'Excel'],
          description: 'Report format (default: PDF)'
        }
      },
      required: ['organizationId', 'reportType']
    }
  },

  tms_get_product_usage: {
    name: 'tms_get_product_usage',
    description: 'Get product usage analytics for the organization',
    category: 'reporting',
    endpoint: '/api/v1/reports/product-usage',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
};

/**
 * Get tools by category
 */
export function getToolsByCategory(category: TMSToolDefinition['category']): TMSToolDefinition[] {
  return Object.values(TMS_TOOL_REGISTRY).filter(tool => tool.category === category);
}

/**
 * Get tools by agent name (based on conventional mappings)
 */
export function getToolsForAgent(agentName: string): string[] {
  const agentToolMap: Record<string, string[]> = {
    'OnboardingAgent': [
      'tms_create_org',
      'tms_facilitator_login',
      'tms_check_user_permissions'
    ],
    'AssessmentAgent': [
      'tms_get_workflow_process',
      'tms_update_workflow',
      'tms_get_question_actions',
      'tms_get_question_ids_with_actions',
      'tms_get_dashboard_subscriptions',
      'tms_start_workflow'
    ],
    'DebriefAgent': [
      'tms_get_report_summary',
      'tms_get_report_templates',
      'tms_generate_subscription_report'
    ],
    'ReportingAgent': [
      'tms_generate_report',
      'tms_get_product_usage'
    ],
    'OrchestratorAgent': [], // No direct TMS tools
    'DiscoveryAgent': [],
    'AlignmentAgent': [],
    'LearningAgent': [],
    'NudgeAgent': [],
    'ProgressMonitor': [],
    'RecognitionAgent': []
  };

  return agentToolMap[agentName] || [];
}