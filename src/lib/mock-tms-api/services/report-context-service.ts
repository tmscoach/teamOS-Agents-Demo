/**
 * Report Context Service
 * Stores and retrieves report context for intelligent interrogation
 */

import type { MockSubscription } from '../mock-data-store';
import { mockDataStore } from '../mock-data-store';
import { OpenAI } from 'openai';

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
  private openai: OpenAI | null = null;

  private constructor() {
    // Initialize OpenAI client if API key is available and not in test environment
    if (process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

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
  async queryReport(params: {
    subscriptionId: string;
    query: string;
    userId?: string;
    conversationContext?: any;
  }): Promise<DebriefResponse & { success: boolean; message?: string }> {
    // Validate subscription ID
    const subscriptionValidation = this.validateSubscriptionId(params.subscriptionId);
    if (!subscriptionValidation.valid) {
      return {
        success: false,
        message: subscriptionValidation.error,
        response: '',
        relevantSections: [],
        suggestedQuestions: []
      };
    }

    // Validate user ID if provided
    if (params.userId) {
      const userValidation = this.validateUserId(params.userId);
      if (!userValidation.valid) {
        return {
          success: false,
          message: userValidation.error,
          response: '',
          relevantSections: [],
          suggestedQuestions: []
        };
      }

      // Check rate limit
      if (!this.checkRateLimit(params.userId)) {
        return {
          success: false,
          message: 'Rate limit exceeded. Please wait a minute before trying again.',
          response: '',
          relevantSections: [],
          suggestedQuestions: []
        };
      }
    }

    // Validate and sanitize query
    if (!params.query || params.query.trim() === '') {
      return {
        success: false,
        message: 'Query cannot be empty',
        response: '',
        relevantSections: [],
        suggestedQuestions: []
      };
    }

    if (params.query.length > 5000) {
      return {
        success: false,
        message: 'Query is too long. Please limit to 5000 characters.',
        response: '',
        relevantSections: [],
        suggestedQuestions: []
      };
    }

    const sanitizedQuery = this.sanitizeQuery(params.query);

    // Get report context with sanitized subscription ID
    const reportContext = this.reportStore.get(subscriptionValidation.sanitized!);
    if (!reportContext) {
      return {
        success: false,
        message: `No report context found for subscription ${subscriptionValidation.sanitized}`,
        response: '',
        relevantSections: [],
        suggestedQuestions: []
      };
    }

    try {
      // Analyze query intent
      const intent = this.analyzeQueryIntent(sanitizedQuery);

      // Generate response based on intent
      const response = await this.generateResponse(
        sanitizedQuery, 
        intent, 
        reportContext, 
        params.conversationContext
      );

      return {
        success: true,
        ...response
      };
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        success: false,
        message: 'An error occurred while processing your query. Please try again.',
        response: '',
        relevantSections: [],
        suggestedQuestions: []
      };
    }
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
    
    // List of rendering-only parameters to exclude
    const renderingParams = ['mr', 'rr1', 'rr2'];
    
    for (let i = 1; i < parts.length; i++) {
      const [key, value] = parts[i].split('=');
      if (key && value) {
        // Filter out rendering-only parameters
        if (!renderingParams.includes(key)) {
          params[key] = decodeURIComponent(value);
        }
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
    // Handle missing or empty query
    if (!query || query.trim() === '') {
      return {
        type: 'general',
        entities: {},
        confidence: 0.5
      };
    }
    
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
    // First check if user is asking about a specific section
    const sectionResponse = await this.checkForSectionQuery(query, reportContext);
    if (sectionResponse) {
      return sectionResponse;
    }
    
    // If OpenAI is available, use LLM for intelligent responses
    if (this.openai) {
      return this.generateLLMResponse(query, reportContext, conversationContext);
    }
    
    // Otherwise fall back to pattern-based responses
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
    const { assessmentType, metadata, plainText, htmlContent } = reportContext;
    const sections: DebriefResponse['relevantSections'] = [];
    
    let response = '';
    
    // Check if user is asking about specific scores or roles
    const isAskingAboutRole = query.toLowerCase().includes('role') || query.toLowerCase().includes('major');
    const isAskingAboutScores = query.toLowerCase().includes('score') || query.toLowerCase().includes('raw');
    
    if (assessmentType === 'TMP') {
      // Extract major role from HTML - updated pattern to match the template structure
      const majorRoleMatch = htmlContent.match(/<label>Major Role<\/label><p>([^<]+)<\/div>/i) || 
                            htmlContent.match(/Major Role[:\s]*<[^>]+>([^<]+)</i) ||
                            htmlContent.match(/Major Role[:\s]+(\w+)/i) ||
                            plainText.match(/Major Role[:\s]+(\w+)/i);
      
      // Extract scores from CreateTMPQWheel parameters
      const wheelMatch = htmlContent.match(/CreateTMPQWheel&mr=(\d+)&rr1=(\d+)&rr2=(\d+)/);
      
      if (isAskingAboutRole && majorRoleMatch) {
        response = `Your Major Role is **${majorRoleMatch[1]}**.\n\n`;
        response += `This means you naturally prefer to contribute to teams through ${majorRoleMatch[1].toLowerCase()} activities. `;
        response += `People with this major role typically excel at tasks that involve this type of work preference.`;
      } else if (isAskingAboutScores && wheelMatch) {
        response = `Your TMP raw scores are:\n\n`;
        response += `• Major Role Score: ${wheelMatch[1]}\n`;
        response += `• Related Role 1 Score: ${wheelMatch[2]}\n`;
        response += `• Related Role 2 Score: ${wheelMatch[3]}\n\n`;
        response += `These scores indicate the relative strength of your preferences across different team roles.`;
        
        sections.push({
          type: 'score',
          content: {
            majorRole: parseInt(wheelMatch[1]),
            relatedRole1: parseInt(wheelMatch[2]),
            relatedRole2: parseInt(wheelMatch[3])
          },
          explanation: 'Your TMP role preference scores'
        });
      } else {
        // General interpretation
        response = `Your Team Management Profile (TMP) results indicate:\n\n`;
        
        if (majorRoleMatch) {
          response += `• **Major Role: ${majorRoleMatch[1]}** - Your primary work preference\n`;
        }
        
        response += `• Your work preferences show how you naturally approach tasks and interact with team members\n`;
        response += `• These preferences influence your communication style, decision-making, and problem-solving approach\n`;
        response += `• Understanding these preferences helps you leverage your strengths and work effectively with others\n`;
        
        if (wheelMatch) {
          response += `\nYour preference scores: Major Role (${wheelMatch[1]}), Related Roles (${wheelMatch[2]}, ${wheelMatch[3]})`;
        }
      }
      
      // Add wheel visualization if available
      const wheelImage = Array.from(reportContext.images.values()).find(img => img.type.includes('Wheel'));
      if (wheelImage) {
        sections.push({
          type: 'image',
          content: wheelImage,
          explanation: 'Your Team Management Profile wheel'
        });
      }
    } else if (assessmentType === 'QO2') {
      response = `Your Opportunities-Obstacles Quotient (QO2) results indicate:\n\n`;
      response += `• Your perception and response to challenges in the workplace\n`;
      response += `• Your ability to identify opportunities versus focusing on obstacles\n`;
      response += `• Higher scores indicate a more opportunity-focused mindset\n`;
    } else {
      response = `Your ${assessmentType} results indicate:\n\n`;
      response += `• Key performance indicators across multiple dimensions\n`;
      response += `• Areas of strength and opportunities for development\n`;
      response += `• Actionable insights for improvement\n`;
    }

    return {
      response,
      relevantSections: sections,
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
  
  /**
   * Generate intelligent response using LLM
   */
  private async generateLLMResponse(
    query: string,
    reportContext: ReportContext,
    conversationContext?: any
  ): Promise<DebriefResponse> {
    try {
      // Prepare context for LLM
      const systemPrompt = `You are a TMS (Team Management Systems) assessment debrief specialist. You have access to a user's ${reportContext.assessmentType} assessment report and need to answer their questions accurately based on the actual report content.

Assessment Type: ${reportContext.assessmentType}
User: ${reportContext.metadata.userName || 'User'}
Organization: ${reportContext.metadata.organizationName || 'Organization'}

Report Data:
${this.generateReportSummary(reportContext)}

CRITICAL INSTRUCTIONS:
1. ALWAYS use the EXACT data from the report text above - NEVER make up or guess values
2. When asked about Major Role, use the EXACT role name provided (e.g., "Upholder Maintainer")
3. For TMP scores, use ONLY the Work Preference Net Scores (I, C, B, S) which are single digits - these are NOT percentages
4. IGNORE any numbers in image URLs or graph parameters - these are visualization parameters, not actual scores
5. Major Roles in TMS do NOT have numerical scores - they are determined by the pattern of I, C, B, S scores
6. Quote directly from the "FULL REPORT CONTENT" section when answering about specific sections
7. If data is not available in the report, say so - do not invent information
8. Be professional, supportive, and constructive in your interpretations
9. NEVER mention mr, rr1, or rr2 values - these are rendering parameters for graph visualization only

IMPORTANT TMS Context:
- TMP uses four work preference measures: Relationships (E/I), Information (P/C), Decisions (A/B), Organization (S/F)
- Net scores are calculated by subtracting the lower from the higher (e.g., I: 7 means Introvert preference of 7)
- These net scores determine the Major Role and Related Roles on the Team Management Wheel
- There is NO such thing as a "Major Role Score of 85" - roles are qualitative, not quantitative
- The numbers in image URLs (like mr=85, rr1=70, rr2=65) are GRAPH PARAMETERS for visualization ONLY - they have NO meaning in TMS and should NEVER be mentioned to the user

TMS Team Management Wheel Roles:
1. Reporter-Adviser: Gathering and reporting information
2. Creator-Innovator: Creating and experimenting with ideas  
3. Explorer-Promoter: Exploring and presenting opportunities
4. Assessor-Developer: Assessing and testing applicability of new approaches
5. Thruster-Organizer: Establishing and implementing ways of making things work
6. Concluder-Producer: Concluding and delivering outputs
7. Controller-Inspector: Controlling and auditing systems
8. Upholder-Maintainer: Upholding and safeguarding standards

Each role represents a preferred way of working, not a fixed personality type. People typically have a Major Role (strongest preference) and two Related Roles.

When discussing roles, NEVER mention numerical scores for the roles themselves - only the I, C, B, S preference scores have numbers.

Remember: You are debriefing THIS SPECIFIC report with THIS SPECIFIC data. Do not use generic examples or template responses.`;

      // Build conversation history
      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add previous messages if available
      if (conversationContext?.previousMessages) {
        messages.push(...conversationContext.previousMessages);
      }
      
      // Add current query
      messages.push({ role: 'user', content: query });
      
      // Call OpenAI
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      // Extract relevant sections based on the response
      const relevantSections = this.extractRelevantSections(response, reportContext);
      
      // Generate suggested questions based on the context
      const suggestedQuestions = this.getSuggestedQuestions(
        reportContext.assessmentType,
        this.determineResponseContext(response)
      );
      
      return {
        response,
        relevantSections,
        suggestedQuestions
      };
    } catch (error) {
      console.error('LLM response generation failed:', error);
      // Fall back to pattern-based response
      const intent = this.analyzeQueryIntent(query);
      return this.generateResponse(query, intent, reportContext, conversationContext);
    }
  }
  
  /**
   * Generate a summary of the report for LLM context
   */
  private generateReportSummary(reportContext: ReportContext): string {
    const { assessmentType, plainText, metadata, images, htmlContent } = reportContext;
    
    let summary = `Assessment: ${assessmentType}\n`;
    
    // Extract key data from the HTML report
    if (assessmentType === 'TMP') {
      // Extract Major Role
      const majorRoleMatch = htmlContent.match(/<label>Major Role<\/label><p>([^<]+)<\/div>/);
      if (majorRoleMatch) {
        summary += `\nMajor Role: ${majorRoleMatch[1]}\n`;
      }
      
      // Extract Related Roles
      const relatedRole1Match = htmlContent.match(/<label>1st Related Role<\/label><p>([^<]+)<\/div>/);
      const relatedRole2Match = htmlContent.match(/<label>2nd Related Role<\/label><p>([^<]+)<\/div>/);
      if (relatedRole1Match) {
        summary += `1st Related Role: ${relatedRole1Match[1]}\n`;
      }
      if (relatedRole2Match) {
        summary += `2nd Related Role: ${relatedRole2Match[1]}\n`;
      }
      
      // Extract work preference scores (I, C, B, S) from the report text, NOT from URLs
      const scorePattern = /These are I: (\d+); C: (\d+); B: (\d+); S: (\d+) and are the foundation/;
      const scoreMatch = htmlContent.match(scorePattern);
      if (scoreMatch) {
        summary += `\nWork Preference Net Scores (from report text):\n`;
        summary += `- I (Introvert): ${scoreMatch[1]}\n`;
        summary += `- C (Creative): ${scoreMatch[2]}\n`;
        summary += `- B (Beliefs): ${scoreMatch[3]}\n`;
        summary += `- S (Structured): ${scoreMatch[4]}\n`;
        summary += `\nNote: These are the net scores that determine your role preferences, not percentages.\n`;
      }
      
      // Extract work preference distribution percentages if available
      const distributionMatch = htmlContent.match(/Maintaining[\s\S]*?(\d+)%/);
      if (distributionMatch) {
        summary += `\nWork Preference Distribution: The report shows percentage distributions across all eight types of work, but these are different from the core preference scores.\n`;
      }
    }
    
    // Add image descriptions
    if (images.size > 0) {
      summary += '\nVisual Elements:\n';
      images.forEach((img, key) => {
        summary += `- ${img.description || img.type}\n`;
        if (img.parameters && Object.keys(img.parameters).length > 0) {
          summary += `  Parameters: ${JSON.stringify(img.parameters)}\n`;
        }
      });
    }
    
    // Add COMPLETE plain text content, not just excerpt
    summary += '\n\nFULL REPORT CONTENT:\n';
    summary += plainText;
    
    return summary;
  }
  
  /**
   * Extract relevant sections mentioned in the LLM response
   */
  private extractRelevantSections(
    response: string,
    reportContext: ReportContext
  ): DebriefResponse['relevantSections'] {
    const sections: DebriefResponse['relevantSections'] = [];
    
    // Check if response mentions visual elements
    if (response.toLowerCase().includes('wheel') || response.toLowerCase().includes('graph')) {
      const wheelImage = Array.from(reportContext.images.values()).find(img => 
        img.type.includes('Wheel') || img.type.includes('Graph')
      );
      if (wheelImage) {
        sections.push({
          type: 'image',
          content: wheelImage,
          explanation: wheelImage.description
        });
      }
    }
    
    // Check if response mentions scores
    if (response.toLowerCase().includes('score') && reportContext.metadata.scores) {
      sections.push({
        type: 'score',
        content: reportContext.metadata.scores,
        explanation: 'Assessment scores'
      });
    }
    
    return sections;
  }
  
  /**
   * Determine context type from response for suggested questions
   */
  private determineResponseContext(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('visual') || lowerResponse.includes('wheel') || lowerResponse.includes('color')) {
      return 'visual';
    } else if (lowerResponse.includes('compar') || lowerResponse.includes('benchmark')) {
      return 'comparison';
    } else if (lowerResponse.includes('next') || lowerResponse.includes('action') || lowerResponse.includes('improve')) {
      return 'action';
    } else if (lowerResponse.includes('score') || lowerResponse.includes('result')) {
      return 'interpretation';
    }
    
    return 'general';
  }
  
  /**
   * Check if query is asking about a specific section and extract its content
   */
  private async checkForSectionQuery(
    query: string,
    reportContext: ReportContext
  ): Promise<DebriefResponse | null> {
    const lowerQuery = query.toLowerCase();
    
    // Skip section check for generic visual/interpretation queries
    if (lowerQuery.includes('wheel') || lowerQuery.includes('color') || 
        lowerQuery.includes('graph') || lowerQuery.includes('what does') && lowerQuery.includes('mean')) {
      return null;
    }
    
    // List of common section-related keywords
    const sectionKeywords = [
      'section', 'part', 'area', 'summary', 'summarise', 'summarize',
      'what does it say about', 'tell me about my', 'explain my'
    ];
    
    // Check if query contains section-related keywords
    const isAskingAboutSection = sectionKeywords.some(keyword => lowerQuery.includes(keyword));
    if (!isAskingAboutSection) {
      return null;
    }
    
    // Try to extract section name from query
    // Common patterns: "Areas for Self-Assessment", "Leadership Strengths", etc.
    const sectionPatterns = [
      /(?:section|part|area)\s+(?:called|titled|named)?\s*["']?([^"']+)["']?/i,
      /(?:summarise|summarize|summary of|explain)\s+(?:my|the)?\s*([^section]+)(?:section)?/i,
      /tell me about\s+(?:my|the)?\s*([^section]+)(?:section)?/i,
      /what does.*say about\s+(?:my|the)?\s*([^section]+)(?:section)?/i
    ];
    
    let sectionName = '';
    for (const pattern of sectionPatterns) {
      const match = query.match(pattern);
      if (match) {
        sectionName = match[1].trim();
        break;
      }
    }
    
    // If no section name found, check for specific known sections
    const knownSections = [
      'areas for self-assessment',
      'leadership strengths',
      'decision-making',
      'interpersonal skills',
      'team-building',
      'key points',
      'overview',
      'introduction',
      'related roles',
      'work preference',
      'linking',
      'individual summary',
      'disclaimer'
    ];
    
    if (!sectionName) {
      for (const section of knownSections) {
        if (lowerQuery.includes(section)) {
          sectionName = section;
          break;
        }
      }
    }
    
    if (!sectionName) {
      return null;
    }
    
    // Search for the section in the HTML content
    const sectionContent = this.extractSectionContent(reportContext.htmlContent, sectionName);
    
    if (!sectionContent) {
      // Section not found, return helpful response
      return {
        response: `I couldn't find a section specifically called "${sectionName}" in your report. Your ${reportContext.assessmentType} report contains the following sections:\n\n` +
                 this.listAvailableSections(reportContext.htmlContent) +
                 `\n\nPlease let me know which section you'd like to learn more about.`,
        relevantSections: [],
        suggestedQuestions: this.getSuggestedQuestions(reportContext.assessmentType, 'general')
      };
    }
    
    // Format the response
    const response = `Here's what your ${reportContext.assessmentType} report says in the "${this.titleCase(sectionName)}" section:\n\n${sectionContent}`;
    
    return {
      response,
      relevantSections: [{
        type: 'text',
        content: sectionContent,
        explanation: `Content from the ${this.titleCase(sectionName)} section`
      }],
      suggestedQuestions: [
        `What does this mean for my work style?`,
        `How can I apply this information?`,
        `Tell me more about another section of my report`
      ]
    };
  }
  
  /**
   * Extract content of a specific section from HTML
   */
  private extractSectionContent(html: string, sectionName: string): string | null {
    // Normalize section name for comparison
    const normalizedName = sectionName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try to find section by ID first (most accurate)
    const idPattern = new RegExp(`<section\s+id=["']([^"']+)["']>([\s\S]*?)</section>`, 'gi');
    let match;
    
    while ((match = idPattern.exec(html)) !== null) {
      const sectionId = match[1].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (sectionId === normalizedName || sectionId.includes(normalizedName) || normalizedName.includes(sectionId)) {
        // Extract text content from the section
        const sectionHtml = match[2];
        return this.extractTextFromSection(sectionHtml);
      }
    }
    
    // Try to find by heading text
    const headingPattern = new RegExp(`<h2[^>]*>([^<]*${sectionName}[^<]*)</h2>([\s\S]*?)(?=<section|</div>|$)`, 'gi');
    match = headingPattern.exec(html);
    if (match) {
      return this.extractTextFromSection(match[2]);
    }
    
    return null;
  }
  
  /**
   * Extract clean text from a section HTML
   */
  private extractTextFromSection(sectionHtml: string): string {
    // Remove style tags and their content
    let text = sectionHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove script tags and their content
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    // Convert list items to bullet points
    text = text.replace(/<li[^>]*>/gi, '\n• ');
    
    // Convert paragraphs to double newlines
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<p[^>]*>/gi, '');
    
    // Convert headings to uppercase with newlines
    text = text.replace(/<h([1-6])[^>]*>([^<]+)<\/h\1>/gi, (match, level, content) => {
      return `\n\n**${content.toUpperCase()}**\n\n`;
    });
    
    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s+/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    
    return text.trim();
  }
  
  /**
   * List available sections in the report
   */
  private listAvailableSections(html: string): string {
    const sections: string[] = [];
    const idPattern = /<section\s+id=["']([^"']+)["']>/gi;
    let match;
    
    while ((match = idPattern.exec(html)) !== null) {
      const sectionId = match[1];
      // Convert ID to readable title
      const title = sectionId.replace(/([a-z])([A-Z])/g, '$1 $2')
                            .replace(/^./, str => str.toUpperCase());
      sections.push(`• ${title}`);
    }
    
    return sections.join('\n');
  }
  
  /**
   * Convert string to title case
   */
  private titleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  /**
   * Validate subscription ID format
   */
  validateSubscriptionId(id: any): { valid: boolean; sanitized?: string; error?: string } {
    if (!id || typeof id !== 'string') {
      return { valid: false, error: 'Subscription ID must be a string' };
    }

    // Remove whitespace
    const trimmed = id.trim();

    // Check for empty
    if (!trimmed) {
      return { valid: false, error: 'Subscription ID cannot be empty' };
    }

    // Check format - allow digits or sub-{timestamp}-{random} format
    if (!/^(\d+|sub-\d+-\w+)$/.test(trimmed)) {
      return { valid: false, error: 'Invalid subscription ID format' };
    }

    // Check length
    if (trimmed.length > 50) {
      return { valid: false, error: 'Subscription ID too long' };
    }

    // For numeric IDs, remove leading zeros
    let sanitized = trimmed;
    if (/^\d+$/.test(trimmed)) {
      sanitized = trimmed.replace(/^0+/, '') || '0';
      
      // Check for zero
      if (sanitized === '0') {
        return { valid: false, error: 'Invalid subscription ID' };
      }
    }

    return { valid: true, sanitized };
  }

  /**
   * Validate user ID format
   */
  validateUserId(userId: any): { valid: boolean; error?: string } {
    if (!userId || typeof userId !== 'string') {
      return { valid: false, error: 'User ID must be a string' };
    }

    // Check format - allow user-{timestamp}-{random}, facilitator-{number}, respondent-{number}, or database IDs (CUIDs)
    // CUIDs start with 'c' and contain lowercase letters and numbers
    if (!/^((user|facilitator|respondent)-[\d\w-]+|c[a-z0-9]{20,})$/.test(userId)) {
      return { valid: false, error: 'Invalid user ID format' };
    }

    return { valid: true };
  }

  /**
   * Sanitize query input
   */
  sanitizeQuery(query: string): string {
    // Remove HTML tags
    let sanitized = query.replace(/<[^>]*>/g, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    return sanitized.trim();
  }

  /**
   * Rate limiter for queries
   */
  private rateLimiter = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check rate limit for user
   */
  checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const limit = 5; // 5 queries per minute
    const window = 60000; // 1 minute

    const userLimit = this.rateLimiter.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimiter.set(userId, {
        count: 1,
        resetTime: now + window
      });
      return true;
    }

    if (userLimit.count >= limit) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Clear rate limiter (for testing)
   */
  clearRateLimiter(): void {
    this.rateLimiter.clear();
  }
}

// Export singleton instance
export const reportContextService = ReportContextService.getInstance();