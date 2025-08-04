'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { UseChatHelpers } from 'ai/react';
import type { ChatContext, ChatState, ChatPlugin } from '../types';

interface ChatProviderValue {
  chat: UseChatHelpers;
  context: ChatContext;
  state: ChatState;
  plugins: ChatPlugin[];
  onOpen: () => void;
  onClose: () => void;
}

const ChatProviderContext = createContext<ChatProviderValue | null>(null);

export function ChatProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ChatProviderValue;
}) {
  return (
    <ChatProviderContext.Provider value={value}>
      {children}
    </ChatProviderContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatProviderContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}