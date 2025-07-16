"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ChatLayout from "./components/ChatLayout";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  [key: string]: any;
}

interface OnboardingState {
  isComplete: boolean;
  requiredFieldsCount: number;
  capturedFieldsCount: number;
}

const CONVERSATION_STORAGE_KEY = 'teamOS_activeConversationId';

export default function ChatClient() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const [conversationRestored, setConversationRestored] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isComplete: false,
    requiredFieldsCount: 0,
    capturedFieldsCount: 0
  });
  const [suggestedValues, setSuggestedValues] = useState<{
    field: string;
    values: string[];
    helpText?: string;
  } | null>(null);
  const [devAuthChecked, setDevAuthChecked] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  
  // Get agent from URL params
  const agentName = searchParams.get('agent') || 'OrchestratorAgent';
  const isNewConversation = searchParams.get('new') === 'true';

  useEffect(() => {
    if (isLoaded && !user && !devAuthChecked) {
      // In development, check if we have a dev auth cookie
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development') {
        // Check if __dev_auth cookie exists by trying to make an authenticated request
        fetch('/api/dev/check-auth')
          .then(res => {
            setDevAuthChecked(true);
            if (!res.ok) {
              router.push("/sign-in");
            }
          })
          .catch(() => {
            setDevAuthChecked(true);
            router.push("/sign-in");
          });
      } else {
        router.push("/sign-in");
      }
    }
  }, [isLoaded, user, router, devAuthChecked]);


  // Load existing conversation on mount
  useEffect(() => {
    const hasAuth = user || (devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
    if (isLoaded && hasAuth && !isNewConversation) {
      const loadExistingConversation = async () => {
        try {
          // Check localStorage for existing conversation
          const storedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
          
          if (storedConversationId) {
            // Try to load the conversation
            const response = await fetch(`/api/agents/chat/conversation/${storedConversationId}`);
            
            if (response.ok) {
              const data = await response.json();
              
              setConversationId(storedConversationId);
              
              // Convert messages from the conversation
              if (data.messages && data.messages.length > 0) {
                const formattedMessages: Message[] = data.messages.map((msg: any) => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                  timestamp: new Date(msg.timestamp)
                }));
                setMessages(formattedMessages);
                setConversationRestored(true);
                // Hide the restored indicator after 3 seconds
                setTimeout(() => setConversationRestored(false), 3000);
              }
            } else if (response.status === 404) {
              // Conversation not found, clear localStorage
              localStorage.removeItem(CONVERSATION_STORAGE_KEY);
            } else if (response.status === 403) {
              // Access denied, clear localStorage
              localStorage.removeItem(CONVERSATION_STORAGE_KEY);
            }
          } else {
            // If no localStorage, try to find the user's most recent conversation
            const recentResponse = await fetch(`/api/agents/chat/recent?agent=${agentName}`);
            
            if (recentResponse.ok) {
              const recentData = await recentResponse.json();
              if (recentData.conversationId) {
                setConversationId(recentData.conversationId);
                localStorage.setItem(CONVERSATION_STORAGE_KEY, recentData.conversationId);
                
                if (recentData.messages && recentData.messages.length > 0) {
                  const formattedMessages: Message[] = recentData.messages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp)
                  }));
                  setMessages(formattedMessages);
                  setConversationRestored(true);
                  setTimeout(() => setConversationRestored(false), 3000);
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to load existing conversation:", error);
        } finally {
          setLoadingConversation(false);
        }
      };

      loadExistingConversation();
    } else {
      if (isNewConversation) {
        localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      }
      setLoadingConversation(false);
    }
  }, [isLoaded, user, isNewConversation, agentName, devAuthChecked]);

  // Auto-start conversation ONLY for explicitly new chats
  useEffect(() => {
    const hasAuth = user || (devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
    if (isLoaded && hasAuth && isNewConversation && !autoStarted && messages.length === 0 && !loading && !loadingConversation) {
      // Clear any existing conversation from localStorage when starting new
      localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      // Send an initial empty message to trigger the agent's greeting
      const autoStart = async () => {
        setAutoStarted(true); // Set flag immediately to prevent duplicate calls
        setLoading(true);
        try {
          const response = await fetch("/api/agents/chat-simple", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: " ", // Single space to pass validation but prevent extraction
              conversationId: null,
              agentName: agentName
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to start conversation: ${response.statusText}`);
          }

          const data = await response.json();

          if (data.conversationId) {
            setConversationId(data.conversationId);
            // Store in localStorage
            localStorage.setItem(CONVERSATION_STORAGE_KEY, data.conversationId);
          }

          if (data.message) {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: data.message,
              timestamp: new Date()
            };
            setMessages([assistantMessage]);
          }

          // Handle extracted data and onboarding state
          if (data.extractedData) {
            setExtractedData(data.extractedData);
          }
          if (data.onboardingState) {
            setOnboardingState(data.onboardingState);
          }
          
          // Handle suggested values from initial greeting
          if (data.metadata?.suggestedValues) {
            setSuggestedValues(data.metadata.suggestedValues);
          }
        } catch (error) {
          console.error("Failed to auto-start conversation:", error);
        } finally {
          setLoading(false);
        }
      };

      autoStart();
    }
  }, [isLoaded, user, isNewConversation, agentName, autoStarted, loading, loadingConversation, devAuthChecked]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const messageContent = input.trim();  // Store the input value before clearing
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/agents/chat-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,  // Use the stored value
          conversationId: conversationId,
          agentName: agentName
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        // Store in localStorage
        localStorage.setItem(CONVERSATION_STORAGE_KEY, data.conversationId);
      }

      if (data.message) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      // Handle extracted data and onboarding state
      if (data.extractedData) {
        setExtractedData(data.extractedData);
      }
      if (data.onboardingState) {
        setOnboardingState(data.onboardingState);
        
        // Auto-redirect to dashboard when onboarding completes
        if (data.onboardingState.isComplete && data.currentAgent === 'OnboardingAgent') {
          console.log('[ChatClient] Onboarding complete, redirecting to dashboard...');
          // Show completion message briefly before redirect
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000); // 2 second delay to show completion message
        }
      }
      
      // Handle suggested values from metadata
      if (data.metadata?.suggestedValues) {
        setSuggestedValues(data.metadata.suggestedValues);
      } else {
        setSuggestedValues(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth or loading conversation
  const isCheckingAuth = !isLoaded || (!user && !devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
  
  if (isCheckingAuth || loadingConversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const startNewConversation = () => {
    // Clear localStorage
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    // Reset state
    setConversationId(null);
    setMessages([]);
    // Redirect to new conversation
    router.push(`/chat?agent=${agentName}&new=true`);
  };

  return (
    <>
      {conversationRestored && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md shadow-md">
          Conversation restored successfully
        </div>
      )}
      <ChatLayout
        messages={messages}
        input={input}
        setInput={setInput}
        onSendMessage={sendMessage}
        loading={loading}
        userName={user?.firstName || extractedData.user_name || undefined}
        agentName={agentName === 'OnboardingAgent' ? 'OSmos' : agentName}
        onNewConversation={conversationId ? startNewConversation : undefined}
        extractedData={extractedData}
        onboardingState={onboardingState}
        isOnboarding={agentName === 'OnboardingAgent'}
        suggestedValues={suggestedValues || undefined}
      />
    </>
  );
}