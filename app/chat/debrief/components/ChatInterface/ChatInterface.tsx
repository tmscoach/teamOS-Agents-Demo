"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebriefChat } from '../../hooks/useDebriefChat';
import { ParsedReport } from '@/src/lib/utils/report-parser';
import CollapsedChat from './CollapsedChat';
import ExpandedChat from './ExpandedChat';

interface ChatInterfaceProps {
  agentName: string;
  reportType: string;
  visibleSection: string;
  expanded: boolean;
  onToggle: () => void;
  reportData?: ParsedReport;
}

export default function ChatInterface({ 
  agentName, 
  reportType, 
  visibleSection, 
  expanded, 
  onToggle,
  reportData 
}: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get('subscriptionId');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  } = useDebriefChat({
    agentName,
    reportType,
    subscriptionId,
    reportData
  });

  // Add welcome message on first expansion
  useEffect(() => {
    if (expanded && messages.length === 0) {
      // The welcome message will be handled by the initial API call
    }
  }, [expanded, messages.length]);

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const chatElement = document.getElementById('chat-interface');
      if (chatElement && !chatElement.contains(e.target as Node) && expanded) {
        onToggle();
      }
    };

    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expanded, onToggle]);

  const handleSendMessage = async (input: string) => {
    await sendMessage(input, visibleSection);
    // Refocus the input after response
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  if (!expanded) {
    return (
      <CollapsedChat
        onToggle={onToggle}
        onSendMessage={handleSendMessage}
        inputRef={inputRef}
      />
    );
  }

  return (
    <ExpandedChat
      messages={messages}
      isLoading={isLoading}
      error={error}
      onSendMessage={handleSendMessage}
      inputRef={inputRef}
      reportData={reportData}
    />
  );
}