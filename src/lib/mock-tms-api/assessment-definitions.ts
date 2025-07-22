/**
 * Assessment Definitions for TMS Mock API
 * Defines the structure and behavior of TMP, QO2, and Team Signals assessments
 */

export type AssessmentType = 'TMP' | 'QO2' | 'TeamSignals';
export type AnswerFormat = 'preference-score' | 'index-based' | 'text-based';

export interface AssessmentDefinition {
  workflowId: string;
  name: string;
  baseContentId: number;
  assessmentType: AssessmentType;
  questionType: number;
  validationType: string;
  totalPages: number;
  questionsPerPage: number;
  answerFormat: AnswerFormat;
  listOptions?: string[];
  sections?: AssessmentSection[];
}

export interface AssessmentSection {
  sectionId: number;
  name: string;
  pages: number[];
}

// Assessment definitions based on recorded API flows
export const ASSESSMENT_DEFINITIONS: Record<string, AssessmentDefinition> = {
  'tmp-workflow': {
    workflowId: 'tmp-workflow',
    name: 'Team Management Profile',
    baseContentId: 3,
    assessmentType: 'TMP',
    questionType: 18, // Seesaw format
    validationType: 'Seesaw',
    totalPages: 12,
    questionsPerPage: 5,
    answerFormat: 'preference-score',
    sections: [
      { sectionId: 2, name: 'Section 1', pages: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] }
    ]
  },
  'qo2-workflow': {
    workflowId: 'qo2-workflow',
    name: 'Opportunities-Obstacles Quotient',
    baseContentId: 5,
    assessmentType: 'QO2',
    questionType: 16, // Multiple Choice
    validationType: 'MultipleChoice',
    totalPages: 10,
    questionsPerPage: 5,
    answerFormat: 'text-based',
    sections: [
      { sectionId: 93, name: 'Overview', pages: [408] },
      { sectionId: 85, name: 'Main Questions', pages: [388, 389, 390, 391, 392, 393, 394, 395, 396, 397] }
    ]
  },
  'team-signals-workflow': {
    workflowId: 'team-signals-workflow',
    name: 'Team Signals',
    baseContentId: 12,
    assessmentType: 'TeamSignals',
    questionType: 16, // Likert scale
    validationType: 'MultipleChoice',
    totalPages: 7,
    questionsPerPage: 5,
    answerFormat: 'text-based',
    listOptions: [
      'Strongly Agree',
      'Mostly Agree',
      'Mostly Disagree',
      'Strongly Disagree'
    ],
    sections: [
      { sectionId: 13, name: 'Team Health', pages: [97, 98, 99, 100, 101, 102, 103] }
    ]
  }
};

// Question templates for each assessment type
export const TMP_QUESTION_PAIRS = [
  { statementA: "I find talking things over with others helps me come to decisions", statementB: "I prefer to be left alone to come to decisions" },
  { statementA: "I actively search out theories", statementB: "I'm a practical person and I don't spend much time theorising" },
  { statementA: "I probably take longer than others to make decisions because I like to gather as much information as possible", statementB: "I am probably quicker to make decisions than others as I like to see action and results" },
  { statementA: "On balance I am more outgoing", statementB: "On balance I am more quiet" },
  { statementA: "Logical analysis comes first with me", statementB: "People's feelings come first with me" },
  { statementA: "I try to keep my working life and my personal life separate", statementB: "My work and personal life tend to overlap" },
  { statementA: "I prefer work that is constantly changing", statementB: "I prefer a more stable work environment" },
  { statementA: "I prefer to work to defined standards", statementB: "I prefer to set my own standards" },
  { statementA: "I tend to take most things seriously", statementB: "I tend to see the lighter side of things" },
  { statementA: "I like to have things decided", statementB: "I like to keep my options open" }
];

export const QO2_QUESTIONS = [
  "I actively seek out new opportunities at work",
  "I tend to focus on potential obstacles before taking action",
  "I find multiple ways to achieve my goals",
  "I am energized by challenges",
  "I worry about what might go wrong",
  "I see setbacks as learning opportunities",
  "I prefer to stick with proven methods",
  "I am optimistic about future outcomes",
  "I thoroughly analyze risks before proceeding",
  "I adapt quickly to changing circumstances"
];

export const TEAM_SIGNALS_QUESTIONS = [
  "There are clear lines of accountability and authority",
  "We regularly question our way of working",
  "Team members are clear about the team's objectives",
  "We have effective processes for making decisions",
  "Team members trust each other",
  "We handle conflict constructively",
  "Information flows freely within the team",
  "We celebrate our successes",
  "Team members feel valued for their contributions",
  "We learn from our mistakes"
];

// Helper function to get assessment definition by subscription workflow
export function getAssessmentByWorkflow(workflowId: string): AssessmentDefinition | undefined {
  return ASSESSMENT_DEFINITIONS[workflowId];
}

// Helper function to get assessment definition by base content ID
export function getAssessmentByBaseContentId(baseContentId: number): AssessmentDefinition | undefined {
  return Object.values(ASSESSMENT_DEFINITIONS).find(def => def.baseContentId === baseContentId);
}