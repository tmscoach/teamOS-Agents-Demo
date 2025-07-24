/**
 * Test to verify DebriefAgent is properly registered in the chat route
 */

import { describe, it, expect } from '@jest/globals';
import * as implementations from '@/src/lib/agents/implementations';

describe('DebriefAgent Registration', () => {
  it('should export createDebriefAgent function', () => {
    expect(implementations.createDebriefAgent).toBeDefined();
    expect(typeof implementations.createDebriefAgent).toBe('function');
  });

  it('should create a DebriefAgent instance', async () => {
    const agent = await implementations.createDebriefAgent();
    expect(agent).toBeDefined();
    expect(agent.name).toBe('DebriefAgent');
  });

  it('should have knowledge base tools loaded', async () => {
    const agent = await implementations.createDebriefAgent();
    expect(agent.tools).toBeDefined();
    expect(agent.tools.length).toBeGreaterThan(0);
    
    // Check for specific knowledge base tools
    const toolNames = agent.tools.map(tool => tool.name);
    expect(toolNames).toContain('search_tms_knowledge');
    expect(toolNames).toContain('get_assessment_methodology');
  });

  it('should have TMS tools loaded', async () => {
    const agent = await implementations.createDebriefAgent();
    
    // Check for specific TMS tools
    const toolNames = agent.tools.map(tool => tool.name);
    expect(toolNames).toContain('tms_debrief_report');
    expect(toolNames).toContain('tms_generate_html_report');
  });

  it('should have proper instructions configured', async () => {
    const agent = await implementations.createDebriefAgent();
    
    // Check that instructions mention ICAF handling
    const instructions = agent.instructions({} as any);
    expect(instructions).toContain('ICAF');
    expect(instructions).toContain('search_tms_knowledge');
    expect(instructions).toContain('knowledge base');
  });
});