"use client";

import React, { useState, useEffect } from "react";
import { ChatPanel } from "./ChatPanel";
import { Message } from 'ai';

interface ChatPanelWrapperProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatPanelWrapper({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading 
}: ChatPanelWrapperProps) {
  // Pass the actual AI chat props to ChatPanel
  return (
    <ChatPanel 
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}