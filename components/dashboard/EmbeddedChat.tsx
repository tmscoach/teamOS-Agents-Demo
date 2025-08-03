'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from 'ai/react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { Oscar1 } from '@/app/chat/components/icons/Oscar1'
import { cn } from '@/lib/utils'

const WIDGET_CONVERSATION_KEY = 'teamOS-widget-conversation'

export interface EmbeddedChatProps {
  agentName?: string;
  testMode?: boolean;
  initiallyExpanded?: boolean;
  onHandoff?: (toAgent: string) => void;
}

export function EmbeddedChat({ 
  agentName = 'OrchestratorAgent',
  testMode = false,
  initiallyExpanded = false,
  onHandoff
}: EmbeddedChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [currentAgent, setCurrentAgent] = useState(agentName)
  
  // Use the useChat hook for streaming
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } = useChat({
    api: '/api/agents/chat-streaming',
    body: {
      conversationId,
      agentName: currentAgent,
      testMode
    },
    id: conversationId || undefined,
    initialMessages: [],
    onResponse(response) {
      // Extract conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-ID')
      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId)
        localStorage.setItem(WIDGET_CONVERSATION_KEY, newConversationId)
      }
    },
    onFinish(message) {
      // Check for agent handoffs in the message
      if (message.content.includes('[Handover to') || message.content.includes('You are now connected to')) {
        const agentMatch = message.content.match(/\[Handover to (\w+) Agent\.\.\.\]|connected to the (\w+) Agent/)
        if (agentMatch) {
          const newAgent = agentMatch[1] || agentMatch[2]
          const fullAgentName = `${newAgent}Agent`
          setCurrentAgent(fullAgentName)
          if (onHandoff) {
            onHandoff(fullAgentName)
          }
        }
      }
      
      // Check if orchestrator wants to show assessment modal
      if (message.metadata?.suggestAssessmentModal) {
        window.dispatchEvent(new CustomEvent('show-assessment-modal'))
      }
    }
  })
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Load existing widget conversation on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem(WIDGET_CONVERSATION_KEY)
    if (storedConversationId) {
      setConversationId(storedConversationId)
      // Could load existing messages here if needed
    } else {
      // Send initial greeting with first message flag
      append({ 
        role: 'user', 
        content: '',
        metadata: { isFirstMessage: true }
      })
    }
  }, [])
  
  // Listen for assessment selection events
  useEffect(() => {
    const handleAssessmentSelected = (event: CustomEvent) => {
      const { assessment } = event.detail
      // Send message to orchestrator about assessment selection
      append({
        role: 'user',
        content: `I want to start the ${assessment} assessment`,
        metadata: { selectedAssessment: assessment }
      })
    }
    
    window.addEventListener('assessment-selected', handleAssessmentSelected as EventListener)
    return () => {
      window.removeEventListener('assessment-selected', handleAssessmentSelected as EventListener)
    }
  }, [append])
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    handleSubmit(e)
  }
  
  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      OrchestratorAgent: 'text-blue-600',
      OnboardingAgent: 'text-green-600',
      AssessmentAgent: 'text-purple-600',
      ProgressMonitor: 'text-orange-600',
      LearningAgent: 'text-pink-600',
      AlignmentAgent: 'text-indigo-600',
      NudgeAgent: 'text-yellow-600',
      RecognitionAgent: 'text-red-600'
    }
    return colors[agent] || 'text-gray-600'
  }
  
  const getAgentName = (agent: string) => {
    return agent.replace('Agent', '').replace('Monitor', ' Monitor')
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Current agent indicator */}
      {(currentAgent !== 'OrchestratorAgent' || testMode) && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-600">
            Connected to <span className={cn('font-medium', getAgentColor(currentAgent))}>
              {getAgentName(currentAgent)}
            </span>
            {testMode && <span className="ml-2 text-orange-600">(Test Mode)</span>}
          </p>
        </div>
      )}
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Oscar1 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Hi! I'm Osmo, your team transformation assistant.</p>
            <p className="text-gray-400 text-xs mt-1">Ask me anything about your team's journey.</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content || '...'}
              </p>
            </div>
            
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <form onSubmit={handleFormSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}