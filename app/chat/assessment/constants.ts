// Assessment type constants
export const ASSESSMENT_TYPES = {
  TMP: 'TMP',
  QO2: 'QO2',
  TEAM_SIGNALS: 'Team Signals',
  TEAM_SIGNALS_ALT: 'TeamSignals'
} as const;

// Workflow ID mappings
export const WORKFLOW_ID_MAP: Record<string, string> = {
  [ASSESSMENT_TYPES.TMP]: 'tmp-workflow',
  [ASSESSMENT_TYPES.QO2]: 'qo2-workflow',
  [ASSESSMENT_TYPES.TEAM_SIGNALS]: 'team-signals-workflow',
  [ASSESSMENT_TYPES.TEAM_SIGNALS_ALT]: 'team-signals-workflow'
};

// Template ID mappings for report generation
export const TEMPLATE_ID_MAP: Record<string, string> = {
  [ASSESSMENT_TYPES.TMP]: '6',
  [ASSESSMENT_TYPES.QO2]: '10',
  [ASSESSMENT_TYPES.TEAM_SIGNALS]: '2'
};

// Assessment display names
export const ASSESSMENT_DISPLAY_NAMES: Record<string, string> = {
  [ASSESSMENT_TYPES.TMP]: 'Team Management Profile',
  [ASSESSMENT_TYPES.QO2]: 'Opportunities-Obstacles Quotient',
  [ASSESSMENT_TYPES.TEAM_SIGNALS]: 'Team Signals Assessment'
};

// Assessment descriptions
export const ASSESSMENT_DESCRIPTIONS: Record<string, string> = {
  [ASSESSMENT_TYPES.TMP]: 'Reveal work preferences and clarify how team roles impact organisational success.',
  [ASSESSMENT_TYPES.QO2]: 'Discover how you perceive opportunities and obstacles in your work environment.',
  [ASSESSMENT_TYPES.TEAM_SIGNALS]: 'Assess team dynamics and identify areas for improvement.'
};

// Assessment color themes
export const ASSESSMENT_COLORS: Record<string, string> = {
  [ASSESSMENT_TYPES.TMP]: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  [ASSESSMENT_TYPES.QO2]: 'bg-green-50 hover:bg-green-100 border-green-200',
  [ASSESSMENT_TYPES.TEAM_SIGNALS]: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
};

// Default debrief agent
export const DEFAULT_DEBRIEF_AGENT = 'DebriefAgent';