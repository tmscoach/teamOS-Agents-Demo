"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Bot,
  Clock,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowRight,
  Activity,
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: string;
}

interface ConversationDetail {
  id: string;
  managerId: string;
  managerName: string;
  teamId: string;
  teamName: string;
  currentAgent: string;
  messages: Message[];
  metadata: {
    onboarding?: {
      state: string;
      startTime: Date;
      capturedFields: Record<string, any>;
      requiredFieldsStatus: Record<string, boolean>;
      qualityMetrics: {
        rapportScore: number;
        managerConfidence: 'low' | 'medium' | 'high';
        completionPercentage: number;
      };
      stateTransitions: Array<{
        from: string;
        to: string;
        timestamp: Date;
        reason?: string;
      }>;
    };
  };
  events: Array<{
    id: string;
    type: string;
    timestamp: Date;
    agent: string;
    data?: any;
  }>;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
    
    // Set up WebSocket for real-time updates
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'conversation_update' && data.conversationId === conversationId) {
        fetchConversation();
      }
    };

    return () => ws.close();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`);
      const data = await response.json();
      setConversation(data);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return <div>Loading conversation...</div>;
  }

  if (!conversation) {
    return <div>Conversation not found</div>;
  }

  const onboardingData = conversation.metadata.onboarding;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{conversation.managerName}</h1>
          <p className="text-gray-600">Team: {conversation.teamName}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {onboardingData?.state.replace(/_/g, ' ')}
          </Badge>
          <Badge variant={onboardingData?.qualityMetrics.managerConfidence === 'high' ? 'default' : 'secondary'}>
            {onboardingData?.qualityMetrics.managerConfidence} confidence
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {conversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {message.role === 'user' ? (
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.role === 'user'
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {format(new Date(message.timestamp), 'HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Captured Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="captured">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="captured">Captured</TabsTrigger>
                  <TabsTrigger value="required">Required</TabsTrigger>
                </TabsList>
                <TabsContent value="captured" className="space-y-2">
                  {Object.entries(onboardingData?.capturedFields || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b">
                      <span className="text-sm font-medium">{key}:</span>
                      <span className="text-sm text-gray-600">{String(value)}</span>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="required" className="space-y-2">
                  {Object.entries(onboardingData?.requiredFieldsStatus || {}).map(([field, captured]) => (
                    <div key={field} className="flex items-center justify-between py-2">
                      <span className="text-sm">{field}</span>
                      {captured ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Completion</span>
                  <span className="text-sm text-gray-600">
                    {onboardingData?.qualityMetrics.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${onboardingData?.qualityMetrics.completionPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Rapport Score</span>
                  <span className="text-sm text-gray-600">
                    {onboardingData?.qualityMetrics.rapportScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${onboardingData?.qualityMetrics.rapportScore}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>State Transitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {onboardingData?.stateTransitions.map((transition, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {format(new Date(transition.timestamp), 'HH:mm:ss')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {transition.to.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {conversation.events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <Activity className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-medium">{event.type}</span>
                    <span className="text-gray-600 ml-2">
                      {format(new Date(event.timestamp), 'HH:mm:ss')}
                    </span>
                    {event.data && (
                      <pre className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}