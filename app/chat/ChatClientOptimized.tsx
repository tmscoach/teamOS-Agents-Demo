"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import ChatLayoutStreaming from './components/ChatLayoutStreaming';
// import SuggestedResponsesDialog from './components/SuggestedResponsesDialog';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from 'ai/react';

const CONVERSATION_STORAGE_KEY = 'teamOS-current-conversation';

interface ExtractedData {
  [key: string]: any;
}

interface OnboardingState {
  isComplete: boolean;
  requiredFieldsCount: number;
  capturedFieldsCount: number;
}

interface SuggestedValues {
  field: string;
  values: string[];
  helpText?: string;
}

export default function ChatClientOptimized() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentName = searchParams.get('agent') || 'OnboardingAgent';
  const isNewConversation = searchParams.get('new') === 'true';
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationRestored, setConversationRestored] = useState(false);
  const [shouldLoadExisting, setShouldLoadExisting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    isComplete: false,
    requiredFieldsCount: 0,
    capturedFieldsCount: 0
  });
  const [suggestedValues, setSuggestedValues] = useState<SuggestedValues | null>(null);
  const [devAuthChecked, setDevAuthChecked] = useState(false);
  const currentConversationIdRef = useRef<string | null>(null);

  // Use the useChat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: '/api/agents/chat-streaming',
    body: {
      conversationId,
      agentName
    },
    id: conversationId || undefined, // Important: this helps useChat manage message history
    initialMessages: [], // We'll load these from the API
    onResponse(response) {
      // Extract conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-ID');
      if (newConversationId) {
        currentConversationIdRef.current = newConversationId;
        if (newConversationId !== conversationId) {
          setConversationId(newConversationId);
          localStorage.setItem(CONVERSATION_STORAGE_KEY, newConversationId);
        }
      }
    },
    onFinish(message) {
      // After message is complete, fetch extraction data asynchronously
      // This allows the UI to become responsive immediately
      const convId = currentConversationIdRef.current || conversationId;
      console.log('Message finished, conversationId:', convId);
      if (convId) {
        // Use setTimeout to defer extraction fetch, making UI responsive immediately
        setTimeout(() => {
          fetchExtractionData(convId);
        }, 100);
      }
    },
    onError(error) {
      console.error('Chat error:', error);
    }
  });

  // Wrap handleSubmit to clear suggested values
  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSuggestedValues(null); // Clear suggested values when submitting
    handleSubmit(e);
  };

  // Check dev auth
  useEffect(() => {
    const checkDevAuth = async () => {
      if (!user && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development')) {
        try {
          const response = await fetch('/api/dev/check-auth');
          if (!response.ok) {
            router.push('/dev-login');
          } else {
            setDevAuthChecked(true);
          }
        } catch (error) {
          console.error('Dev auth check failed:', error);
          router.push('/dev-login');
        }
      }
    };

    if (isLoaded && !user) {
      checkDevAuth();
    }
  }, [user, isLoaded, router]);

  // Check for existing conversation on mount
  useEffect(() => {
    const hasAuth = user || (devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
    console.log('[ChatClient] Mount check:', { isLoaded, hasAuth, isNewConversation });
    
    if (isLoaded && hasAuth) {
      const storedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
      console.log('[ChatClient] Stored conversation ID:', storedConversationId);
      
      // If we have a stored conversation and no explicit "new" parameter
      if (storedConversationId && !isNewConversation) {
        console.log('[ChatClient] Loading existing conversation:', storedConversationId);
        setConversationId(storedConversationId);
        currentConversationIdRef.current = storedConversationId;
        setShouldLoadExisting(true);
        loadConversation(storedConversationId);
      }
      // If explicitly new or no stored conversation
      else if (isNewConversation || !storedConversationId) {
        console.log('[ChatClient] Starting new conversation');
        setShouldLoadExisting(false);
        // Clear any stored conversation ID
        if (isNewConversation) {
          localStorage.removeItem(CONVERSATION_STORAGE_KEY);
          setConversationId(null);
        }
        // If no stored conversation and not explicitly new, still start a new one
        if (!storedConversationId && !isNewConversation) {
          console.log('[ChatClient] No stored conversation, will trigger new conversation flow');
          // The greeting will be sent by the other useEffect
        }
      }
    }
  }, [isLoaded, user, devAuthChecked, isNewConversation]);

  // Track if we've sent the initial greeting
  const [greetingSent, setGreetingSent] = useState(false);
  
  // Send initial empty message for greeting when starting new conversation
  useEffect(() => {
    const hasAuth = user || (devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
    const shouldSendGreeting = isLoaded && hasAuth && !shouldLoadExisting && messages.length === 0 && !greetingSent;
    
    if (shouldSendGreeting) {
      const storedId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
      // Only send greeting if we're truly starting fresh (new=true or no stored conversation)
      if (isNewConversation || !storedId) {
        console.log('[ChatClient] Sending initial greeting message');
        setGreetingSent(true);
        append({ role: 'user', content: '' });
      }
    }
  }, [isLoaded, user, devAuthChecked, isNewConversation, messages.length, append, shouldLoadExisting, greetingSent]);

  const loadConversation = async (convId: string) => {
    try {
      const response = await fetch(`/api/agents/chat/conversation/${convId}`);
      if (response.ok) {
        const data = await response.json();
        setConversationRestored(true);
        setTimeout(() => setConversationRestored(false), 3000);
        
        // Load messages from conversation
        if (data.messages && data.messages.length > 0) {
          console.log(`Loaded conversation with ${data.messages.length} messages`);
          // Transform messages to the format expected by useChat
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id || `msg-${Date.now()}-${Math.random()}`,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.timestamp || msg.createdAt)
          }));
          setMessages(formattedMessages);
        }
        
        // Load extracted data and onboarding state
        if (data.extractedData) {
          setExtractedData(data.extractedData);
        }
        if (data.onboardingState) {
          setOnboardingState(data.onboardingState);
        }
      } else if (response.status === 404) {
        // Conversation not found, clear localStorage and start new
        console.log('Conversation not found, starting new');
        localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        setConversationId(null);
        router.push('/chat?agent=OnboardingAgent&new=true');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const fetchExtractionData = async (convId: string) => {
    try {
      console.log('Fetching extraction data for:', convId);
      const response = await fetch(`/api/agents/chat/extraction/${convId}`);
      console.log('Extraction response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Extraction data received:', data);
        
        if (data.extractedData) {
          console.log('Setting extracted data:', data.extractedData);
          setExtractedData(data.extractedData);
        }
        if (data.onboardingState) {
          setOnboardingState(data.onboardingState);
          
          // Auto-redirect when onboarding completes
          if (data.onboardingState.isComplete && agentName === 'OnboardingAgent') {
            // Clear suggested values before redirecting
            setSuggestedValues(null);
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        }
        
        // Handle suggested values only if onboarding is not complete
        if (data.metadata?.suggestedValues && !data.onboardingState?.isComplete) {
          console.log('Setting suggested values:', data.metadata.suggestedValues);
          setSuggestedValues(data.metadata.suggestedValues);
        } else if (data.onboardingState?.isComplete) {
          // Clear any existing suggested values when onboarding is complete
          setSuggestedValues(null);
        }
      } else {
        const errorData = await response.text();
        console.error('Extraction fetch failed:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching extraction data:', error);
    }
  };

  const startNewConversation = () => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    router.push(`/chat?agent=${agentName}&new=true`);
  };

  const handleSuggestedSelection = (value: string) => {
    handleInputChange({ target: { value } } as any);
    setSuggestedValues(null);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const hasAuth = user || (devAuthChecked && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENV === 'development'));
  if (!hasAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Authenticating...</div>
      </div>
    );
  }

  console.log('Rendering ChatClientOptimized with:', {
    extractedData,
    onboardingState,
    isOnboarding: agentName === 'OnboardingAgent',
    agentName
  });

  return (
    <>
      <ChatLayoutStreaming
        messages={messages}
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={customHandleSubmit}
        conversationRestored={conversationRestored}
        userName={user?.firstName || extractedData.user_name || undefined}
        onNewConversation={conversationId ? startNewConversation : undefined}
        extractedData={extractedData}
        onboardingState={onboardingState}
        isOnboarding={agentName === 'OnboardingAgent'}
        suggestedValues={suggestedValues || undefined}
        agentName={agentName}
      />
      {/* Suggested values are now shown inline in the chat */}
    </>
  );
}