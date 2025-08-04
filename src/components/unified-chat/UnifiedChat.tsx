'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChat } from 'ai/react';
import { cn } from '@/lib/utils';
import { getActivePlugins } from './plugins/registry';
import { ChatProvider } from './components/ChatProvider';
import { ChatContainer } from './components/ChatContainer';
import type { UnifiedChatProps, ChatContext, ChatState } from './types';
import { JourneyPhase } from './types';

export function UnifiedChat({
  mode = 'standard',
  position = 'right-sidebar',
  agent = 'OrchestratorAgent',
  plugins: customPlugins,
  initialContext,
  defaultOpen = false,
  proactiveMessage,
  onClose,
  className,
}: UnifiedChatProps) {
  // Chat state
  const [state, setState] = useState<ChatState>({
    isOpen: defaultOpen,
    isLoading: false,
    activePlugins: [],
  });

  // Get active plugins for this configuration
  const activePlugins = useMemo(
    () => {
      const plugins = getActivePlugins(agent, mode, customPlugins);
      console.log(`[UnifiedChat] Active plugins for ${agent}:`, plugins.map(p => p.name));
      return plugins;
    },
    [agent, mode, customPlugins]
  );

  // Build chat context
  const context: ChatContext = useMemo(() => ({
    mode,
    position,
    agent,
    user: {
      id: initialContext?.user?.id || '',
      name: initialContext?.user?.name || '',
      hasCompletedTMP: initialContext?.user?.hasCompletedTMP || false,
      credits: initialContext?.user?.credits || 0,
    },
    journey: {
      phase: initialContext?.journey?.phase || JourneyPhase.ASSESSMENT,
      completedSteps: initialContext?.journey?.completedSteps || [],
      nextMilestone: initialContext?.journey?.nextMilestone || 'Complete TMP',
    },
    conversation: {
      id: initialContext?.conversation?.id || `${agent}-${Date.now()}-${crypto.randomUUID()}`,
      messages: [],
    },
    metadata: {
      ...initialContext?.metadata,
      subscriptionId: (initialContext as any)?.subscriptionId,
      assessmentType: (initialContext as any)?.assessmentType,
    },
  }), [mode, position, agent, initialContext]);

  // Use the chat streaming API endpoint
  const chat = useChat({
    api: '/api/agents/chat-streaming',
    body: {
      agentName: agent,
      // Don't pass conversationId for new chats - let the API create one
      selectedAssessment: context.metadata?.selectedAssessment,
      metadata: context.metadata,
    },
    onError: (error) => {
      console.error('[UnifiedChat] Chat error:', error);
      console.error('[UnifiedChat] Error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      setState(prev => ({ ...prev, error: error.message }));
    },
    onResponse: (response) => {
      console.log('[UnifiedChat] ==== RESPONSE RECEIVED ====');
      console.log('[UnifiedChat] Response status:', response.status);
      console.log('[UnifiedChat] Response headers:', response.headers);
      console.log('[UnifiedChat] ==== END RESPONSE ====');
    },
    onFinish: (message, { finishReason }) => {
      console.log('[UnifiedChat] ==== MESSAGE FINISHED ====');
      console.log('[UnifiedChat] Full content:', message.content);
      console.log('[UnifiedChat] Content length:', message.content.length);
      console.log('[UnifiedChat] Finish reason:', finishReason);
      console.log('[UnifiedChat] Has ASSESSMENT_ACTION:', message.content.includes('[ASSESSMENT_ACTION:'));
      
      if (message.content.includes('[ASSESSMENT_ACTION:')) {
        const matches = message.content.match(/\[ASSESSMENT_ACTION:([^\]]+)\]/g);
        console.log('[UnifiedChat] Found action tags:', matches);
      }
      
      // Log for debugging but let the plugin handle the actual processing
      if (message.content.includes('[ASSESSMENT_ACTION:')) {
        console.log('[UnifiedChat] Message contains assessment actions, plugin will handle processing');
        const matches = message.content.match(/\[ASSESSMENT_ACTION:([^\]]+)\]/g);
        console.log('[UnifiedChat] Action tags found:', matches);
      }
      
      // Handle any action responses from plugins
      if (message.content.includes('redirect:')) {
        const urlMatch = message.content.match(/redirect:\s*(\S+)/);
        if (urlMatch) {
          window.location.href = urlMatch[1];
        }
      }
    }
  });

  // Handle proactive messages
  useEffect(() => {
    if (state.isOpen && chat.messages.length === 0) {
      if (proactiveMessage) {
        // Send configured proactive message when chat opens for the first time
        handleProactiveMessage(proactiveMessage);
      } else if (agent === 'AssessmentAgent') {
        // Show assessment-specific welcome message
        const assessmentType = context.metadata?.assessmentType || 'TMP';
        const assessmentName = assessmentType === 'TMP' ? 'Team Management Profile' :
                             assessmentType === 'QO2' ? 'Opportunities-Obstacles Quotient' :
                             assessmentType === 'TeamSignals' ? 'Team Signals 360' : 
                             'assessment';
        
        const welcomeContent = `Welcome to your ${assessmentName} assessment! 👋

Here's how to complete the questionnaire:
• Each question shows two contrasting statements
• Use the sliding scale (0-2) to indicate your preference
• 2-0 = strongly prefer left, 0-2 = strongly prefer right
• 1-1 = balanced between both

Take your time - there are no wrong answers! I'm here if you need help.`;
        
        console.log('[UnifiedChat] Adding assessment proactive message for type:', assessmentType);
        chat.setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: welcomeContent,
        }]);
      }
    }
  }, [proactiveMessage, state.isOpen, chat.messages.length, agent]);

  // Handle plugin lifecycle
  useEffect(() => {
    setState(prev => ({
      ...prev,
      activePlugins: activePlugins.map(p => p.name),
    }));
  }, [activePlugins]);
  
  // Handle plugin state changes separately
  useEffect(() => {
    activePlugins.forEach(plugin => {
      if (plugin.handlers?.onStateChange) {
        plugin.handlers.onStateChange(state, context);
      }
    });
  }, [activePlugins, state.isOpen]); // Only react to isOpen changes, not all state changes

  const handleProactiveMessage = async (message: any) => {
    try {
      // For dashboard landing, show the appropriate welcome message
      if (message.type === 'dashboard_landing') {
        const { hasCompletedTMP, journeyPhase } = message.data;
        
        let proactiveContent = '';
        if (!hasCompletedTMP) {
          proactiveContent = `Welcome to your teamOS dashboard! 🎉

I'm Osmo, here to guide you through your team transformation journey.

Let's start by learning about your leadership style with the Team Management Profile. It only takes 15 minutes and you'll get:
• Your personal work preferences profile
• Insights into your team role
• 5000 credits to assess your team

Ready to begin? Just type "start TMP" or click the assessment button above!`;
        } else {
          proactiveContent = `Welcome back! I'm here to help guide your team transformation journey.

How can I assist you today?`;
        }
        
        console.log('[UnifiedChat] Adding proactive message');
        // Add the proactive message directly to the messages without triggering API call
        chat.setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: proactiveContent,
        }]);
      }
    } catch (error) {
      console.error('[UnifiedChat] Error handling proactive message:', error);
    }
  };

  const handleOpen = () => {
    setState(prev => ({ ...prev, isOpen: true }));
  };

  const handleClose = () => {
    setState(prev => ({ ...prev, isOpen: false }));
    onClose?.();
  };

  return (
    <ChatProvider
      value={{
        chat,
        context,
        state,
        plugins: activePlugins,
        onOpen: handleOpen,
        onClose: handleClose,
      }}
    >
      <div className={cn('unified-chat', `unified-chat--${position}`, className)}>
        <ChatContainer />
      </div>
    </ChatProvider>
  );
}