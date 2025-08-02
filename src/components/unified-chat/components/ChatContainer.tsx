'use client';

import { useChatContext } from './ChatProvider';
import { ChatSidebar } from './ChatSidebar';
import { ChatOverlay } from './ChatOverlay';

export function ChatContainer() {
  const { context } = useChatContext();

  // Render different containers based on position
  switch (context.position) {
    case 'left-sidebar':
    case 'right-sidebar':
      return <ChatSidebar />;
    
    case 'overlay':
      return <ChatOverlay />;
    
    default:
      return <ChatSidebar />;
  }
}