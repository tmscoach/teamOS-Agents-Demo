// Define the tools for voice debrief without importing DebriefAgent
// This avoids server-side module issues

export function getDebriefTools() {
  return [
    {
      type: 'function',
      name: 'search_tms_knowledge',
      description: 'Search the TMS knowledge base using natural language queries',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language search query'
          },
          document_types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['HANDBOOK', 'QUESTIONNAIRE', 'REPORT', 'RESEARCH']
            },
            description: 'Filter by document types (optional)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5)'
          }
        },
        required: ['query']
      }
    },
    {
      type: 'function',
      name: 'get_assessment_methodology',
      description: 'Retrieve specific assessment methodology details from TMS handbooks',
      parameters: {
        type: 'object',
        properties: {
          assessment_type: {
            type: 'string',
            enum: ['TMP', 'QO2', 'WoWV', 'LLP', 'HET'],
            description: 'The assessment type to retrieve'
          },
          section: {
            type: 'string',
            description: 'Specific section to retrieve (optional)'
          }
        },
        required: ['assessment_type']
      }
    },
    {
      type: 'function',
      name: 'search_report_chunks',
      description: 'Search through report content chunks for specific information',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          subscriptionId: {
            type: 'string',
            description: 'The subscription ID of the report - use the exact value from the Key Context section in your instructions, NOT placeholder values'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of chunks to return (default: 5)'
          }
        },
        required: ['query']
      }
    },
    {
      type: 'function',
      name: 'get_report_context',
      description: 'Get the full context and details of the user\'s assessment report including scores, roles, and key sections. ALWAYS call this first to get the report data.',
      parameters: {
        type: 'object',
        properties: {
          subscriptionId: {
            type: 'string',
            description: 'The subscription ID of the report - use the exact value from the Key Context section in your instructions, NOT placeholder values'
          },
          userId: {
            type: 'string',
            description: 'The user ID - use the exact value from the Key Context section in your instructions, NOT placeholder values'
          }
        },
        required: []
      }
    }
  ];
}