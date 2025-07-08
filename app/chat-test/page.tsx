"use client";

import { useState } from "react";

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "Welcome to TMS! I'm your onboarding guide. I'm here to help you get started with transforming your team. Could you tell me your name and a bit about what brings you here today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);

    // Call the test API
    try {
      const response = await fetch('/api/test/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      
      if (data.message) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      }

      if (data.extractedData) {
        setExtractedData(prev => ({ ...prev, ...data.extractedData }));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    }

    setInput("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">OnboardingAgent Test Chat</h1>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Info panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Test Scenarios:</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• "Hi, I'm Sarah Johnson"</li>
              <li>• "I manage a team of 15 people"</li>
              <li>• "We've been together for 2 years"</li>
              <li>• "Our main challenge is poor communication"</li>
              <li>• "I want to improve team collaboration"</li>
              <li>• "Our budget is around $10k"</li>
              <li>• "We have 3 months for this project"</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Extracted Data:</h3>
            {Object.keys(extractedData).length === 0 ? (
              <p className="text-sm text-gray-600">No data extracted yet</p>
            ) : (
              <ul className="text-sm space-y-1">
                {Object.entries(extractedData).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}