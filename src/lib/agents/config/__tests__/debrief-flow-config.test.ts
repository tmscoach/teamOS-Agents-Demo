/**
 * Tests for DebriefAgent flow configuration
 */

import { SIMPLIFIED_AGENT_CONFIGS } from '../simplified-agent-configs';

describe('DebriefAgent Flow Configuration', () => {
  const debriefConfig = SIMPLIFIED_AGENT_CONFIGS.DebriefAgent;
  
  describe('Flow States', () => {
    it('should have report_check as initial state', () => {
      const reportCheckState = debriefConfig.flowConfig.states.find(
        state => state.name === 'report_check'
      );
      
      expect(reportCheckState).toBeDefined();
      expect(reportCheckState?.objectives).toContain('Check dashboard subscriptions');
    });

    it('should have all TMP-specific states', () => {
      const tmpStates = [
        'tmp_report_load',
        'tmp_profile_display',
        'tmp_objectives',
        'tmp_highlights',
        'tmp_communication',
        'tmp_support',
        'tmp_summary'
      ];
      
      tmpStates.forEach(stateName => {
        const state = debriefConfig.flowConfig.states.find(s => s.name === stateName);
        expect(state).toBeDefined();
      });
    });

    it('should have correct TMP state outputs', () => {
      const tmpObjectivesState = debriefConfig.flowConfig.states.find(
        s => s.name === 'tmp_objectives'
      );
      
      expect(tmpObjectivesState?.key_outputs).toContain('objectives');
      expect(tmpObjectivesState?.duration).toBe('2 minutes');
    });

    it('should have all QO2-specific states', () => {
      const qo2States = [
        'qo2_report_load',
        'qo2_culture_review',
        'qo2_action_planning'
      ];
      
      qo2States.forEach(stateName => {
        const state = debriefConfig.flowConfig.states.find(s => s.name === stateName);
        expect(state).toBeDefined();
      });
    });

    it('should have all Team Signals-specific states', () => {
      const tsStates = [
        'ts_report_load',
        'ts_metrics_review',
        'ts_priority_setting'
      ];
      
      tsStates.forEach(stateName => {
        const state = debriefConfig.flowConfig.states.find(s => s.name === stateName);
        expect(state).toBeDefined();
      });
    });

    it('should have debrief_complete state with journey update', () => {
      const completeState = debriefConfig.flowConfig.states.find(
        s => s.name === 'debrief_complete'
      );
      
      expect(completeState).toBeDefined();
      expect(completeState?.objectives).toContain('Update journey tracker');
      expect(completeState?.key_outputs).toContain('journey_updated');
    });
  });

  describe('Flow Transitions', () => {
    it('should start with report check', () => {
      const startTransition = debriefConfig.flowConfig.transitions.find(
        t => t.from === 'START' && t.to === 'report_check'
      );
      
      expect(startTransition).toBeDefined();
      expect(startTransition?.action).toBe('check_available_reports');
    });

    it('should have correct TMP flow sequence', () => {
      const tmpFlow = [
        { from: 'debrief_intro', to: 'tmp_report_load' },
        { from: 'tmp_report_load', to: 'tmp_profile_display' },
        { from: 'tmp_profile_display', to: 'tmp_objectives' },
        { from: 'tmp_objectives', to: 'tmp_highlights' },
        { from: 'tmp_highlights', to: 'tmp_communication' },
        { from: 'tmp_communication', to: 'tmp_support' },
        { from: 'tmp_support', to: 'tmp_summary' },
        { from: 'tmp_summary', to: 'interactive_qa' }
      ];
      
      tmpFlow.forEach(({ from, to }) => {
        const transition = debriefConfig.flowConfig.transitions.find(
          t => t.from === from && t.to === to
        );
        expect(transition).toBeDefined();
      });
    });

    it('should have branching based on assessment type', () => {
      const branches = [
        { condition: 'tmp_selected', to: 'tmp_report_load' },
        { condition: 'qo2_selected', to: 'qo2_report_load' },
        { condition: 'team_signals_selected', to: 'ts_report_load' }
      ];
      
      branches.forEach(({ condition, to }) => {
        const transition = debriefConfig.flowConfig.transitions.find(
          t => t.from === 'debrief_intro' && t.to === to && t.condition === condition
        );
        expect(transition).toBeDefined();
      });
    });

    it('should end with debrief completion', () => {
      const endTransition = debriefConfig.flowConfig.transitions.find(
        t => t.from === 'interactive_qa' && t.to === 'debrief_complete'
      );
      
      expect(endTransition).toBeDefined();
      expect(endTransition?.condition).toBe('no_more_questions');
    });
  });

  describe('Extraction Rules', () => {
    it('should have TMP-specific extraction rules', () => {
      const tmpRules = ['objectives', 'highlights', 'communication', 'support'];
      
      tmpRules.forEach(rule => {
        expect(debriefConfig.extractionRules[rule]).toBeDefined();
        expect(debriefConfig.extractionRules[rule].description).toContain('TMP');
      });
    });

    it('should have correct patterns for TMP variables', () => {
      const objectivesRule = debriefConfig.extractionRules.objectives;
      
      expect(objectivesRule.patterns).toContain(
        "(?:objectives are|my objectives are|goals include|my goals are)\\s+(.+)"
      );
      expect(objectivesRule.type).toBe('string');
    });

    it('should have QO2-specific extraction rules', () => {
      const qo2Rules = ['culture_type', 'alignment_gaps', 'culture_actions'];
      
      qo2Rules.forEach(rule => {
        expect(debriefConfig.extractionRules[rule]).toBeDefined();
      });
    });

    it('should have Team Signals-specific extraction rules', () => {
      const tsRules = ['team_strengths', 'improvement_areas', 'priority_actions'];
      
      tsRules.forEach(rule => {
        expect(debriefConfig.extractionRules[rule]).toBeDefined();
      });
    });

    it('should have debrief_completed flag', () => {
      expect(debriefConfig.extractionRules.debrief_completed).toBeDefined();
      expect(debriefConfig.extractionRules.debrief_completed.type).toBe('boolean');
    });
  });

  describe('System Prompt', () => {
    it('should include proactive report detection instructions', () => {
      expect(debriefConfig.systemPrompt).toContain('CRITICAL: Proactive Report Detection');
      expect(debriefConfig.systemPrompt).toContain('tms_get_dashboard_subscriptions');
    });

    it('should include instructions for all assessment types', () => {
      expect(debriefConfig.systemPrompt).toContain('TMP');
      expect(debriefConfig.systemPrompt).toContain('Team Signals');
      expect(debriefConfig.systemPrompt).toContain('QO2');
    });
  });
});