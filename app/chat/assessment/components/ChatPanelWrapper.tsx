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
  // For now, we'll use the Figma ChatPanel as-is for the exact styling
  // In a production version, we would modify ChatPanel to accept these props
  // and integrate with the actual AI responses
  
  return <ChatPanel />;
}