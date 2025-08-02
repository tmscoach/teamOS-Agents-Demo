'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChat } from 'ai/react';
import { cn } from '@/lib/utils';
import { getActivePlugins } from './plugins/registry';
import { ChatProvider } from './components/ChatProvider';
import { ChatContainer } from './components/ChatContainer';
import type { UnifiedChatProps, ChatContext, ChatState, JourneyPhase } from './types';

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
    () => getActivePlugins(agent, mode, customPlugins),
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
      id: initialContext?.conversation?.id || crypto.randomUUID(),
      messages: [],
    },
    metadata: initialContext?.metadata,
  }), [mode, position, agent, initialContext]);

  // Use the unified API endpoint
  const chat = useChat({
    api: '/api/agents/unified',
    body: {
      agent,
      mode,
      context,
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setState(prev => ({ ...prev, error: error.message }));
    },
  });

  // Handle proactive messages
  useEffect(() => {
    if (proactiveMessage && state.isOpen && chat.messages.length === 0) {
      // Send proactive message when chat opens for the first time
      handleProactiveMessage(proactiveMessage);
    }
  }, [proactiveMessage, state.isOpen, chat.messages.length]);

  // Handle plugin lifecycle
  useEffect(() => {
    setState(prev => ({
      ...prev,
      activePlugins: activePlugins.map(p => p.name),
    }));

    // Initialize plugins
    activePlugins.forEach(plugin => {
      if (plugin.handlers?.onStateChange) {
        plugin.handlers.onStateChange(state, context);
      }
    });
  }, [activePlugins, state, context]);

  const handleProactiveMessage = async (message: any) => {
    // For dashboard landing, show the appropriate welcome message
    if (message.type === 'dashboard_landing') {
      const { hasCompletedTMP, journeyPhase } = message.data;
      
      let proactiveContent = '';
      if (!hasCompletedTMP) {
        proactiveContent = `Welcome to your teamOS dashboard! 🎉

I'm Oskar, here to guide you through your team transformation journey.

Let's start by learning about your leadership style with the Team Management Profile. It only takes 15 minutes and you'll get:
• Your personal work preferences profile
• Insights into your team role
• 5000 credits to assess your team

Ready to begin? Just type "start TMP" or click the assessment button above!`;
      } else {
        proactiveContent = `Welcome back! I'm here to help guide your team transformation journey.

How can I assist you today?`;
      }
      
      // Add the proactive message directly to the chat
      chat.append({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: proactiveContent,
      });
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