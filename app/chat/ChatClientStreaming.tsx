"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ChatLayout from "./components/ChatLayout";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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

export default function ChatClientStreaming() {
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
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Get agent from URL params
  const agentName = searchParams.get('agent') || 'OrchestratorAgent';
  const isNewConversation = searchParams.get('new') === 'true';

  // Enable streaming via environment variable
  const ENABLE_STREAMING = process.env.NEXT_PUBLIC_ENABLE_STREAMING === 'true';
  
  // Log for debugging
  useEffect(() => {
    console.log('[ChatClientStreaming] Component loaded, streaming enabled:', ENABLE_STREAMING);
  }, []);

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


  const sendMessageStreaming = useCallback(async (messageContent: string) => {
    console.log('[sendMessageStreaming] Called with:', messageContent, 'loading:', loading);
    if (!messageContent.trim() || loading) return;

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setSuggestedValues(null);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder for assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      console.log('[sendMessageStreaming] Sending request to /api/agents/chat-streaming');
      
      // Add timeout for initial connection
      const timeoutId = setTimeout(() => {
        console.error('[sendMessageStreaming] Request timeout after 30s');
        abortControllerRef.current?.abort();
      }, 30000);
      
      const response = await fetch("/api/agents/chat-streaming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent,
          conversationId,
          agentName
        }),
        signal: abortControllerRef.current.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      console.log('[sendMessageStreaming] Starting to read stream');
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[sendMessageStreaming] Stream reading complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            console.log('[sendMessageStreaming] Received data:', data);
            
            if (data === '[DONE]') {
              // Mark streaming as complete
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              switch (parsed.type) {
                case 'metadata':
                  if (parsed.conversationId) {
                    setConversationId(parsed.conversationId);
                    localStorage.setItem(CONVERSATION_STORAGE_KEY, parsed.conversationId);
                  }
                  break;
                  
                case 'extraction':
                  if (parsed.extractedData) {
                    setExtractedData(prev => ({ ...prev, ...parsed.extractedData }));
                  }
                  break;
                  
                case 'message':
                  // Update the assistant message content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: parsed.content }
                      : msg
                  ));
                  
                  // Handle metadata like suggested values
                  if (parsed.metadata?.suggestedValues) {
                    setSuggestedValues(parsed.metadata.suggestedValues);
                  }
                  
                  // Handle redirect from AssessmentAgent
                  if (parsed.metadata?.requiresRedirect && parsed.metadata?.redirectUrl) {
                    console.log('[ChatClient Streaming] Redirecting to:', parsed.metadata.redirectUrl);
                    setTimeout(() => {
                      window.location.href = parsed.metadata.redirectUrl;
                    }, 1500); // Give user time to read the message
                  }
                  break;
                  
                case 'error':
                  throw new Error(parsed.error);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        // Remove the placeholder message on abort
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      } else {
        console.error('Streaming chat error:', error);
        // Update the message with error
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: "Sorry, I encountered an error. Please try again.", isStreaming: false }
            : msg
        ));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, agentName, loading]);

  const sendMessageNonStreaming = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || loading) return;

    setLoading(true);
    setSuggestedValues(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch("/api/agents/chat-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          conversationId,
          agentName
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
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
      }
      
      // Handle suggested values from metadata
      if (data.metadata?.suggestedValues) {
        setSuggestedValues(data.metadata.suggestedValues);
      } else {
        setSuggestedValues(null);
      }
      
      // Handle redirect from AssessmentAgent
      if (data.metadata?.requiresRedirect && data.metadata?.redirectUrl) {
        console.log('[ChatClient] Redirecting to:', data.metadata.redirectUrl);
        setTimeout(() => {
          window.location.href = data.metadata.redirectUrl;
        }, 1500); // Give user time to read the message
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
  }, [conversationId, agentName, loading]);

  // Use streaming or non-streaming based on feature flag
  const sendMessage = ENABLE_STREAMING ? sendMessageStreaming : sendMessageNonStreaming;

  // Auto-start conversation ONLY for explicitly new chats
  useEffect(() => {
    const hasAuth = user || (devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
    console.log('[Auto-start] Checking conditions:', {
      isLoaded,
      hasAuth,
      isNewConversation,
      autoStarted,
      messagesLength: messages.length,
      loading,
      loadingConversation
    });
    
    if (isLoaded && hasAuth && isNewConversation && !autoStarted && messages.length === 0 && !loading && !loadingConversation) {
      console.log('[Auto-start] Starting new conversation...');
      localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      setAutoStarted(true);
      // Send an initial empty message to trigger the agent's greeting
      sendMessage(" "); // Single space to pass validation
    }
  }, [isLoaded, user, isNewConversation, autoStarted, messages.length, loading, loadingConversation, devAuthChecked, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  console.log('[ChatClientStreaming] Rendering with state:', {
    messagesCount: messages.length,
    loading,
    conversationId,
    ENABLE_STREAMING
  });

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
        onSendMessage={() => sendMessage(input)}
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