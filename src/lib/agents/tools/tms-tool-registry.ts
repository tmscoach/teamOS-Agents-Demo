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
          description: 'Password for the facilitator account (optional if ClerkUserId provided)'
        },
        clerkUserId: {
          type: 'string',
          description: 'Clerk user ID for password-less authentication'
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
      required: ['email', 'firstName', 'lastName', 'organizationName'] // password or clerkUserId required
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

  tms_create_respondent: {
    name: 'tms_create_respondent',
    description: 'Create respondent account in TMS Global without password (Clerk integration)',
    category: 'onboarding',
    endpoint: '/api/v1/auth/create-respondent',
    method: 'POST',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address for the respondent account'
        },
        firstName: {
          type: 'string',
          description: 'First name of the respondent'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the respondent'
        },
        organizationId: {
          type: 'string',
          description: 'Organization ID the respondent belongs to'
        },
        clerkUserId: {
          type: 'string',
          description: 'Clerk user ID for password-less authentication'
        },
        respondentName: {
          type: 'string',
          description: 'Optional display name for the respondent'
        }
      },
      required: ['email', 'firstName', 'lastName', 'organizationId', 'clerkUserId']
    }
  },

  tms_create_facilitator: {
    name: 'tms_create_facilitator',
    description: 'Create facilitator account in TMS Global without password (Clerk integration)',
    category: 'onboarding',
    endpoint: '/api/v1/auth/create-facilitator',
    method: 'POST',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address for the facilitator account'
        },
        firstName: {
          type: 'string',
          description: 'First name of the facilitator'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the facilitator'
        },
        organizationId: {
          type: 'string',
          description: 'Organization ID the facilitator belongs to'
        },
        clerkUserId: {
          type: 'string',
          description: 'Clerk user ID for password-less authentication'
        }
      },
      required: ['email', 'firstName', 'lastName', 'organizationId', 'clerkUserId']
    }
  },

  tms_token_exchange: {
    name: 'tms_token_exchange',
    description: 'Exchange Clerk user ID for TMS JWT token',
    category: 'onboarding',
    endpoint: '/api/v1/auth/token-exchange',
    method: 'POST',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        clerkUserId: {
          type: 'string',
          description: 'Clerk user ID to exchange for TMS JWT'
        }
      },
      required: ['clerkUserId']
    }
  },

  tms_respondent_login: {
    name: 'tms_respondent_login',
    description: 'Respondent/team member login to TMS Global',
    category: 'onboarding',
    endpoint: '/Authenticate',
    method: 'POST',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        respondentEmail: {
          type: 'string',
          description: 'Email address of the respondent'
        },
        respondentPassword: {
          type: 'string',
          description: 'Password for the respondent account'
        },
        mobileAppType: {
          type: 'string',
          description: 'Mobile app type (default: teamOS)',
          default: 'teamOS'
        }
      },
      required: ['respondentEmail', 'respondentPassword']
    }
  },

  // Assessment Tools (7)
  tms_assign_subscription: {
    name: 'tms_assign_subscription',
    description: 'Assign a workflow subscription to a user (facilitator or respondent)',
    category: 'assessment',
    endpoint: '/api/v1/subscriptions/assign',
    method: 'POST',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The user ID to assign the subscription to'
        },
        workflowId: {
          type: 'string',
          description: 'The workflow ID to assign (e.g., tmp-workflow, qo2-workflow)'
        },
        organizationId: {
          type: 'string',
          description: 'The organization ID (must match the facilitator\'s organization)'
        }
      },
      required: ['userId', 'workflowId', 'organizationId']
    }
  },

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
    description: 'Get dashboard subscriptions (all for facilitators, own for respondents)',
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
  tms_generate_html_report: {
    name: 'tms_generate_html_report',
    description: 'Generate HTML report for a completed assessment',
    category: 'debrief',
    endpoint: '/Subscription/GetHTMLView/{templateId}/{subscriptionId}',
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

  tms_generate_graph: {
    name: 'tms_generate_graph',
    description: 'Generate PNG graph/chart for reports',
    category: 'debrief',
    endpoint: '/GetGraph',
    method: 'GET',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        chartType: {
          type: 'string',
          description: 'Type of chart to generate (e.g., CreateTMPQWheel, CreateQO2Model, CreateTeamSignals)',
          enum: ['CreateTMPQWheel', 'CreateTMPQRido', 'CreateTMPQIntroWheel', 'CreateTMPQPreferenceWheel', 
                 'CreateTMPQRidoSummary', 'CreateQO2Model', 'CreateComparisonChart', 'CreatePercentageBar', 
                 'CreateTeamSignals']
        },
        params: {
          type: 'object',
          description: 'Chart-specific parameters',
          additionalProperties: true
        }
      },
      required: ['chartType']
    }
  },

  tms_debrief_report: {
    name: 'tms_debrief_report',
    description: 'Interactive debrief of assessment report with Q&A capability',
    category: 'debrief',
    endpoint: '/api/v1/tms/debrief-report',
    method: 'POST',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: {
          type: 'string',
          description: 'The subscription ID for the completed assessment'
        },
        query: {
          type: 'string',
          description: 'User question about the report (e.g., "What does my wheel mean?", "Explain my scores")'
        },
        context: {
          type: 'object',
          description: 'Optional context from conversation history',
          properties: {
            previousMessages: {
              type: 'array',
              description: 'Previous messages in the conversation',
              items: {
                type: 'object',
                properties: {
                  role: {
                    type: 'string',
                    enum: ['user', 'assistant']
                  },
                  content: {
                    type: 'string'
                  }
                }
              }
            },
            sessionId: {
              type: 'string',
              description: 'Session ID for conversation tracking'
            }
          }
        }
      },
      required: ['subscriptionId', 'query']
    }
  },

  // Reporting Tools (1) - Manager-specific reports
  tms_generate_team_signals_360: {
    name: 'tms_generate_team_signals_360',
    description: 'Generate Team Signals 360 report (aggregated team view) - PLACEHOLDER',
    category: 'reporting',
    endpoint: '/api/v1/reports/team-signals-360',
    method: 'POST',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        organizationId: {
          type: 'string',
          description: 'Organization ID'
        },
        teamId: {
          type: 'string',
          description: 'Team ID (optional, defaults to all teams)'
        },
        dateRange: {
          type: 'object',
          description: 'Date range for the report',
          properties: {
            start: { type: 'string', description: 'Start date (ISO format)' },
            end: { type: 'string', description: 'End date (ISO format)' }
          }
        }
      },
      required: ['organizationId']
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
      'tms_create_respondent',
      'tms_create_facilitator',
      'tms_token_exchange'
    ],
    'AssessmentAgent': [
      'tms_assign_subscription',
      'tms_get_workflow_process',
      'tms_update_workflow',
      'tms_get_question_actions',
      'tms_get_question_ids_with_actions',
      'tms_get_dashboard_subscriptions',
      'tms_start_workflow'
    ],
    'DebriefAgent': [
      'tms_generate_html_report',
      'tms_generate_graph',
      'tms_debrief_report'
    ],
    'ReportingAgent': [
      'tms_generate_html_report',
      'tms_generate_graph',
      'tms_generate_team_signals_360'
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