/**
 * Report Parser Utility
 * Parses HTML reports from TMS API into structured data for display
 */

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  html: string;
}

export interface ParsedReport {
  type: 'TMP' | 'QO2' | 'TeamSignals';
  title: string;
  subtitle: string;
  profile: {
    name: string;
    tagline: string;
    description: string;
    majorRole?: string;
    relatedRoles?: string[];
  };
  scores?: Record<string, number>;
  insights: string[];
  recommendations: {
    reading?: string;
    goals?: string;
  };
  credits?: {
    amount: number;
    badge?: string;
  };
  subscriptionId?: string;
  rawHtml?: string;
  sections?: ReportSection[];
}

export class ReportParser {
  /**
   * Parse HTML report from TMS API
   */
  static parseHtmlReport(html: string, reportType: 'TMP' | 'QO2' | 'TeamSignals'): ParsedReport {
    // Create a DOM parser for the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    switch (reportType) {
      case 'TMP':
        return this.parseTMPReport(doc);
      case 'QO2':
        return this.parseQO2Report(doc);
      case 'TeamSignals':
        return this.parseTeamSignalsReport(doc);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  /**
   * Parse TMP (Team Management Profile) Report
   */
  private static parseTMPReport(doc: Document): ParsedReport {
    const report: ParsedReport = {
      type: 'TMP',
      title: 'Team Management Profile',
      subtitle: 'Your personal team management style',
      profile: {
        name: '',
        tagline: '',
        description: ''
      },
      scores: {},
      insights: [],
      recommendations: {},
      credits: {
        amount: 5000,
        badge: 'First Profile'
      },
      sections: []
    };

    // Extract profile information
    // Look for major role section - search through h2 elements
    const h2Elements = Array.from(doc.querySelectorAll('h2'));
    const majorRoleElement = h2Elements.find(h2 => 
      h2.textContent?.includes('Major Role')
    ) || doc.querySelector('.major-role, [class*="major"]');
    
    if (majorRoleElement) {
      const roleText = majorRoleElement.nextElementSibling?.textContent || majorRoleElement.textContent || '';
      report.profile.majorRole = roleText.trim();
      
      // Map to our profile names
      if (roleText.includes('Creator') && roleText.includes('Innovator')) {
        report.profile.name = 'Creator-Innovator';
        report.profile.tagline = 'Strong intellectual curiosity.';
      }
    }

    // Extract related roles
    const relatedRolesSection = h2Elements.find(h2 => 
      h2.textContent?.includes('Related Roles')
    ) || doc.querySelector('.related-roles');
    
    if (relatedRolesSection) {
      const rolesList = relatedRolesSection.nextElementSibling;
      if (rolesList) {
        report.profile.relatedRoles = Array.from(rolesList.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter(Boolean) as string[];
      }
    }

    // Extract scores (Net Scores section)
    const scoresSection = h2Elements.find(h2 => 
      h2.textContent?.includes('Net Scores')
    ) || doc.querySelector('.net-scores');
    
    if (scoresSection) {
      const scoresTable = scoresSection.nextElementSibling;
      if (scoresTable && scoresTable.tagName === 'TABLE') {
        const rows = scoresTable.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const dimension = cells[0].textContent?.trim();
            const score = cells[1].textContent?.trim();
            if (dimension && score) {
              report.scores![dimension] = parseFloat(score) || 0;
            }
          }
        });
      }
    }

    // Extract key points/insights
    const keyPointsSection = h2Elements.find(h2 => 
      h2.textContent?.includes('Key Points') || h2.textContent?.includes('Leadership Strengths')
    ) || doc.querySelector('.key-points');
    
    if (keyPointsSection) {
      const pointsList = keyPointsSection.nextElementSibling;
      if (pointsList) {
        report.insights = Array.from(pointsList.querySelectorAll('li'))
          .map(li => li.textContent?.trim())
          .filter(Boolean) as string[];
      }
    }

    // Set profile description based on role
    if (report.profile.name === 'Creator-Innovator') {
      report.profile.description = `Creator-Innovators are highly creative, intellectually curious individuals who excel at developing innovative solutions through deep analysis and theoretical thinking. They prefer working independently to fully develop ideas before sharing them, are most energised by design and conceptual challenges rather than implementation, and may become resistant when pressured or when their core ideas are challenged. While they bring valuable innovation and thorough analytical thinking to teams, they often struggle with communication timing and may provide overly detailed explanations, making them ideal for advisory or strategic roles where they can leverage their strengths without the pressure of day-to-day operational management.`;
    }

    // Set recommendations
    report.recommendations = {
      reading: 'Creative Leadership',
      goals: '2x Weekly challenges'
    };

    // Extract all sections from the report
    const sections = Array.from(doc.querySelectorAll('section')).map(section => {
      const title = section.querySelector('h2')?.textContent?.trim() || '';
      const content = section.textContent?.trim() || '';
      const html = section.innerHTML;
      
      return {
        id: section.id || title.toLowerCase().replace(/\s+/g, '-'),
        title,
        content,
        html
      };
    }).filter(section => section.title); // Only include sections with titles
    
    report.sections = sections;

    // Extract insights from key points section if available from sections
    const keyPointsSectionFromSections = sections.find(s => s.id === 'keypoints' || s.title.includes('Key Points'));
    if (keyPointsSectionFromSections && report.insights.length === 0) {
      const listItems = Array.from(doc.querySelectorAll(`#${keyPointsSectionFromSections.id} li`));
      if (listItems.length > 0) {
        report.insights = listItems.map(li => li.textContent?.trim() || '').filter(Boolean);
      }
    }

    // Store raw HTML for reference
    report.rawHtml = doc.body.innerHTML;

    return report;
  }

  /**
   * Parse QO2 Report
   */
  private static parseQO2Report(doc: Document): ParsedReport {
    // TODO: Implement QO2 parsing logic
    return {
      type: 'QO2',
      title: 'QO² Assessment',
      subtitle: 'Your leadership and operational style',
      profile: {
        name: 'Strategic Leader',
        tagline: 'Results-driven and analytical.',
        description: 'Strategic Leaders focus on long-term vision and organizational success...'
      },
      insights: [
        'Strategic thinking and long-term planning capabilities',
        'Strong results orientation with analytical approach',
        'Effective at setting and achieving organizational goals'
      ],
      recommendations: {
        reading: 'Strategic Leadership Essentials',
        goals: 'Quarterly strategic reviews'
      }
    };
  }

  /**
   * Parse Team Signals Report
   */
  private static parseTeamSignalsReport(doc: Document): ParsedReport {
    // TODO: Implement Team Signals parsing logic
    return {
      type: 'TeamSignals',
      title: 'Team Signals Report',
      subtitle: 'Your team dynamics assessment',
      profile: {
        name: 'Collaborative Team',
        tagline: 'High performance through trust.',
        description: 'This team demonstrates strong collaborative patterns...'
      },
      insights: [
        'High trust levels enable effective collaboration',
        'Clear communication patterns support productivity',
        'Strong alignment on team goals and objectives'
      ],
      recommendations: {
        reading: 'Team Dynamics Playbook',
        goals: 'Weekly team check-ins'
      }
    };
  }

  /**
   * Extract text content from HTML safely
   */
  private static extractText(element: Element | null): string {
    if (!element) return '';
    return element.textContent?.trim() || '';
  }

  /**
   * Find element by text content
   */
  private static findElementByText(doc: Document, text: string): Element | null {
    const xpath = `//*[contains(text(), '${text}')]`;
    const result = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue as Element | null;
  }
}