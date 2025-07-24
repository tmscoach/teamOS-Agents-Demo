/**
 * Mock Report Generators
 * Generates HTML reports for different assessment types
 */

// Import MockSubscription from mock-data-store where it's defined
import type { MockSubscription } from './mock-data-store';
import { WorkflowStateManager } from './workflow-state-manager';
import * as fs from 'fs';
import * as path from 'path';

const workflowStateManager = WorkflowStateManager.getInstance();

/**
 * Calculate TMP results from questionnaire answers
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
  // In production, this would use the actual TMP scoring algorithm
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
      // These are wheel rendering parameters, NOT TMS scores
      majorRoleScore: 85,    // For wheel visualization only
      relatedRole1Score: 70, // For wheel visualization only
      relatedRole2Score: 65  // For wheel visualization only
    };
  }
  
  return {
    majorRole: scoredRoles[0].role,
    majorRoleCode: scoredRoles[0].code,
    relatedRole1: scoredRoles[1].role,
    relatedRole1Code: scoredRoles[1].code,
    relatedRole2: scoredRoles[2].role,
    relatedRole2Code: scoredRoles[2].code,
    // These are wheel rendering parameters, NOT TMS scores
    majorRoleScore: Math.min(100, scoredRoles[0].score * 5),    // For wheel visualization only
    relatedRole1Score: Math.min(100, scoredRoles[1].score * 5), // For wheel visualization only
    relatedRole2Score: Math.min(100, scoredRoles[2].score * 5)  // For wheel visualization only
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
 * Generate HTML report based on assessment type and template
 */
export async function generateHTMLReport(subscription: MockSubscription, templateId: string): Promise<string> {
  // Get workflow state to include answers in report
  const state = workflowStateManager.getOrCreateWorkflowState(
    subscription.subscriptionId,
    subscription.workflowId,
    subscription.baseContentId
  );
  
  switch (subscription.assessmentType) {
    case 'TMP':
      return generateTMPReport(subscription, state, templateId);
    case 'QO2':
      return generateQO2Report(subscription, state, templateId);
    case 'TeamSignals':
      // Check if this is a 360 report based on templateId
      if (templateId === '360' || templateId === '3') {
        return generateTeamSignals360Report(subscription, state, templateId);
      }
      return generateTeamSignalsReport(subscription, state, templateId);
    case 'WOW':
      return generateWOWReport(subscription, state, templateId);
    case 'LLP':
      return generateLLPReport(subscription, state, templateId);
    default:
      throw new Error(`Unknown assessment type: ${subscription.assessmentType}`);
  }
}

/**
 * Generate TMP (Team Management Profile) HTML report
 */
function generateTMPReport(subscription: MockSubscription, state: any, templateId: string): string {
  const baseUrl = 'https://api-test.tms.global';
  
  // Get user to access respondent name
  const { mockDataStore } = require('./mock-data-store');
  const user = mockDataStore.getUser(subscription.userId);
  const respondentName = user?.respondentName || `${user?.firstName} ${user?.lastName}` || 'Test User';
  
  // Get organization name
  const org = mockDataStore.getOrganization(subscription.organizationId);
  const organizationName = org?.name || 'Test Organization';
  
  // In production, TMS Global calculates all scores and generates complete HTML
  // For this mock system, we simulate the calculation to test the debrief functionality
  const tmpResults = calculateTMPResults(state.answers);
    
  const replacements = {
    BASE_URL: baseUrl,
    RESPONDENT_NAME: respondentName,
    ORGANIZATION_NAME: organizationName,
    REPORT_DATE: new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    MAJOR_ROLE: tmpResults.majorRole,
    MAJOR_ROLE_CODE: tmpResults.majorRoleCode,
    RELATED_ROLE_1: tmpResults.relatedRole1,
    RELATED_ROLE_1_CODE: tmpResults.relatedRole1Code,
    RELATED_ROLE_2: tmpResults.relatedRole2,
    RELATED_ROLE_2_CODE: tmpResults.relatedRole2Code,
    MAJOR_ROLE_SCORE: tmpResults.majorRoleScore.toString(),
    RELATED_ROLE_1_SCORE: tmpResults.relatedRole1Score.toString(),
    RELATED_ROLE_2_SCORE: tmpResults.relatedRole2Score.toString()
  };
  
  return loadTemplate('tmp-report', replacements);
}

/**
 * Generate QO2 (Opportunities-Obstacles Quotient) HTML report
 */
function generateQO2Report(subscription: MockSubscription, state: any, templateId: string): string {
  const baseUrl = 'https://api-test.tms.global';
  
  // Get user to access respondent name
  const { mockDataStore } = require('./mock-data-store');
  const user = mockDataStore.getUser(subscription.userId);
  const respondentName = user?.respondentName || `${user?.firstName} ${user?.lastName}` || 'Test User';
  
  const replacements = {
    BASE_URL: baseUrl,
    RESPONDENT_NAME: respondentName,
    REPORT_DATE: new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
  };
  
  return loadTemplate('qo2-report', replacements);
}

/**
 * Generate Team Signals HTML report
 */
function generateTeamSignalsReport(subscription: MockSubscription, state: any, templateId: string): string {
  // Check if this is a 360 report request
  if (templateId === '360' || templateId === '3') {
    return generateTeamSignals360Report(subscription, state, templateId);
  }
  
  const baseUrl = 'https://api-test.tms.global';
  
  // Get organization name
  const { mockDataStore } = require('./mock-data-store');
  const org = mockDataStore.getOrganization(subscription.organizationId);
  const organizationName = org?.name || 'Test Organization';
  
  const replacements = {
    BASE_URL: baseUrl,
    TEAM_NAME: organizationName
  };
  
  return loadTemplate('team-signals-report', replacements);
}


/**
 * Generate Team Signals 360 HTML report (aggregated team view)
 */
function generateTeamSignals360Report(subscription: MockSubscription, state: any, templateId: string): string {
  const baseUrl = 'https://api-test.tms.global';
  
  // Get organization
  const { mockDataStore } = require('./mock-data-store');
  const org = mockDataStore.getOrganization(subscription.organizationId);
  
  // Get all team member subscriptions
  const allSubscriptions = mockDataStore.getAllSubscriptions()
    .filter((s: MockSubscription) => 
      s.organizationId === subscription.organizationId && 
      s.assessmentType === 'TeamSignals' &&
      s.status === 'completed'
    );
  
  // Build team member data with mock scores
  // In a real system, these would be calculated from actual questionnaire responses
  const mockTeamScores = [
    [56, 31, 75, 62, 38, 44, 56, 62], // Alice
    [62, 44, 81, 69, 44, 50, 62, 69], // Bob  
    [50, 25, 69, 56, 31, 38, 50, 56]  // Charlie
  ];
  
  const teamMembers = allSubscriptions.map((sub: MockSubscription, index: number) => {
    const user = mockDataStore.getUser(sub.userId);
    return {
      name: user?.respondentName || `${user?.firstName} ${user?.lastName}` || 'Team Member',
      scores: mockTeamScores[index % mockTeamScores.length]
    };
  });
  
  // Calculate averages - if no team members, use default scores
  let averages: number[];
  if (teamMembers.length === 0) {
    averages = [56, 33, 75, 62, 38, 44, 56, 62];
  } else {
    averages = [];
    for (let i = 0; i < 8; i++) {
      const sum = teamMembers.reduce((acc: number, member: any) => acc + member.scores[i], 0);
      averages.push(Math.round(sum / teamMembers.length));
    }
  }
  
  // Determine colors based on averages
  const colors = averages.map(score => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
  }).join('|');
  
  // Generate response ranges HTML
  const responseRangesHTML = generateResponseRanges(teamMembers, averages);
  
  // Generate individual responses table rows
  const individualResponsesHTML = generateIndividualResponses(teamMembers, averages);
  
  const replacements = {
    BASE_URL: baseUrl,
    TEAM_NAME: org?.name || 'Test Organization',
    GRAPH_COLORS: colors,
    MEMBER_COUNT: teamMembers.length.toString(),
    MEMBER_PLURAL: teamMembers.length === 1 ? '' : ' responses',
    AVG_SCORE_1: averages[0].toString(),
    AVG_SCORE_2: averages[1].toString(),
    AVG_SCORE_3: averages[2].toString(),
    AVG_SCORE_4: averages[3].toString(),
    AVG_SCORE_5: averages[4].toString(),
    AVG_SCORE_6: averages[5].toString(),
    AVG_SCORE_7: averages[6].toString(),
    AVG_SCORE_8: averages[7].toString()
  };
  
  return loadTemplate('team-signals-360-report', replacements);
}

/**
 * Generate response range visualization
 */
function generateResponseRanges(teamMembers: any[], averages: number[]): string {
  const questions = [
    'Who are we?',
    'Where are we now?',
    'Where are we going?',
    'How will we get there?',
    'What is expected of us?',
    'What support do we need?',
    'How effective are we?',
    'What recognition do we get?'
  ];
  
  let html = '';
  questions.forEach((question, index) => {
    const scores = teamMembers.map(member => member.scores[index]);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = averages[index];
    
    let color = 'pink';
    if (avg >= 75) color = 'green';
    else if (avg >= 50) color = 'orange';
    
    html += `
      <div style="margin-bottom: 20px;">
        <h5 style="margin-bottom: 8px;">${question}</h5>
        <div class="range-bar">
          <div class="range-fill ${color}" style="left: ${min}%; width: ${max - min}%;">
            ${avg}%
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
          <span>Min: ${min}%</span>
          <span>Average: ${avg}%</span>
          <span>Max: ${max}%</span>
        </div>
      </div>
    `;
  });
  
  return html;
}

/**
 * Generate individual responses table rows
 */
function generateIndividualResponses(teamMembers: any[], averages: number[]): string {
  let html = `
    <tr style="background-color: #e5e7eb;">
      <td><strong>Averages</strong></td>
      ${averages.map(avg => `<td><strong>${avg}%</strong></td>`).join('')}
    </tr>
  `;
  
  teamMembers.forEach(member => {
    html += `
      <tr>
        <td>${member.name}</td>
        ${member.scores.map((score: number) => `<td>${score}%</td>`).join('')}
      </tr>
    `;
  });
  
  return html;
}

/**
 * Generate WOW (Window on Work) HTML report - placeholder
 */
function generateWOWReport(subscription: MockSubscription, state: any, templateId: string): string {
  return `<html>
<head>
  <meta charset="utf-8">
  <title>Window on Work Profile</title>
</head>
<body>
  <h1>Window on Work Profile</h1>
  <p>This is a placeholder report for WOW assessment. Template ID: ${templateId}</p>
  <p>Subscription ID: ${subscription.subscriptionId}</p>
</body>
</html>`;
}

/**
 * Generate LLP (Linking Leader Profile) HTML report - placeholder
 */
function generateLLPReport(subscription: MockSubscription, state: any, templateId: string): string {
  return `<html>
<head>
  <meta charset="utf-8">
  <title>Linking Leader Profile</title>
</head>
<body>
  <h1>Linking Leader Profile</h1>
  <p>This is a placeholder report for LLP assessment. Template ID: ${templateId}</p>
  <p>Subscription ID: ${subscription.subscriptionId}</p>
</body>
</html>`;
}