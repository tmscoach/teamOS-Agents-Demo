/**
 * Report Loader Service
 * Fetches and parses reports from TMS API
 */

import { ReportParser, ParsedReport } from '@/src/lib/utils/report-parser';

interface ReportLoaderOptions {
  subscriptionId: string;
  reportType: 'TMP' | 'QO2' | 'TeamSignals';
  managerId?: string;
}

export class ReportLoader {
  private static readonly TEMPLATE_IDS = {
    TMP: '1', // Template ID for TMP reports
    QO2: '2', // Template ID for QO2 reports
    TeamSignals: '3' // Template ID for Team Signals
  };

  /**
   * Load and parse a report from TMS API
   */
  static async loadReport(options: ReportLoaderOptions): Promise<ParsedReport> {
    const { subscriptionId, reportType } = options;
    
    try {
      // Get the template ID for this report type
      const templateId = this.TEMPLATE_IDS[reportType];
      
      // Call the TMS API to generate HTML report
      const response = await fetch('/api/tms-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'tms_generate_html_report',
          parameters: {
            subscriptionId,
            templateId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract HTML from response
      const html = data.result || data.html || '';
      
      if (!html) {
        throw new Error('No HTML content in response');
      }

      // Parse the HTML into structured data
      const parsedReport = ReportParser.parseHtmlReport(html, reportType);
      
      // Add subscription ID and raw HTML to the parsed report
      parsedReport.subscriptionId = subscriptionId;
      parsedReport.rawHtml = html;
      
      return parsedReport;
    } catch (error) {
      console.error('Error loading report:', error);
      console.log('Using fallback data for development');
      
      // Return fallback data for development
      const fallbackReport = this.getFallbackReport(reportType);
      fallbackReport.subscriptionId = subscriptionId;
      
      // Add some basic sections for testing
      if (!fallbackReport.sections) {
        fallbackReport.sections = [
          {
            id: 'overview',
            title: 'Overview',
            content: fallbackReport.profile.description || '',
            html: `<h2>Overview</h2><p>${fallbackReport.profile.description || ''}</p>`
          },
          {
            id: 'key-insights',
            title: 'Key Insights',
            content: fallbackReport.insights.join(' '),
            html: `<h2>Key Insights</h2><ul>${fallbackReport.insights.map(i => `<li>${i}</li>`).join('')}</ul>`
          }
        ];
      }
      
      return fallbackReport;
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch('/api/tms-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'tms_get_dashboard_subscriptions',
          parameters: {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
      }

      const data = await response.json();
      const subscriptions = data.result || data.subscriptions || [];
      
      // Find the specific subscription
      return subscriptions.find((sub: any) => sub.id === subscriptionId);
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
  }

  /**
   * Get fallback report data for development
   */
  private static getFallbackReport(reportType: 'TMP' | 'QO2' | 'TeamSignals'): ParsedReport {
    const fallbackData = {
      TMP: {
        type: 'TMP' as const,
        title: 'Team Management Profile',
        subtitle: 'Your personal team management style',
        profile: {
          name: 'Creator-Innovator',
          tagline: 'Strong intellectual curiosity.',
          description: `Creator-Innovators are highly creative, intellectually curious individuals who excel at developing innovative solutions through deep analysis and theoretical thinking. They prefer working independently to fully develop ideas before sharing them, are most energised by design and conceptual challenges rather than implementation, and may become resistant when pressured or when their core ideas are challenged. While they bring valuable innovation and thorough analytical thinking to teams, they often struggle with communication timing and may provide overly detailed explanations, making them ideal for advisory or strategic roles where they can leverage their strengths without the pressure of day-to-day operational management.`,
          majorRole: 'Creator Innovator',
          relatedRoles: ['Thruster Organizer', 'Explorer Promoter']
        },
        scores: {
          'Introvert': 7,
          'Creative': 12,
          'Analytical': 10,
          'Flexible': 5
        },
        insights: [
          'Independent thinkers who need space to fully develop ideas before sharing',
          'Excel at innovation, design, and solving complex theoretical problems',
          'Strong analytical and conceptual thinking abilities',
          'May struggle with timing of communication and stakeholder management',
          'Benefit from advisory roles where they can leverage strengths without operational pressure',
          'Need clear boundaries and autonomy to perform at their best',
          'Can provide valuable strategic insights when given time to think deeply',
          'May resist sudden changes or pressure to conform to conventional approaches'
        ],
        recommendations: {
          reading: 'Creative Leadership',
          goals: '2x Weekly challenges'
        },
        credits: {
          amount: 5000,
          badge: 'First Profile'
        }
      },
      QO2: {
        type: 'QO2' as const,
        title: 'QO² Assessment',
        subtitle: 'Your leadership and operational style',
        profile: {
          name: 'Strategic Leader',
          tagline: 'Results-driven and analytical.',
          description: 'Strategic Leaders focus on long-term vision and organizational success through systematic planning and execution.'
        },
        insights: [
          'Strategic thinking and long-term planning capabilities',
          'Strong results orientation with analytical approach',
          'Effective at setting and achieving organizational goals',
          'Natural ability to see the big picture',
          'Skilled at resource allocation and prioritization'
        ],
        recommendations: {
          reading: 'Strategic Leadership Essentials',
          goals: 'Quarterly strategic reviews'
        }
      },
      TeamSignals: {
        type: 'TeamSignals' as const,
        title: 'Team Signals Report',
        subtitle: 'Your team dynamics assessment',
        profile: {
          name: 'Collaborative Team',
          tagline: 'High performance through trust.',
          description: 'This team demonstrates strong collaborative patterns with high trust and clear communication.'
        },
        insights: [
          'High trust levels enable effective collaboration',
          'Clear communication patterns support productivity',
          'Strong alignment on team goals and objectives',
          'Healthy conflict resolution mechanisms in place',
          'Good balance between autonomy and coordination'
        ],
        recommendations: {
          reading: 'Team Dynamics Playbook',
          goals: 'Weekly team check-ins'
        }
      }
    };

    return fallbackData[reportType];
  }
}