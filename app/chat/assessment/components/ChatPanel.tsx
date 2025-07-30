"use client";

import React, { useState, useEffect, useRef } from "react";
import { Oscar1 } from "./Oscar1";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface ChatPanelProps {
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'chat-panel-position';

export function ChatPanel({ className = "" }: ChatPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: "user" | "osmos" }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedPosition = JSON.parse(saved);
        setPosition(savedPosition);
      } catch (e) {
        console.error('Failed to parse saved position:', e);
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user" as const
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate OSmos response
    setTimeout(() => {
      const response = generateResponse(inputValue);
      const osmosMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "osmos" as const
      };
      setMessages(prev => [...prev, osmosMessage]);
    }, 800);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking the input or button
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 60);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const generateResponse = (input: string): string => {
    const lower = input.toLowerCase();
    
    if (lower.includes("persuade") || lower.includes("question 34")) {
      return "This question measures your preference between persuasion (influencing through emotional appeal) versus using the same approach. A 2-0 score means you strongly prefer persuasion, while 0-2 means you prefer consistency.";
    }
    
    if (lower.includes("future") || lower.includes("present") || lower.includes("question 35")) {
      return "This explores your time orientation. 'Future' thinkers focus on possibilities and long-term planning, while 'Present' thinkers concentrate on current realities and immediate needs.";
    }
    
    if (lower.includes("faith") || lower.includes("question 36")) {
      return "This question examines decision-making approaches. 'Faith' represents intuitive, belief-based decisions, while the alternative might represent more analytical approaches.";
    }
    
    if (lower.includes("imagination") || lower.includes("commonsense") || lower.includes("question 37")) {
      return "This measures creative versus practical thinking. 'Imagination' indicates preference for innovative, abstract ideas, while 'Commonsense' suggests practical, proven solutions.";
    }
    
    if (lower.includes("systems") || lower.includes("chaos") || lower.includes("question 38")) {
      return "This explores your comfort with structure. 'Systems' people prefer organized, methodical approaches, while 'Chaos' indicates comfort with flexibility and emergence.";
    }
    
    if (lower.includes("2-0") || lower.includes("scale") || lower.includes("rating")) {
      return "The rating scale works like this:\n• 2-0: Strongly prefer the left word\n• 2-1: Somewhat prefer the left word\n• 1-2: Somewhat prefer the right word\n• 0-2: Strongly prefer the right word\n\nChoose based on which word resonates more with your natural tendencies.";
    }
    
    if (lower.includes("help") || lower.includes("what")) {
      return "I'm here to help you understand the questionnaire! You can ask me about:\n• What specific questions mean\n• How to interpret the rating scale\n• The purpose of these word pairs\n• Tips for choosing between options\n\nWhat would you like to know?";
    }
    
    return "These questions help identify your natural working style and preferences. Each word pair represents different approaches to thinking, working, and interacting. There are no right or wrong answers - choose what feels most authentic to you. Any specific question you'd like me to explain?";
  };

  if (!isExpanded) {
    // Minimized state - floating button at bottom left
    return (
      <div 
        ref={containerRef}
        className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
        style={{
          left: `${position.x}px`,
          bottom: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative group">
          <div 
            className="absolute inset-0 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(158deg, rgba(255,243,3,0.1) 0%, rgba(251,169,61,0.1) 15%, rgba(237,1,145,0.1) 30%, rgba(167,99,173,0.1) 45%, rgba(1,133,198,0.1) 60%, rgba(2,181,230,0.1) 75%, rgba(1,161,114,0.1) 90%, rgba(162,211,111,0.1) 100%)'
            }}
          />
          <input
            type="text"
            placeholder="Ask Oskar about your profile"
            onClick={() => setIsExpanded(true)}
            readOnly
            className="relative w-[313px] h-[46px] px-4 py-2.5 pl-10 bg-white/95 backdrop-blur-[10px] rounded-lg border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer text-[13px] placeholder-gray-500 focus:outline-none"
            style={{
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6">
            <Oscar1 className="!w-5 !h-5" />
          </div>
        </div>
      </div>
    );
  }

  // Expanded state - left sidebar
  return (
    <div className={`fixed top-0 left-0 w-[399px] h-screen z-40 flex flex-col bg-white border-r border-gray-200 shadow-xl animate-slideInLeft ${className}`}>
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(156deg,rgba(255,243,3,0.05)_0%,rgba(251,169,61,0.05)_15%,rgba(237,1,145,0.05)_30%,rgba(167,99,173,0.05)_45%,rgba(1,133,198,0.05)_60%,rgba(2,181,230,0.05)_75%,rgba(1,161,114,0.05)_90%,rgba(162,211,111,0.05)_100%)] pointer-events-none" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Oscar1 className="!w-10 !h-10" />
            <div>
              <h3 className="font-semibold text-lg">
                <span 
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #FFF303 0%, #FBA93D 15%, #ED0191 30%, #A763AD 45%, #0185C6 60%, #02B5E6 75%, #01A172 90%, #A2D36F 100%)'
                  }}
                >
                  OSmos
                </span>
              </h3>
              <p className="text-sm text-gray-500">Questionnaire Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Minimize chat"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Oscar1 className="!w-8 !h-8" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">Hi! I&apos;m OSmos</p>
                  <p className="text-sm text-gray-600 max-w-[280px]">
                    I can help you understand the questionnaire and what each question measures. Ask me anything!
                  </p>
                </div>
              </div>
              
              {/* Quick prompts */}
              <div className="mt-8 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Quick questions</p>
                <div className="space-y-2">
                  {[
                    "What does the rating scale mean?",
                    "Help me understand Question 34",
                    "What's the purpose of these questions?"
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(prompt);
                        handleSendMessage(new Event('submit') as any);
                      }}
                      className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${message.sender === "user" ? "order-2" : "order-1"}`}>
                  {message.sender === "osmos" && (
                    <div className="flex items-start gap-2 mb-1">
                      <Oscar1 className="!w-5 !h-5 mt-0.5" />
                      <span className="text-xs text-gray-500">OSmos</span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-2 rounded-lg text-sm ${
                      message.sender === "user"
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < message.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about the questionnaire..."
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}