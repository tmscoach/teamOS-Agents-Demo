"use client";

import { useCallback, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { ParsedReport } from '@/src/lib/utils/report-parser';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseDebriefChatOptions {
  agentName: string;
  reportType: string;
  subscriptionId: string | null;
  reportData?: ParsedReport;
}

export function useDebriefChat(options: UseDebriefChatOptions) {
  const { agentName, reportType, subscriptionId, reportData } = options;
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Use the AI SDK's useChat hook for proper streaming support
  const {
    messages: chatMessages,
    error,
    isLoading,
    append,
    setMessages: setChatMessages
  } = useChat({
    api: '/api/chat/debrief',
    onResponse: (response) => {
      // Extract conversation ID from response headers
      const convId = response.headers.get('X-Conversation-ID');
      if (convId && !conversationId) {
        setConversationId(convId);
      }
    },
    onError: (error) => {
      console.error('Debrief chat error:', error);
    }
  });

  // Convert AI SDK messages to our Message format
  const messages: Message[] = chatMessages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.createdAt || Date.now())
  }));

  const sendMessage = useCallback(async (content: string, visibleSection: string) => {
    if (isLoading || !content.trim()) return;

    // Use the append method from useChat to send messages
    await append({
      role: 'user',
      content: content.trim()
    }, {
      options: {
        body: {
          conversationId,
          agentName,
          reportType,
          subscriptionId,
          visibleSection,
          reportData: reportData ? {
            type: reportData.type,
            title: reportData.title,
            profile: reportData.profile,
            sections: reportData.sections?.map(s => ({
              id: s.id,
              title: s.title,
              content: s.content.substring(0, 500) // Limit content size
            }))
          } : undefined
        }
      }
    });
  }, [append, agentName, conversationId, isLoading, reportData, reportType, subscriptionId]);

  const clearMessages = useCallback(() => {
    setChatMessages([]);
    setConversationId(null);
  }, [setChatMessages]);

  const cancelRequest = useCallback(() => {
    // The useChat hook doesn't expose a cancel method, but requests are automatically aborted on unmount
    console.log('Cancel request called - requests will be aborted on component unmount');
  }, []);

  return {
    messages,
    isLoading,
    error: error?.message || null,
    sendMessage,
    clearMessages,
    cancelRequest
  };
}