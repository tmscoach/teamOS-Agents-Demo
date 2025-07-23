/**
 * Report Context Service
 * Stores and retrieves report context for intelligent interrogation
 */

import { MockSubscription } from '../types';
import { mockDataStore } from '../mock-data-store';

interface ReportContext {
  subscriptionId: string;
  userId: string;
  organizationId: string;
  assessmentType: string;
  htmlContent: string;
  plainText: string;
  images: Map<string, ReportImage>;
  metadata: ReportMetadata;
  generatedAt: Date;
}

interface ReportImage {
  type: string; // TMPWheel, QO2Model, TeamSignals, etc.
  url: string;
  parameters: Record<string, any>;
  description?: string;
  position: number; // Order in report
}

interface ReportMetadata {
  assessmentType: string;
  templateId: string;
  completionDate: Date;
  scores?: Record<string, number>;
  userName?: string;
  organizationName?: string;
}

interface QueryIntent {
  type: 'explain_visual' | 'compare_scores' | 'interpret_results' | 'next_steps' | 'general';
  entities: {
    visualElement?: string;
    scoreType?: string;
    comparison?: string;
  };
  confidence: number;
}

interface DebriefResponse {
  response: string;
  relevantSections: Array<{
    type: 'text' | 'image' | 'score';
    content: any;
    explanation?: string;
  }>;
  suggestedQuestions: string[];
}

class ReportContextService {
  private static instance: ReportContextService;
  private reportStore: Map<string, ReportContext> = new Map();

  private constructor() {}

  static getInstance(): ReportContextService {
    if (!ReportContextService.instance) {
      ReportContextService.instance = new ReportContextService();
    }
    return ReportContextService.instance;
  }

  /**
   * Store report context for future queries
   */
  async storeReportContext(subscriptionId: string, htmlContent: string): Promise<void> {
    // Get subscription details
    const subscription = mockDataStore.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    // Extract plain text from HTML
    const plainText = this.extractPlainText(htmlContent);

    // Extract images from HTML
    const images = this.extractImages(htmlContent);

    // Extract metadata
    const metadata = await this.extractMetadata(subscription, htmlContent);

    // Store context
    const context: ReportContext = {
      subscriptionId,
      userId: subscription.userId,
      organizationId: subscription.organizationId,
      assessmentType: subscription.assessmentType,
      htmlContent,
      plainText,
      images,
      metadata,
      generatedAt: new Date()
    };

    this.reportStore.set(subscriptionId, context);
  }

  /**
   * Query report with natural language
   */
  async queryReport(subscriptionId: string, query: string, conversationContext?: any): Promise<DebriefResponse> {
    const reportContext = this.reportStore.get(subscriptionId);
    if (!reportContext) {
      throw new Error(`No report context found for subscription ${subscriptionId}`);
    }

    // Analyze query intent
    const intent = this.analyzeQueryIntent(query);

    // Generate response based on intent
    const response = await this.generateResponse(query, intent, reportContext, conversationContext);

    return response;
  }

  /**
   * Get report context
   */
  getReportContext(subscriptionId: string): ReportContext | undefined {
    return this.reportStore.get(subscriptionId);
  }

  /**
   * Extract plain text from HTML
   */
  private extractPlainText(html: string): string {
    // Simple HTML tag removal for MVP
    // In production, use a proper HTML parser
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract images from HTML
   */
  private extractImages(html: string): Map<string, ReportImage> {
    const images = new Map<string, ReportImage>();
    const imgRegex = /<img[^>]+src="([^"]+GetGraph[^"]+)"[^>]*>/g;
    let match;
    let position = 0;

    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      const { chartType, params } = this.parseGraphUrl(url);
      
      const imageId = `${chartType}_${position}`;
      images.set(imageId, {
        type: chartType,
        url,
        parameters: params,
        description: this.getImageDescription(chartType, params),
        position: position++
      });
    }

    return images;
  }

  /**
   * Parse GetGraph URL to extract chart type and parameters
   */
  private parseGraphUrl(url: string): { chartType: string; params: Record<string, string> } {
    const urlObj = new URL(url, 'https://api.tms.global');
    const queryString = urlObj.search.substring(1);
    const parts = queryString.split('&');
    
    const chartType = parts[0] || 'Unknown';
    const params: Record<string, string> = {};
    
    for (let i = 1; i < parts.length; i++) {
      const [key, value] = parts[i].split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }

    return { chartType, params };
  }

  /**
   * Get description for image type
   */
  private getImageDescription(chartType: string, params: Record<string, string>): string {
    const descriptions: Record<string, string> = {
      'CreateTMPQWheel': 'Team Management Profile wheel showing your major and related roles',
      'CreateTMPQIntroWheel': 'Introductory view of your Team Management Profile',
      'CreateTMPQRido': 'Work preference dimension showing your position between two extremes',
      'CreateTMPQRidoSummary': 'Summary of all your work preference dimensions',
      'CreateTMPQPreferenceWheel': 'Detailed preference wheel showing scores across all team roles',
      'CreateQO2Model': 'Opportunities-Obstacles Quotient model',
      'CreateTeamSignals': 'Team Signals assessment results with traffic light indicators',
      'CreateComparisonChart': 'Comparison chart showing relative performance',
      'CreatePercentageBar': 'Percentage bar visualization'
    };

    return descriptions[chartType] || 'Assessment visualization';
  }

  /**
   * Extract metadata from subscription and HTML
   */
  private async extractMetadata(subscription: MockSubscription, html: string): Promise<ReportMetadata> {
    const user = mockDataStore.getUser(subscription.userId);
    const org = mockDataStore.getOrganization(subscription.organizationId);

    // Extract scores if available (simplified for MVP)
    const scores: Record<string, number> = {};
    
    // For TMP, extract role scores from HTML
    if (subscription.assessmentType === 'TMP') {
      const wheelMatch = html.match(/CreateTMPQWheel&mr=(\d+)&rr1=(\d+)&rr2=(\d+)/);
      if (wheelMatch) {
        scores.majorRole = parseInt(wheelMatch[1]);
        scores.relatedRole1 = parseInt(wheelMatch[2]);
        scores.relatedRole2 = parseInt(wheelMatch[3]);
      }
    }

    return {
      assessmentType: subscription.assessmentType,
      templateId: '1', // Default for MVP
      completionDate: new Date(),
      scores,
      userName: user ? `${user.firstName} ${user.lastName}` : undefined,
      organizationName: org?.name
    };
  }

  /**
   * Analyze query intent
   */
  private analyzeQueryIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for different intent types - order matters!
    const patterns = [
      { intent: 'explain_visual', pattern: /wheel|graph|chart|image|color|section|green|red|yellow|orange|pink|visual|picture|diagram|traffic light/i },
      { intent: 'next_steps', pattern: /what should i do|next|recommend|improve|action|focus|work on|develop/i },
      { intent: 'compare_scores', pattern: /compare|comparison|difference|better|worse|average|benchmark|others|versus/i },
      { intent: 'interpret_results', pattern: /what does.*mean|means|significance|interpret|understand my|explain my/i }
    ];

    let matchedIntent: QueryIntent['type'] = 'general';
    const entities: QueryIntent['entities'] = {};

    // Check patterns in order - first match wins
    for (const { intent, pattern } of patterns) {
      if (pattern.test(lowerQuery)) {
        matchedIntent = intent as QueryIntent['type'];
        break;
      }
    }

    // Extract entities based on intent
    if (matchedIntent === 'explain_visual') {
      // Extract visual element mentions
      const visualMatches = query.match(/(wheel|graph|chart|section|color|green|red|yellow|orange|pink)/i);
      if (visualMatches) {
        entities.visualElement = visualMatches[1].toLowerCase();
      }
    }

    return {
      type: matchedIntent,
      entities,
      confidence: matchedIntent === 'general' ? 0.5 : 0.9 // High confidence for matched intents
    };
  }

  /**
   * Generate response based on query and context
   */
  private async generateResponse(
    query: string,
    intent: QueryIntent,
    reportContext: ReportContext,
    conversationContext?: any
  ): Promise<DebriefResponse> {
    switch (intent.type) {
      case 'explain_visual':
        return this.explainVisualElement(query, intent, reportContext);
      case 'compare_scores':
        return this.compareScores(query, intent, reportContext);
      case 'interpret_results':
        return this.interpretResults(query, intent, reportContext);
      case 'next_steps':
        return this.suggestNextSteps(query, intent, reportContext);
      default:
        return this.generalResponse(query, reportContext);
    }
  }

  /**
   * Explain visual elements in the report
   */
  private async explainVisualElement(
    query: string,
    intent: QueryIntent,
    reportContext: ReportContext
  ): Promise<DebriefResponse> {
    const { assessmentType } = reportContext;
    const visualElement = intent.entities.visualElement;

    // Find relevant images
    const relevantImages = Array.from(reportContext.images.values()).filter(img => {
      if (visualElement) {
        return img.type.toLowerCase().includes(visualElement) ||
               img.description?.toLowerCase().includes(visualElement);
      }
      return true;
    });

    let response = '';
    const sections: DebriefResponse['relevantSections'] = [];

    // Generate explanation based on assessment type and visual element
    if (assessmentType === 'TMP' && (visualElement?.includes('wheel') || visualElement?.includes('green') || visualElement?.includes('section'))) {
      response = this.explainTMPWheel(reportContext);
      
      // Add wheel image to relevant sections
      const wheelImage = relevantImages.find(img => img.type.includes('Wheel'));
      if (wheelImage) {
        sections.push({
          type: 'image',
          content: wheelImage,
          explanation: wheelImage.description
        });
      }
    } else if (assessmentType === 'TeamSignals' && (visualElement?.includes('traffic') || visualElement?.includes('light') || query.toLowerCase().includes('traffic light'))) {
      response = this.explainTeamSignalsTrafficLights(reportContext);
    } else {
      // Generic visual explanation
      response = `Your ${assessmentType} report contains several visual elements that help illustrate your results. `;
      
      if (relevantImages.length > 0) {
        response += `The ${relevantImages[0].description} shows your assessment outcomes in a visual format. `;
        response += `This helps you quickly understand your strengths and areas for development.`;
        
        sections.push({
          type: 'image',
          content: relevantImages[0],
          explanation: relevantImages[0].description
        });
      }
    }

    return {
      response,
      relevantSections: sections,
      suggestedQuestions: this.getSuggestedQuestions(assessmentType, 'visual')
    };
  }

  /**
   * Explain TMP wheel specifically
   */
  private explainTMPWheel(reportContext: ReportContext): string {
    const scores = reportContext.metadata.scores || {};
    
    let explanation = `The Team Management Profile wheel visualizes your preferred working roles within a team. `;
    explanation += `The wheel is divided into eight segments, each representing a different team role:\n\n`;
    
    explanation += `• **Advising** (green): Gathering and sharing information\n`;
    explanation += `• **Innovating** (light green): Creating and experimenting with ideas\n`;
    explanation += `• **Promoting** (yellow): Exploring and presenting opportunities\n`;
    explanation += `• **Developing** (orange): Assessing and developing ideas\n`;
    explanation += `• **Organizing** (red): Establishing and implementing plans\n`;
    explanation += `• **Producing** (purple): Concluding and delivering outputs\n`;
    explanation += `• **Inspecting** (blue): Controlling and auditing systems\n`;
    explanation += `• **Maintaining** (dark blue): Upholding and safeguarding standards\n\n`;
    
    if (scores.majorRole) {
      explanation += `Your major role preference is highlighted with the largest segment, showing where you naturally contribute most effectively to a team.`;
    }
    
    return explanation;
  }

  /**
   * Explain Team Signals traffic lights
   */
  private explainTeamSignalsTrafficLights(reportContext: ReportContext): string {
    let explanation = `The traffic light system in your Team Signals report provides a quick visual indicator of your team's performance across different areas:\n\n`;
    
    explanation += `🟢 **Green** (75-100%): Excellent performance - your team is excelling in this area\n`;
    explanation += `🟡 **Amber/Orange** (50-74%): Good performance with room for improvement\n`;
    explanation += `🔴 **Red/Pink** (0-49%): Area requiring attention and focused development\n\n`;
    
    explanation += `Each traffic light corresponds to one of the eight key questions that assess your team's effectiveness. `;
    explanation += `The colors help you quickly identify which areas are strengths and which need more attention.`;
    
    return explanation;
  }

  /**
   * Compare scores response
   */
  private async compareScores(
    query: string,
    intent: QueryIntent,
    reportContext: ReportContext
  ): Promise<DebriefResponse> {
    const { assessmentType } = reportContext;
    
    let response = `Based on your ${assessmentType} assessment results:\n\n`;
    
    // Add assessment-specific comparisons
    if (assessmentType === 'TMP') {
      response += `Your Team Management Profile shows your unique combination of work preferences. `;
      response += `When you compare your profile to others, remember that there's no "better" or "worse" profile - each has unique strengths. `;
      response += `Understanding your preferences helps you work more effectively with others who have different styles.`;
    } else if (assessmentType === 'TeamSignals') {
      response += `Your team's scores can be compared against typical team performance benchmarks. `;
      response += `Green areas indicate where your team is performing above average, while amber and red areas show opportunities for improvement.`;
    }

    return {
      response,
      relevantSections: [],
      suggestedQuestions: this.getSuggestedQuestions(assessmentType, 'comparison')
    };
  }

  /**
   * Interpret results response
   */
  private async interpretResults(
    query: string,
    intent: QueryIntent,
    reportContext: ReportContext
  ): Promise<DebriefResponse> {
    const { assessmentType, metadata } = reportContext;
    
    let response = `Your ${assessmentType} results indicate:\n\n`;
    
    // Add assessment-specific interpretation
    if (assessmentType === 'TMP') {
      response += `• Your work preferences show how you naturally approach tasks and interact with team members\n`;
      response += `• These preferences influence your communication style, decision-making, and problem-solving approach\n`;
      response += `• Understanding these preferences helps you leverage your strengths and work effectively with others\n`;
    } else if (assessmentType === 'QO2') {
      response += `• Your Opportunities-Obstacles Quotient reveals how you perceive and respond to challenges\n`;
      response += `• This affects your ability to identify opportunities and navigate obstacles\n`;
      response += `• Higher scores indicate a more opportunity-focused mindset\n`;
    }

    return {
      response,
      relevantSections: [],
      suggestedQuestions: this.getSuggestedQuestions(assessmentType, 'interpretation')
    };
  }

  /**
   * Suggest next steps
   */
  private async suggestNextSteps(
    query: string,
    intent: QueryIntent,
    reportContext: ReportContext
  ): Promise<DebriefResponse> {
    const { assessmentType } = reportContext;
    
    let response = `Based on your ${assessmentType} results, here are recommended next steps:\n\n`;
    
    // Add assessment-specific recommendations
    response += `1. **Review and Reflect**: Take time to review your full report and reflect on how the results align with your self-perception\n\n`;
    response += `2. **Share and Discuss**: Share your results with your team or manager to enhance mutual understanding\n\n`;
    response += `3. **Identify Development Areas**: Focus on 1-2 specific areas where you'd like to grow or adapt\n\n`;
    response += `4. **Create Action Plan**: Develop specific, measurable actions to leverage your strengths and address development areas\n\n`;
    response += `5. **Seek Support**: Connect with others who have complementary profiles for collaboration and learning`;

    return {
      response,
      relevantSections: [],
      suggestedQuestions: this.getSuggestedQuestions(assessmentType, 'action')
    };
  }

  /**
   * General response for unmatched intents
   */
  private async generalResponse(
    query: string,
    reportContext: ReportContext
  ): Promise<DebriefResponse> {
    const { assessmentType } = reportContext;
    
    // Check if it's a general "help me understand" query
    if (query.toLowerCase().includes('help me understand') || query.toLowerCase().includes('understand my report')) {
      return this.interpretResults(query, { type: 'interpret_results', entities: {}, confidence: 0.8 }, reportContext);
    }
    
    const response = `I can help you understand your ${assessmentType} report. You can ask me about:\n\n` +
                    `• What the visual elements (wheels, graphs, colors) mean\n` +
                    `• How to interpret your scores and results\n` +
                    `• How you compare to typical profiles\n` +
                    `• What actions you should take based on your results\n\n` +
                    `What specific aspect would you like to explore?`;

    return {
      response,
      relevantSections: [],
      suggestedQuestions: this.getSuggestedQuestions(assessmentType, 'general')
    };
  }

  /**
   * Get suggested follow-up questions
   */
  private getSuggestedQuestions(assessmentType: string, context: string): string[] {
    const questions: Record<string, Record<string, string[]>> = {
      'TMP': {
        'visual': [
          'What do the different colors in my wheel represent?',
          'Why is one section of my wheel larger than others?',
          'What does it mean to have multiple related roles?'
        ],
        'comparison': [
          'How does my profile compare to typical team leaders?',
          'What profiles work best with mine?',
          'Is my profile common or unique?'
        ],
        'interpretation': [
          'What are the strengths of my profile?',
          'What challenges might I face with this profile?',
          'How does my profile affect my communication style?'
        ],
        'action': [
          'How can I work better with different profiles?',
          'What development activities suit my profile?',
          'How can I leverage my major role more effectively?'
        ],
        'general': [
          'Can you explain what the wheel shows?',
          'What should I focus on improving?',
          'How do I use these results with my team?'
        ]
      },
      'TeamSignals': {
        'visual': [
          'What do the traffic lights indicate?',
          'Why are some lights green and others red?',
          'What does each color mean for my team?'
        ],
        'comparison': [
          'How does my team compare to high-performing teams?',
          'Which areas are we strongest in?',
          'What\'s our biggest gap compared to benchmarks?'
        ],
        'interpretation': [
          'What do these scores mean for team effectiveness?',
          'Which areas impact performance most?',
          'How are the different areas connected?'
        ],
        'action': [
          'Which area should we focus on first?',
          'How can we improve our red areas?',
          'What team activities would help our scores?'
        ],
        'general': [
          'Can you explain our Team Signals results?',
          'What are the key takeaways?',
          'How often should we reassess?'
        ]
      },
      'QO2': {
        'visual': [
          'What does the QO2 model diagram show?',
          'How do I read the opportunities vs obstacles chart?',
          'What do the different quadrants mean?'
        ],
        'comparison': [
          'Is my QO2 score typical?',
          'How do leaders usually score?',
          'What\'s a good balance between opportunities and obstacles?'
        ],
        'interpretation': [
          'What does my QO2 score reveal about me?',
          'How does this affect my decision-making?',
          'Why might I see more obstacles than opportunities?'
        ],
        'action': [
          'How can I develop a more balanced perspective?',
          'What exercises improve opportunity recognition?',
          'How do I help my team see more opportunities?'
        ],
        'general': [
          'What is the QO2 assessment measuring?',
          'How do I use these results?',
          'Can my QO2 change over time?'
        ]
      }
    };

    // Return questions for the specific assessment and context
    // If not found, return general questions
    return questions[assessmentType]?.[context] || 
           questions[assessmentType]?.['general'] || 
           [
             'Can you explain my results?',
             'What should I focus on?',
             'How do I use this information?'
           ];
  }

  /**
   * Clear all stored reports (for testing)
   */
  clearAll(): void {
    this.reportStore.clear();
  }

  /**
   * Get all stored report IDs (for testing)
   */
  getAllReportIds(): string[] {
    return Array.from(this.reportStore.keys());
  }
}

// Export singleton instance
export const reportContextService = ReportContextService.getInstance();