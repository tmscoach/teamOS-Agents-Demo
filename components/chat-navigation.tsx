"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";

const CONVERSATION_STORAGE_KEY = 'teamOS-current-conversation';

export function ChatNavigation() {
  const router = useRouter();
  
  const handleContinueChat = () => {
    // Navigate without the "new" parameter to continue existing conversation
    router.push('/chat?agent=OnboardingAgent');
  };
  
  const handleNewChat = () => {
    // Navigate with "new=true" to start fresh
    router.push('/chat?agent=OnboardingAgent&new=true');
  };
  
  const hasExistingConversation = () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(CONVERSATION_STORAGE_KEY);
    }
    return false;
  };
  
  return (
    <div className="flex gap-4">
      {hasExistingConversation() && (
        <Button 
          onClick={handleContinueChat}
          variant="default"
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Continue Chat
        </Button>
      )}
      <Button 
        onClick={handleNewChat}
        variant={hasExistingConversation() ? "outline" : "default"}
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </Button>
    </div>
  );
}