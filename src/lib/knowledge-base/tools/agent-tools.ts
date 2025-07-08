import { AgentTool } from '../../agents/types';
import { KnowledgeBaseSearch } from '../retrieval/search';

export const knowledgeBaseTools: AgentTool[] = [
  {
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
    },
    execute: async (params: any) => {
      const search = new KnowledgeBaseSearch();
      
      try {
        const results = await search.search(params.query, {
          documentTypes: params.document_types,
          limit: params.limit || 5
        });
        
        await search.close();
        
        return {
          success: true,
          output: {
            results: results.map(r => ({
              content: r.content,
              source: r.source,
              relevance: r.relevance,
              citation: r.citation
            }))
          }
        };
      } catch (error) {
        await search.close();
        return {
          success: false,
          output: null,
          error: `Failed to search knowledge base: ${error}`
        };
      }
    }
  },
  
  {
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
    },
    execute: async (params: any) => {
      const search = new KnowledgeBaseSearch();
      
      try {
        const query = params.section 
          ? `${params.assessment_type} ${params.section}`
          : `${params.assessment_type} methodology overview`;
        
        const results = await search.search(query, {
          documentTypes: ['HANDBOOK'],
          limit: 3
        });
        
        await search.close();
        
        return {
          success: true,
          output: {
            assessment_type: params.assessment_type,
            methodology: results.map(r => ({
              content: r.content,
              source: r.source,
              citation: r.citation
            }))
          }
        };
      } catch (error) {
        await search.close();
        return {
          success: false,
          output: null,
          error: `Failed to retrieve assessment methodology: ${error}`
        };
      }
    }
  },
  
  {
    name: 'get_questionnaire_items',
    description: 'Retrieve questionnaire items with scoring information',
    parameters: {
      type: 'object',
      properties: {
        assessment_type: {
          type: 'string',
          enum: ['TMP', 'QO2', 'WoWV', 'LLP'],
          description: 'Assessment type'
        },
        category: {
          type: 'string',
          description: 'Question category (optional)'
        },
        question_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific question IDs to retrieve (optional)'
        }
      }
    },
    execute: async (params: any) => {
      const search = new KnowledgeBaseSearch();
      
      try {
        const items = await search.getQuestionnaireItems(
          params.assessment_type,
          params.category,
          params.question_ids
        );
        
        await search.close();
        
        return {
          success: true,
          output: {
            questionnaire_items: items
          }
        };
      } catch (error) {
        await search.close();
        return {
          success: false,
          output: null,
          error: `Failed to retrieve questionnaire items: ${error}`
        };
      }
    }
  },
  
  {
    name: 'search_intervention_strategies',
    description: 'Search for team intervention and transformation strategies',
    parameters: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          description: 'Description of the team scenario or challenge'
        },
        team_maturity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Team maturity level (optional)'
        }
      },
      required: ['scenario']
    },
    execute: async (params: any) => {
      const search = new KnowledgeBaseSearch();
      
      try {
        const query = `intervention strategies ${params.scenario} ${params.team_maturity || ''}`.trim();
        
        const results = await search.hybridSearch(
          query,
          ['intervention', 'strategy', 'transformation', params.scenario],
          {
            documentTypes: ['HANDBOOK', 'RESEARCH'],
            limit: 5
          }
        );
        
        await search.close();
        
        return {
          success: true,
          output: {
            strategies: results.map(r => ({
              content: r.content,
              source: r.source,
              relevance: r.relevance,
              citation: r.citation
            }))
          }
        };
      } catch (error) {
        await search.close();
        return {
          success: false,
          output: null,
          error: `Failed to search intervention strategies: ${error}`
        };
      }
    }
  },
  
  {
    name: 'get_benchmark_data',
    description: 'Retrieve benchmark data and research findings',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description: 'The metric or area to get benchmarks for'
        },
        industry: {
          type: 'string',
          description: 'Industry sector (optional)'
        }
      },
      required: ['metric']
    },
    execute: async (params: any) => {
      const search = new KnowledgeBaseSearch();
      
      try {
        const query = `benchmark data ${params.metric} ${params.industry || ''}`.trim();
        
        const results = await search.search(query, {
          documentTypes: ['RESEARCH', 'REPORT'],
          limit: 3
        });
        
        await search.close();
        
        return {
          success: true,
          output: {
            benchmarks: results.map(r => ({
              content: r.content,
              source: r.source,
              citation: r.citation
            }))
          }
        };
      } catch (error) {
        await search.close();
        return {
          success: false,
          output: null,
          error: `Failed to retrieve benchmark data: ${error}`
        };
      }
    }
  }
];