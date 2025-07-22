/**
 * Report Generators for TMS Assessments
 * Generates realistic report content for TMP, QO2, and Team Signals assessments
 */

import { AssessmentType } from './assessment-definitions';
import { WorkflowState } from './workflow-state-manager';

export interface ReportContent {
  title: string;
  completedDate: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  insights: string[];
  recommendations: string[];
  detailedAnalysis: Record<string, any>;
  htmlContent: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'PDF' | 'Excel' | 'PowerPoint';
  assessmentType: AssessmentType;
}

export class ReportGenerator {
  /**
   * Generate report content based on assessment type and answers
   */
  static generateReport(
    assessmentType: AssessmentType,
    workflowState: WorkflowState,
    organizationName: string = 'Organization'
  ): ReportContent {
    switch (assessmentType) {
      case 'TMP':
        return this.generateTMPReport(workflowState, organizationName);
      case 'QO2':
        return this.generateQO2Report(workflowState, organizationName);
      case 'TeamSignals':
        return this.generateTeamSignalsReport(workflowState, organizationName);
      default:
        throw new Error(`Report generator not implemented for ${assessmentType}`);
    }
  }

  /**
   * Get available report templates for an assessment type
   */
  static getReportTemplates(assessmentType: AssessmentType): ReportTemplate[] {
    const templates: ReportTemplate[] = [
      {
        id: `${assessmentType.toLowerCase()}-standard-pdf`,
        name: `${assessmentType} Standard Report`,
        description: `Standard PDF report for ${assessmentType} assessment`,
        format: 'PDF',
        assessmentType
      },
      {
        id: `${assessmentType.toLowerCase()}-detailed-pdf`,
        name: `${assessmentType} Detailed Report`,
        description: `Detailed PDF report with extended analysis`,
        format: 'PDF',
        assessmentType
      }
    ];

    // Add Excel option for data-heavy assessments
    if (['TeamSignals', 'QO2'].includes(assessmentType)) {
      templates.push({
        id: `${assessmentType.toLowerCase()}-data-excel`,
        name: `${assessmentType} Data Export`,
        description: `Excel export with raw data and charts`,
        format: 'Excel',
        assessmentType
      });
    }

    return templates;
  }

  /**
   * Generate TMP (Team Management Profile) Report
   */
  private static generateTMPReport(
    workflowState: WorkflowState,
    organizationName: string
  ): ReportContent {
    const completedDate = workflowState.completedAt || new Date();
    
    // Calculate scores based on seesaw answers (0-40 scale)
    const answers = workflowState.answers;
    const categories = {
      'Work Preferences': [20, 21, 22, 23, 24],
      'Team Roles': [25, 26, 27, 28, 29],
      'Leadership Style': [30, 31, 32, 33, 34],
      'Decision Making': [35, 36, 37, 38, 39]
    };

    const categoryScores: Record<string, number> = {};
    let totalScore = 0;
    let questionCount = 0;

    Object.entries(categories).forEach(([category, questionIds]) => {
      let categorySum = 0;
      let categoryCount = 0;
      
      questionIds.forEach(qId => {
        const answer = answers[qId];
        if (answer) {
          // Convert seesaw value (e.g., "20", "12", "02") to percentage
          const leftValue = parseInt(answer.charAt(0)) || 0;
          const percentage = (leftValue / 4) * 100;
          categorySum += percentage;
          categoryCount++;
        }
      });

      if (categoryCount > 0) {
        categoryScores[category] = Math.round(categorySum / categoryCount);
        totalScore += categoryScores[category];
        questionCount++;
      }
    });

    const overallScore = questionCount > 0 ? Math.round(totalScore / questionCount) : 0;

    // Generate insights based on scores
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze work preferences
    const workPrefScore = categoryScores['Work Preferences'] || 0;
    if (workPrefScore > 75) {
      insights.push('Strong alignment with structured work environments and clear processes.');
      recommendations.push('Leverage preference for structure by implementing clear project frameworks.');
    } else if (workPrefScore < 25) {
      insights.push('Preference for flexible, adaptive work environments.');
      recommendations.push('Consider roles that allow for creativity and autonomous decision-making.');
    } else {
      insights.push('Balanced approach between structure and flexibility in work preferences.');
      recommendations.push('Develop skills to adapt between structured and flexible work contexts.');
    }

    // Analyze team roles
    const teamRoleScore = categoryScores['Team Roles'] || 0;
    if (teamRoleScore > 60) {
      insights.push('Natural tendency towards collaborative team roles.');
      recommendations.push('Consider leadership or coordination positions within team structures.');
    } else {
      insights.push('Preference for independent contributor roles.');
      recommendations.push('Focus on specialized expertise development and autonomous projects.');
    }

    // Generate HTML content
    const htmlContent = `
      <div class="tmp-report">
        <h1>Team Management Profile Report</h1>
        <div class="report-header">
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Completed Date:</strong> ${completedDate.toLocaleDateString()}</p>
          <p><strong>Overall Score:</strong> ${overallScore}%</p>
        </div>
        
        <h2>Category Scores</h2>
        <div class="scores-grid">
          ${Object.entries(categoryScores).map(([category, score]) => `
            <div class="score-item">
              <h3>${category}</h3>
              <div class="score-bar">
                <div class="score-fill" style="width: ${score}%"></div>
              </div>
              <p>${score}%</p>
            </div>
          `).join('')}
        </div>
        
        <h2>Key Insights</h2>
        <ul>
          ${insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
        
        <h2>Recommendations</h2>
        <ul>
          ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;

    return {
      title: 'Team Management Profile Report',
      completedDate: completedDate.toISOString(),
      overallScore,
      categoryScores,
      insights,
      recommendations,
      detailedAnalysis: {
        workPreferences: this.analyzeWorkPreferences(answers),
        teamRoles: this.analyzeTeamRoles(answers),
        leadershipStyle: this.analyzeLeadershipStyle(answers)
      },
      htmlContent
    };
  }

  /**
   * Generate QO2 (Opportunities-Obstacles Quotient) Report
   */
  private static generateQO2Report(
    workflowState: WorkflowState,
    organizationName: string
  ): ReportContent {
    const completedDate = workflowState.completedAt || new Date();
    
    // QO2 focuses on opportunity vs obstacle orientation
    const answers = workflowState.answers;
    
    // Calculate opportunity/obstacle balance
    let opportunityScore = 0;
    let obstacleScore = 0;
    let responseCount = 0;

    Object.entries(answers).forEach(([questionId, answer]) => {
      // For multiple choice questions, analyze based on response pattern
      const value = parseInt(answer) || 0;
      if (value > 0) {
        // Higher values indicate opportunity focus
        opportunityScore += value > 2 ? 1 : 0;
        obstacleScore += value <= 2 ? 1 : 0;
        responseCount++;
      }
    });

    const opportunityPercentage = responseCount > 0 
      ? Math.round((opportunityScore / responseCount) * 100) 
      : 50;
    const obstaclePercentage = 100 - opportunityPercentage;

    const categoryScores = {
      'Opportunity Focus': opportunityPercentage,
      'Risk Awareness': Math.min(obstaclePercentage + 20, 100),
      'Strategic Thinking': Math.round((opportunityPercentage + 50) / 2),
      'Adaptability': Math.round((opportunityPercentage + 60) / 2)
    };

    const overallScore = Math.round(
      Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 
      Object.keys(categoryScores).length
    );

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    if (opportunityPercentage > 70) {
      insights.push('Strong opportunity-focused mindset with natural optimism.');
      insights.push('Tendency to see possibilities rather than limitations.');
      recommendations.push('Balance optimism with realistic risk assessment.');
      recommendations.push('Partner with detail-oriented team members for comprehensive planning.');
    } else if (opportunityPercentage < 30) {
      insights.push('Cautious approach with strong risk awareness.');
      insights.push('Thorough consideration of potential obstacles before proceeding.');
      recommendations.push('Practice identifying opportunities within challenges.');
      recommendations.push('Set aside dedicated time for creative problem-solving.');
    } else {
      insights.push('Balanced perspective between opportunities and obstacles.');
      insights.push('Ability to see both potential and challenges in situations.');
      recommendations.push('Continue developing both strategic vision and risk management skills.');
      recommendations.push('Lead initiatives that require balanced decision-making.');
    }

    const htmlContent = `
      <div class="qo2-report">
        <h1>Opportunities-Obstacles Quotient Report</h1>
        <div class="report-header">
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Completed Date:</strong> ${completedDate.toLocaleDateString()}</p>
          <p><strong>Overall Score:</strong> ${overallScore}%</p>
        </div>
        
        <h2>Orientation Balance</h2>
        <div class="balance-chart">
          <div class="opportunity-side" style="width: ${opportunityPercentage}%">
            <p>Opportunities ${opportunityPercentage}%</p>
          </div>
          <div class="obstacle-side" style="width: ${obstaclePercentage}%">
            <p>Obstacles ${obstaclePercentage}%</p>
          </div>
        </div>
        
        <h2>Category Analysis</h2>
        ${Object.entries(categoryScores).map(([category, score]) => `
          <div class="category-analysis">
            <h3>${category}: ${score}%</h3>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${score}%"></div>
            </div>
          </div>
        `).join('')}
        
        <h2>Key Insights</h2>
        <ul>
          ${insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
        
        <h2>Development Recommendations</h2>
        <ul>
          ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;

    return {
      title: 'Opportunities-Obstacles Quotient Report',
      completedDate: completedDate.toISOString(),
      overallScore,
      categoryScores,
      insights,
      recommendations,
      detailedAnalysis: {
        orientationBalance: {
          opportunity: opportunityPercentage,
          obstacle: obstaclePercentage
        },
        decisionPattern: 'Analytical with balanced risk assessment'
      },
      htmlContent
    };
  }

  /**
   * Generate Team Signals Report
   */
  private static generateTeamSignalsReport(
    workflowState: WorkflowState,
    organizationName: string
  ): ReportContent {
    const completedDate = workflowState.completedAt || new Date();
    
    // Team Signals uses 8 strategic questions with Likert scale responses
    const strategicQuestions = [
      'Who are we?',
      'Where are we now?',
      'Where are we going?',
      'How will we get there?',
      'What is expected of us?',
      'What support do we need?',
      'How effective are we?',
      'What recognition do we get?'
    ];

    // Calculate scores for each strategic question
    const categoryScores: Record<string, number> = {};
    const answers = workflowState.answers;
    
    strategicQuestions.forEach((question, index) => {
      // Simulate score calculation based on related answers
      // In real implementation, map specific question IDs to each strategic area
      const baseScore = 50 + Math.floor(Math.random() * 30);
      const hasAnswers = Object.keys(answers).length > index * 3;
      categoryScores[question] = hasAnswers ? baseScore + 15 : baseScore;
    });

    const overallScore = Math.round(
      Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / 
      strategicQuestions.length
    );

    // Generate traffic light indicators
    const trafficLights = Object.entries(categoryScores).map(([question, score]) => ({
      question,
      score,
      status: score > 75 ? 'green' : score > 50 ? 'orange' : 'pink',
      description: score > 75 
        ? 'Area of strength' 
        : score > 50 
        ? 'Moderate development achieved'
        : 'Immediate attention required'
    }));

    // Generate insights
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Analyze green areas
    const greenAreas = trafficLights.filter(tl => tl.status === 'green');
    if (greenAreas.length > 0) {
      insights.push(`Strong performance in ${greenAreas.length} strategic areas.`);
      greenAreas.forEach(area => {
        insights.push(`"${area.question}" shows excellent team alignment and execution.`);
      });
    }

    // Analyze pink areas
    const pinkAreas = trafficLights.filter(tl => tl.status === 'pink');
    if (pinkAreas.length > 0) {
      insights.push(`${pinkAreas.length} areas require immediate attention.`);
      pinkAreas.forEach(area => {
        recommendations.push(`Develop action plan for "${area.question}" to improve team effectiveness.`);
      });
    }

    // Range analysis
    const scores = Object.values(categoryScores);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const range = maxScore - minScore;

    if (range > 30) {
      insights.push('Wide range of scores indicates varying team perspectives and development levels.');
      recommendations.push('Focus on aligning team understanding across all strategic questions.');
    } else {
      insights.push('Narrow score range suggests consistent team development across areas.');
      recommendations.push('Build on existing consistency to achieve excellence across all dimensions.');
    }

    const htmlContent = `
      <div class="team-signals-report">
        <h1>Team Signals Assessment Report</h1>
        <div class="report-header">
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Completed Date:</strong> ${completedDate.toLocaleDateString()}</p>
          <p><strong>Overall Team Development:</strong> ${overallScore}%</p>
        </div>
        
        <h2>Strategic Development Overview</h2>
        <div class="traffic-light-grid">
          ${trafficLights.map(tl => `
            <div class="traffic-light-item ${tl.status}">
              <div class="indicator ${tl.status}"></div>
              <h3>${tl.question}</h3>
              <p class="score">${tl.score}%</p>
              <p class="status">${tl.description}</p>
            </div>
          `).join('')}
        </div>
        
        <h2>Score Range Analysis</h2>
        <div class="range-analysis">
          <p><strong>Highest Score:</strong> ${maxScore}%</p>
          <p><strong>Lowest Score:</strong> ${minScore}%</p>
          <p><strong>Range:</strong> ${range}%</p>
        </div>
        
        <h2>Key Insights</h2>
        <ul>
          ${insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
        
        <h2>Action Recommendations</h2>
        <ul>
          ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        
        <style>
          .traffic-light-item.green .indicator { background-color: #10b981; }
          .traffic-light-item.orange .indicator { background-color: #f59e0b; }
          .traffic-light-item.pink .indicator { background-color: #ec4899; }
        </style>
      </div>
    `;

    return {
      title: 'Team Signals Assessment Report',
      completedDate: completedDate.toISOString(),
      overallScore,
      categoryScores,
      insights,
      recommendations,
      detailedAnalysis: {
        trafficLights,
        rangeAnalysis: {
          max: maxScore,
          min: minScore,
          range,
          consistency: range < 20 ? 'High' : range < 40 ? 'Moderate' : 'Low'
        },
        teamAlignment: overallScore > 70 ? 'Strong' : overallScore > 50 ? 'Developing' : 'Needs Focus'
      },
      htmlContent
    };
  }

  /**
   * Helper methods for detailed analysis
   */
  private static analyzeWorkPreferences(answers: Record<number, string>): any {
    return {
      structureVsFlexibility: 'Balanced',
      collaborationVsIndependence: 'Team-oriented',
      planningVsSpontaneity: 'Structured planner'
    };
  }

  private static analyzeTeamRoles(answers: Record<number, string>): any {
    return {
      primaryRole: 'Coordinator',
      secondaryRole: 'Innovator',
      roleFlexibility: 'High'
    };
  }

  private static analyzeLeadershipStyle(answers: Record<number, string>): any {
    return {
      style: 'Participative',
      strengths: ['Communication', 'Delegation', 'Vision'],
      developmentAreas: ['Conflict resolution', 'Decision speed']
    };
  }
}