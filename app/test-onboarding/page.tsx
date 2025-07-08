"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TestOnboardingPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, any>>({});

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('/api/test/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      
      if (data.message) {
        const agentResponse = {
          role: "assistant",
          content: data.message
        };
        setMessages(prev => [...prev, agentResponse]);
      }

      // Show extracted data if any
      if (data.extractedData && Object.keys(data.extractedData).length > 0) {
        setExtractedData(prev => ({ ...prev, ...data.extractedData }));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorResponse = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test Onboarding Agent</h1>
      
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Onboarding Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  Start a conversation to test the OnboardingAgent
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <span className="text-gray-500">Typing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Test Scenarios:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• "Hi, I'm Sarah Johnson"</li>
            <li>• "I manage a team of 15 people"</li>
            <li>• "Our main challenge is poor communication between teams"</li>
            <li>• "We've been together for 2 years"</li>
            <li>• "Our budget is around $10k"</li>
          </ul>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Extracted Data:</h3>
          {Object.keys(extractedData).length === 0 ? (
            <p className="text-sm text-gray-600">No data extracted yet</p>
          ) : (
            <ul className="space-y-1 text-sm">
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
  );
}