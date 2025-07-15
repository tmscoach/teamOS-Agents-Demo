import { useState, useCallback } from 'react';

interface StreamingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseStreamingChatOptions {
  onExtractedData?: (data: any) => void;
  onMetadata?: (metadata: any) => void;
  onError?: (error: Error) => void;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    agentName?: string
  ) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    
    // Add user message immediately
    const userMessage: StreamingMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Create placeholder for assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: StreamingMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/agents/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          agentName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
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
                  }
                  options.onMetadata?.(parsed);
                  break;
                  
                case 'extraction':
                  options.onExtractedData?.(parsed.extractedData);
                  break;
                  
                case 'message':
                  // Update the assistant message content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: parsed.content, metadata: parsed.metadata }
                      : msg
                  ));
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
    } catch (error) {
      console.error('Streaming chat error:', error);
      options.onError?.(error as Error);
      
      // Remove the placeholder message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, isLoading, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    clearMessages
  };
}