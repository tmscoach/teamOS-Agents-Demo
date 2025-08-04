import { ChatPlugin, ChatContext, ActionResult, MessageHandlerResult } from '../types';

// Action patterns and their handlers
const ACTION_PATTERNS = [
  {
    pattern: /^start\s+(tmp|team\s*management\s*profile)/i,
    action: 'start_tmp',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      // Check if user has already completed TMP
      if (context.user.hasCompletedTMP) {
        return {
          success: true,
          type: 'message',
          data: {
            content: "You've already completed your TMP! Would you like to review your results or assess your team members?"
          }
        };
      }
      
      try {
        // Fetch the user's TMP subscription ID
        const response = await fetch('/api/mock-tms/dashboard-subscriptions', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const tmpSubscription = data.subscriptions?.find(
            (sub: any) => sub.AssessmentType === 'TMP' && 
            (sub.Status === 'Not Started' || sub.Status === 'In Progress')
          );
          
          if (tmpSubscription) {
            return {
              success: true,
              type: 'redirect',
              data: {
                url: `/chat/assessment?agent=AssessmentAgent&subscriptionId=${tmpSubscription.SubscriptionID}`,
                message: "Great! I'll take you to complete your Team Management Profile now. You'll earn 5000 credits!"
              }
            };
          }
        }
      } catch (error) {
        console.error('[ActionPlugin] Error fetching subscriptions:', error);
      }
      
      // Fallback if we can't get the subscription ID
      return {
        success: true,
        type: 'message',
        data: {
          content: "I'm having trouble starting your TMP assessment. Please try clicking the 'Complete your first profile' button above."
        }
      };
    }
  },
  {
    pattern: /^start\s+(team\s*signals|ts)/i,
    action: 'start_team_signals',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      return {
        success: true,
        type: 'redirect',
        data: {
          url: '/chat/assessment?agent=AssessmentAgent&type=TeamSignals&autoStart=true',
          message: "Let's start the Team Signals assessment for your team."
        }
      };
    }
  },
  {
    pattern: /^(view|show|see)\s*(my\s*)?(tmp\s*)?(results?|report|profile)/i,
    action: 'view_results',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      if (!context.user.hasCompletedTMP) {
        return {
          success: true,
          type: 'message',
          data: {
            content: "You haven't completed your TMP yet. Would you like to start it now? You'll earn 5000 credits!"
          }
        };
      }
      
      return {
        success: true,
        type: 'redirect',
        data: {
          url: '/chat/debrief?agent=DebriefAgent&reportType=TMP',
          message: "I'll show you your TMP results with a detailed debrief."
        }
      };
    }
  },
  {
    pattern: /^invite\s+(.+@.+)\s*(to\s*team)?/i,
    action: 'invite_team_member',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      const email = match[1];
      
      // In real implementation, this would check if TeamManagementAgent is available
      return {
        success: true,
        type: 'redirect',
        data: {
          url: `/chat?agent=TeamManagementAgent&action=invite&email=${encodeURIComponent(email)}`,
          message: `I'll connect you with our Team Management system to invite ${email}.`
        }
      };
    }
  },
  {
    pattern: /^(show|view)\s*(team\s*)?(progress|metrics|dashboard)/i,
    action: 'view_progress',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      return {
        success: true,
        type: 'redirect',
        data: {
          url: '/dashboard',
          message: "I'll take you to your team dashboard to view progress."
        }
      };
    }
  },
  // Assessment answer patterns
  {
    pattern: /(?:answer|set|enter)?\s*([0-2]-[0-2])\s*(?:for|to)?\s*(?:question|q)?\s*(\d+)/i,
    action: 'set_assessment_answer',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      if (context.agent !== 'AssessmentAgent') {
        return {
          success: false,
          type: 'message',
          data: {
            content: "I can only help with assessment answers when you're on the assessment page."
          }
        };
      }
      
      const [_, value, questionId] = match;
      return {
        success: true,
        type: 'message',
        data: {
          content: `I understand you want to set answer ${value} for question ${questionId}. \n\nTo record this answer:\n1. Look for Question ${questionId} on the page\n2. Click on the sliding scale below the question\n3. Select the ${value} position\n\nThe scale shows:\n• 2-0 = Strongly prefer left statement\n• 1-1 = Balanced between both\n• 0-2 = Strongly prefer right statement\n\nYour progress is saved automatically as you make selections.`
        }
      };
    }
  },
  // Navigate assessment pages
  {
    pattern: /^(next\s*page|continue|proceed|move\s*on|skip)/i,
    action: 'navigate_assessment',
    handler: async (match: RegExpMatchArray, context: ChatContext): Promise<ActionResult> => {
      if (context.agent !== 'AssessmentAgent') {
        return {
          success: false,
          type: 'message',
          data: {
            content: "Navigation commands are only available during assessments."
          }
        };
      }
      
      return {
        success: true,
        type: 'message',
        data: {
          content: `To move to the next page:\n\n1. Make sure you've answered all questions on this page\n2. Click the "Next" button at the bottom of the questionnaire\n\nIf the button is disabled, check if you've missed any questions. Each question needs an answer before you can proceed.`
        }
      };
    }
  }
];

// The Action Plugin
export const ActionPlugin: ChatPlugin = {
  name: 'action',
  version: '1.0.0',
  
  handlers: {
    onMessage: async (message, context) => {
      const content = message.content.trim();
      
      // Check each pattern
      for (const actionPattern of ACTION_PATTERNS) {
        const match = content.match(actionPattern.pattern);
        if (match) {
          const result = await actionPattern.handler(match, context);
          
          // Handle different result types
          if (result.type === 'redirect') {
            // In real implementation, this would trigger a navigation
            return {
              handled: true,
              response: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.data.message || 'Redirecting...'
              },
              sideEffects: [{
                type: 'navigate',
                payload: { url: result.data.url }
              }]
            };
          } else if (result.type === 'message') {
            return {
              handled: true,
              response: {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.data.content
              }
            };
          }
        }
      }
      
      // Not an action command
      return { handled: false };
    }
  },
  
  tools: [
    {
      name: 'execute_action',
      description: 'Execute a cross-agent action',
      parameters: {
        action: 'string',
        params: 'object'
      },
      handler: async (params, context) => {
        // This tool allows agents to programmatically execute actions
        const pattern = ACTION_PATTERNS.find(p => p.action === params.action);
        if (pattern && pattern.handler) {
          return pattern.handler(['', params.action] as RegExpMatchArray, context);
        }
        return { success: false, error: 'Unknown action' };
      }
    }
  ]
};