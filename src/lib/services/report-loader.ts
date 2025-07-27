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
    TMP: '6', // Template ID for TMP reports
    QO2: '10', // Template ID for QO2 reports
    TeamSignals: '2' // Template ID for Team Signals
  };

  /**
   * Load and parse a report from TMS API
   */
  static async loadReport(options: ReportLoaderOptions): Promise<ParsedReport> {
    const { subscriptionId, reportType, managerId } = options;
    
    try {
      // First, check if we have a stored report
      console.log(`[ReportLoader] Checking for stored report with subscription ID: ${subscriptionId}`);
      
      try {
        const storedReportResponse = await fetch(`/api/reports/subscription/${subscriptionId}`);
        
        if (storedReportResponse.ok) {
          const storedData = await storedReportResponse.json();
          
          if (storedData.success && storedData.report) {
            console.log('[ReportLoader] Found stored report, using cached version');
            
            // Use the processed HTML from storage
            const html = storedData.report.html;
            
            // Parse the HTML into structured data
            const parsedReport = ReportParser.parseHtmlReport(html, reportType);
            
            // Add subscription ID and raw HTML to the parsed report
            parsedReport.subscriptionId = subscriptionId;
            parsedReport.rawHtml = html;
            
            // Add stored report metadata
            parsedReport.reportId = storedData.report.id;
            parsedReport.isFromCache = true;
            
            return parsedReport;
          }
        }
      } catch (error) {
        console.log('[ReportLoader] No stored report found, will generate new one:', error);
      }
      
      // If no stored report, generate via TMS API
      console.log('[ReportLoader] Generating new report via TMS API');
      
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

      // Store the report for persistent access
      try {
        // Get JWT token from the TMS proxy response or generate for mock
        let jwtToken = null;
        
        // Check if the response includes a JWT token
        if (data._jwtToken) {
          jwtToken = data._jwtToken;
        } else {
          // For mock API, we'll generate a JWT token
          const apiMode = process.env.NEXT_PUBLIC_TMS_API_MODE || 'mock';
          
          if (apiMode === 'mock') {
            // Get current user token from TMS auth endpoint
            try {
              const tokenResponse = await fetch('/api/admin/tms-auth/token');
              
              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                jwtToken = tokenData.token;
              }
            } catch (error) {
              console.error('Failed to get JWT token:', error);
            }
          }
        }
        
        const storeResponse = await fetch('/api/reports/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportType,
            subscriptionId,
            templateId,
            rawHtml: html,
            organizationId: 'default', // TODO: Get from user context
            teamId: managerId, // TODO: Get actual team ID
            processImmediately: true, // Process images synchronously
            jwt: jwtToken
          })
        });

        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          console.log('Report stored successfully:', storeData.reportId);
        }
      } catch (error) {
        // Don't fail if storage fails, just log
        console.error('Failed to store report:', error);
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