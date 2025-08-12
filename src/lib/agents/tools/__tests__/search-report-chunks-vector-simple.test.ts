// Simple test to verify the tool works without complex mocking
describe('searchReportChunksVector Tool', () => {
  it('exports createSearchReportChunksVectorTool function', () => {
    // Dynamic import to avoid module initialization issues
    const toolModule = jest.requireActual('../search-report-chunks-vector');
    expect(toolModule.createSearchReportChunksVectorTool).toBeDefined();
    expect(typeof toolModule.createSearchReportChunksVectorTool).toBe('function');
  });

  it('creates tool with correct metadata', () => {
    // Mock dependencies inline
    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({
        rpc: jest.fn()
      }))
    }));

    jest.doMock('@/lib/db', () => ({
      default: {
        userReport: {
          findFirst: jest.fn()
        }
      }
    }));

    const { createSearchReportChunksVectorTool } = jest.requireActual('../search-report-chunks-vector');
    const tool = createSearchReportChunksVectorTool();
    
    expect(tool.name).toBe('search_report_chunks_vector');
    expect(tool.description).toContain('Semantically search');
    expect(tool.parameters.properties).toHaveProperty('query');
    expect(tool.parameters.properties).toHaveProperty('similarity_threshold');
    expect(tool.parameters.properties).toHaveProperty('limit');
  });
});