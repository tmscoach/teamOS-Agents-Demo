/**
 * Mock Summary Report Generators
 * Generates condensed HTML summary reports for different assessment types
 */

import type { MockSubscription } from './mock-data-store';
import { WorkflowStateManager } from './workflow-state-manager';
import * as fs from 'fs';
import * as path from 'path';

const workflowStateManager = WorkflowStateManager.getInstance();

/**
 * Calculate TMP results from questionnaire answers (reused from report-generators)
 */
function calculateTMPResults(answers: Record<number, string>) {
  // TMP roles mapping
  const tmpRoles = [
    { role: 'Creator Innovator', code: 'cre_inn' },
    { role: 'Explorer Promoter', code: 'exp_pro' },
    { role: 'Assessor Developer', code: 'ass_dev' },
    { role: 'Thruster Organizer', code: 'thr_org' },
    { role: 'Concluder Producer', code: 'con_pro' },
    { role: 'Controller Inspector', code: 'con_ins' },
    { role: 'Upholder Maintainer', code: 'uph_mai' },
    { role: 'Reporter Adviser', code: 'rep_adv' }
  ];
  
  // Simple scoring logic for MVP
  const roleScores = [0, 0, 0, 0, 0, 0, 0, 0];
  
  // Map answers to role scores (simplified for MVP)
  Object.entries(answers).forEach(([questionId, value]) => {
    const qId = parseInt(questionId);
    const answer = parseInt(value) || 0;
    
    // Distribute scores based on question ranges (simplified)
    if (qId >= 1 && qId <= 10) {
      roleScores[Math.floor((qId - 1) % 8)] += answer;
    } else if (qId >= 11 && qId <= 20) {
      roleScores[Math.floor((qId - 11) % 8)] += answer;
    } else {
      roleScores[qId % 8] += answer;
    }
  });
  
  // Find major role and related roles
  const scoredRoles = roleScores.map((score, index) => ({
    score,
    index,
    role: tmpRoles[index].role,
    code: tmpRoles[index].code
  })).sort((a, b) => b.score - a.score);
  
  // Default to Upholder Maintainer if no answers
  if (scoredRoles[0].score === 0) {
    return {
      majorRole: 'Upholder Maintainer',
      majorRoleCode: 'uph_mai',
      relatedRole1: 'Controller Inspector',
      relatedRole1Code: 'con_ins',
      relatedRole2: 'Thruster Organizer',
      relatedRole2Code: 'thr_org',
      majorRoleScore: 8,
      relatedRole1Score: 7,
      relatedRole2Score: 5,
      workPreferences: {
        Advising: 10,
        Innovating: 9,
        Promoting: 11,
        Developing: 8,
        Organising: 14,
        Producing: 14,
        Inspecting: 15,
        Maintaining: 19
      }
    };
  }
  
  // Calculate work preferences (simplified)
  const workPreferences = {
    Advising: Math.round(10 + (roleScores[7] / 10)),
    Innovating: Math.round(9 + (roleScores[0] / 10)),
    Promoting: Math.round(11 + (roleScores[1] / 10)),
    Developing: Math.round(8 + (roleScores[2] / 10)),
    Organising: Math.round(14 + (roleScores[3] / 10)),
    Producing: Math.round(14 + (roleScores[4] / 10)),
    Inspecting: Math.round(15 + (roleScores[5] / 10)),
    Maintaining: Math.round(19 + (roleScores[6] / 10))
  };
  
  return {
    majorRole: scoredRoles[0].role,
    majorRoleCode: scoredRoles[0].code,
    relatedRole1: scoredRoles[1].role,
    relatedRole1Code: scoredRoles[1].code,
    relatedRole2: scoredRoles[2].role,
    relatedRole2Code: scoredRoles[2].code,
    majorRoleScore: Math.max(1, Math.min(10, Math.round(scoredRoles[0].score / 5))),
    relatedRole1Score: Math.max(1, Math.min(10, Math.round(scoredRoles[1].score / 5))),
    relatedRole2Score: Math.max(1, Math.min(10, Math.round(scoredRoles[2].score / 5))),
    workPreferences
  };
}

/**
 * Load HTML template and replace placeholders
 */
function loadTemplate(templateName: string, replacements: Record<string, string>): string {
  const templatePath = path.join(process.cwd(), 'src/lib/mock-tms-api/report-templates', `${templateName}.html`);
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace all placeholders
  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return template;
}

/**
 * Generate HTML summary based on assessment type
 */
export async function generateHTMLSummary(subscription: MockSubscription, templateId: string = '6'): Promise<string> {
  // Get workflow state to include answers in report
  const state = workflowStateManager.getOrCreateWorkflowState(
    subscription.subscriptionId,
    subscription.workflowId,
    subscription.baseContentId
  );
  
  switch (subscription.assessmentType) {
    case 'TMP':
      return generateTMPSummary(subscription, state, templateId);
    case 'QO2':
      return generateQO2Summary(subscription, state, templateId);
    case 'TeamSignals':
      return generateTeamSignalsSummary(subscription, state, templateId);
    case 'WOW':
      // For now, return simple summary for WOW
      return generateGenericSummary(subscription, 'Ways of Working');
    case 'LLP':
      // For now, return simple summary for LLP
      return generateGenericSummary(subscription, 'Linking Leader Profile');
    default:
      throw new Error(`Unknown assessment type: ${subscription.assessmentType}`);
  }
}

/**
 * Generate TMP (Team Management Profile) HTML summary
 */
function generateTMPSummary(subscription: MockSubscription, state: any, templateId: string): string {
  // Get user to access respondent name
  const { mockDataStore } = require('./mock-data-store');
  const user = mockDataStore.getUser(subscription.userId);
  
  // Calculate TMP results
  const tmpResults = calculateTMPResults(state.answers);
  
  // Calculate net scores for the profile
  // Show only the dominant trait from each pair with net difference
  // E/I pair: Introvert wins (22-15=7)
  // P/C pair: Creative wins (22-19=3)  
  // A/B pair: Beliefs wins (22-17=5)
  // S/F pair: Structured wins (23-14=9)
  const netScores = {
    I: 7,  // Introvert net score
    C: 3,  // Creative net score
    B: 5,  // Beliefs net score
    S: 9   // Structured net score
  };
  
  // Use the fragment template that matches TMS API exactly
  const replacements = {
    BASE_URL: 'https://api-test.tms.global',
    MAJOR_ROLE: tmpResults.majorRole,
    RELATED_ROLE_1: tmpResults.relatedRole1,
    RELATED_ROLE_2: tmpResults.relatedRole2,
    MAJOR_ROLE_SCORE: tmpResults.majorRoleScore.toString(),
    RELATED_ROLE_1_SCORE: tmpResults.relatedRole1Score.toString(),
    RELATED_ROLE_2_SCORE: tmpResults.relatedRole2Score.toString(),
    NET_SCORES: `I:${netScores.I} C:${netScores.C} B:${netScores.B} S:${netScores.S}`
  };
  
  // Return just the HTML fragment like the TMS API does
  return loadTemplate('tmp-summary-fragment', replacements);
}

/**
 * Generate QO2 (Opportunities-Obstacles Quotient) HTML summary
 */
function generateQO2Summary(subscription: MockSubscription, state: any, templateId: string): string {
  // Mock QO2 scores for summary
  const gva = 38;
  const pav = 33;
  const ov = 48;
  const tv = 70;
  const povn = 53;
  const opportunityScore = 65;
  const obstacleScore = 35;
  const qo2Score = 1.86; // Opportunity/Obstacle ratio
  
  const replacements = {
    BASE_URL: 'https://api-test.tms.global',
    GVA_SCORE: gva.toString(),
    PAV_SCORE: pav.toString(),
    OV_SCORE: ov.toString(),
    TV_SCORE: tv.toString(),
    POVN_SCORE: povn.toString(),
    OPPORTUNITY_SCORE: opportunityScore.toString(),
    OBSTACLE_SCORE: obstacleScore.toString(),
    QO2_SCORE: qo2Score.toFixed(2),
    PRIMARY_FOCUS: 'Opportunity-Focused'
  };
  
  // Return just the HTML fragment like the TMS API does
  return loadTemplate('qo2-summary-fragment', replacements);
}

/**
 * Generate Team Signals HTML summary
 */
function generateTeamSignalsSummary(subscription: MockSubscription, state: any, templateId: string): string {
  // Get organization name
  const { mockDataStore } = require('./mock-data-store');
  const org = mockDataStore.getOrganization(subscription.organizationId);
  const organizationName = org?.name || 'Test Organization';
  
  // Mock team health scores and determine colors
  const scores = [75, 45, 68, 72, 38, 42, 65, 71];
  const colors = scores.map(score => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
  });
  const signalColors = colors.join('|');
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  const replacements = {
    BASE_URL: 'https://api-test.tms.global',
    SIGNAL_COLORS: signalColors,
    TEAM_NAME: organizationName,
    OVERALL_SCORE: overallScore.toString(),
    TOP_STRENGTH: 'Collaboration',
    TOP_OPPORTUNITY: 'Innovation'
  };
  
  // Return just the HTML fragment like the TMS API does
  return loadTemplate('team-signals-summary-fragment', replacements);
}

/**
 * Generate generic summary for assessments without specific templates
 */
function generateGenericSummary(subscription: MockSubscription, assessmentName: string): string {
  const { mockDataStore } = require('./mock-data-store');
  const user = mockDataStore.getUser(subscription.userId);
  const respondentName = user?.respondentName || `${user?.firstName} ${user?.lastName}` || 'Test User';
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2>${assessmentName} Summary</h2>
      <h3>${respondentName}</h3>
      <p>Assessment completed on ${new Date().toLocaleDateString()}</p>
      <p style="color: #666;">Full summary template coming soon.</p>
    </div>
  `;
}

/**
 * Generate work preferences bar chart HTML
 */
function generateWorkPreferencesHTML(preferences: Record<string, number>): string {
  const colors = {
    Advising: '#009a66',
    Innovating: '#9acc66',
    Promoting: '#fff200',
    Developing: '#f9a139',
    Organising: '#ec008b',
    Producing: '#9a5ba4',
    Inspecting: '#007ac1',
    Maintaining: '#00aee5'
  };
  
  let html = '<div style="width: 100%;">';
  
  for (const [key, value] of Object.entries(preferences)) {
    const color = colors[key as keyof typeof colors] || '#666';
    html += `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div style="width: 100px; font-size: 14px;">${key}</div>
        <div style="flex: 1; background: #f0f0f0; height: 20px; position: relative;">
          <div style="background: ${color}; height: 100%; width: ${value}%; position: absolute; left: 0; top: 0;"></div>
          <span style="position: absolute; right: 5px; top: 0; line-height: 20px; font-size: 12px;">${value}%</span>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

/**
 * Get key characteristics based on major role
 */
function getKeyCharacteristics(majorRole: string): string {
  const characteristics: Record<string, string[]> = {
    'Creator Innovator': [
      'Strong creative and innovative thinking',
      'Enjoys developing new ideas and concepts',
      'Prefers flexible and unstructured environments'
    ],
    'Explorer Promoter': [
      'Excellent at networking and building relationships',
      'Enthusiastic about exploring new opportunities',
      'Natural communicator and influencer'
    ],
    'Assessor Developer': [
      'Analytical approach to problem-solving',
      'Focused on developing practical solutions',
      'Balanced between ideas and implementation'
    ],
    'Thruster Organizer': [
      'Action-oriented and results-focused',
      'Strong organizational and planning skills',
      'Drives projects forward with determination'
    ],
    'Concluder Producer': [
      'Detail-oriented and quality-focused',
      'Ensures tasks are completed to high standards',
      'Reliable and consistent in delivery'
    ],
    'Controller Inspector': [
      'Strong focus on control and quality',
      'Systematic approach to work',
      'Ensures compliance with standards and procedures'
    ],
    'Upholder Maintainer': [
      'Strong sense of values and principles',
      'Maintains team harmony and relationships',
      'Reliable supporter of team standards'
    ],
    'Reporter Adviser': [
      'Excellent at gathering and sharing information',
      'Provides valuable advice based on facts',
      'Strong research and analytical skills'
    ]
  };
  
  const items = characteristics[majorRole] || [
    'Strong preference for ' + majorRole + ' activities',
    'Effective team contributor',
    'Values quality and continuous improvement'
  ];
  
  return items.map(item => `<li>${item}</li>`).join('\n      ');
}

/**
 * Get QO2 category based on score
 */
function getQO2Category(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'High';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Developing';
  return 'Low';
}