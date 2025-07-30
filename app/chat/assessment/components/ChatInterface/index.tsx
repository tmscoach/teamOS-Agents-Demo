"use client";

import { useEffect, useRef } from 'react';
import { Message } from 'ai';
import CollapsedChat from './CollapsedChat';
import ExpandedChat from './ExpandedChat';
import { VoiceState } from '@/src/lib/services/voice';

interface WorkflowState {
  subscriptionId: string;
  workflowId: string;
  currentPageId: number;
  currentSectionId: number;
  baseContentId: number;
  questions: any[];
  navigationInfo: any;
  completionPercentage: number;
}

interface ChatInterfaceProps {
  agentName: string;
  assessmentType: string;
  visibleSection: string;
  expanded: boolean;
  onToggle: () => void;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  workflowState: WorkflowState | null;
  voiceState?: VoiceState;
  onVoiceToggle?: () => void;
  audioLevel?: number;
}

export default function ChatInterface({ 
  agentName, 
  assessmentType, 
  visibleSection, 
  expanded, 
  onToggle,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  workflowState,
  voiceState,
  onVoiceToggle,
  audioLevel
}: ChatInterfaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    
    // Refocus the input after response
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  if (!expanded) {
    return (
      <CollapsedChat
        onToggle={onToggle}
        inputRef={inputRef}
        voiceState={voiceState}
        onVoiceToggle={onVoiceToggle}
        audioLevel={audioLevel}
      />
    );
  }

  return (
    <ExpandedChat
      messages={messages}
      isLoading={isLoading}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleFormSubmit}
      inputRef={inputRef}
      workflowState={workflowState}
      assessmentType={assessmentType}
      onToggle={onToggle}
      voiceState={voiceState}
      onVoiceToggle={onVoiceToggle}
      audioLevel={audioLevel}
    />
  );
}