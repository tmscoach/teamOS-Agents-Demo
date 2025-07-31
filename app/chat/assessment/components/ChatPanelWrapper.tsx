"use client";

import React, { useState, useEffect } from "react";
import { ChatPanel } from "./ChatPanel";
import { Message } from 'ai';
import { VoiceState } from '@/src/lib/services/voice';

interface ChatPanelWrapperProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  voiceState?: VoiceState;
  onVoiceToggle?: () => void;
  audioLevel?: number;
}

export function ChatPanelWrapper({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading,
  voiceState,
  onVoiceToggle,
  audioLevel
}: ChatPanelWrapperProps) {
  // Pass the actual AI chat props to ChatPanel
  return (
    <ChatPanel 
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      voiceState={voiceState}
      onVoiceToggle={onVoiceToggle}
      audioLevel={audioLevel}
    />
  );
}