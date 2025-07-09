"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, RotateCcw, Send, Bot, User, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    state?: string;
    extractedFields?: Record<string, any>;
    confidence?: number;
    error?: string;
  };
}

interface TestSession {
  id: string;
  messages: TestMessage[];
  currentState: string;
  capturedFields: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'error';
}

interface TestPlaygroundProps {
  agentName: string;
  config: {
    prompts: Record<string, string>;
    flowConfig: any;
    extractionRules: any;
  };
}

export default function TestPlayground({ agentName, config }: TestPlaygroundProps) {
  const [session, setSession] = useState<TestSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const startNewSession = () => {
    const initialState = config.flowConfig?.initialState || 'greeting';
    const systemMessage: TestMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Test session started. Initial state: ${initialState}`,
      timestamp: new Date(),
      metadata: { state: initialState },
    };

    setSession({
      id: `session-${Date.now()}`,
      messages: [systemMessage],
      currentState: initialState,
      capturedFields: {},
      startTime: new Date(),
      status: 'running',
    });

    // Generate initial assistant message
    generateAssistantMessage(initialState, {});
  };

  const resetSession = () => {
    setSession(null);
    setInputMessage('');
    toast.info('Test session reset');
  };

  const generateAssistantMessage = async (state: string, capturedFields: Record<string, any>) => {
    setLoading(true);
    
    try {
      // Simulate agent response based on current state
      const statePrompt = config.prompts[state] || config.prompts.system || 'Hello! How can I help you?';
      
      // Simple template variable replacement
      let processedPrompt = statePrompt;
      Object.entries(capturedFields).forEach(([key, value]) => {
        processedPrompt = processedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      const assistantMessage: TestMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: processedPrompt,
        timestamp: new Date(),
        metadata: { state },
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, assistantMessage],
      } : null);
    } catch (error) {
      console.error('Error generating assistant message:', error);
      toast.error('Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !session || loading) return;

    const userMessage: TestMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setSession({
      ...session,
      messages: [...session.messages, userMessage],
    });

    setInputMessage('');
    setLoading(true);

    try {
      // Simulate field extraction
      const extractedFields = simulateFieldExtraction(inputMessage, session.currentState);
      
      // Update captured fields
      const updatedFields = {
        ...session.capturedFields,
        ...extractedFields,
      };

      // Determine next state
      const nextState = determineNextState(session.currentState, updatedFields);

      // Add system message about extraction
      if (Object.keys(extractedFields).length > 0) {
        const extractionMessage: TestMessage = {
          id: `msg-${Date.now()}-extract`,
          role: 'system',
          content: `Extracted fields: ${JSON.stringify(extractedFields, null, 2)}`,
          timestamp: new Date(),
          metadata: { extractedFields },
        };

        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, extractionMessage],
          capturedFields: updatedFields,
        } : null);
      }

      // State transition
      if (nextState !== session.currentState) {
        const transitionMessage: TestMessage = {
          id: `msg-${Date.now()}-transition`,
          role: 'system',
          content: `State transition: ${session.currentState} → ${nextState}`,
          timestamp: new Date(),
          metadata: { state: nextState },
        };

        setSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, transitionMessage],
          currentState: nextState,
          capturedFields: updatedFields,
        } : null);
      } else {
        setSession(prev => prev ? {
          ...prev,
          capturedFields: updatedFields,
        } : null);
      }

      // Generate assistant response
      await generateAssistantMessage(nextState, updatedFields);

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: TestMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: 'Processing failed' },
      };

      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage],
        status: 'error',
      } : null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const simulateFieldExtraction = (message: string, currentState: string): Record<string, any> => {
    const extracted: Record<string, any> = {};
    
    if (!config.extractionRules?.fields) return extracted;

    config.extractionRules.fields.forEach((field: any) => {
      // Check if this field should be extracted in current state
      if (field.extraction?.states && !field.extraction.states.includes(currentState)) {
        return;
      }

      // Simple keyword matching
      const keywords = field.extraction?.keywords || [];
      const messageWords = message.toLowerCase().split(/\s+/);
      
      if (keywords.some((keyword: string) => messageWords.includes(keyword.toLowerCase()))) {
        // Extract based on field type
        if (field.type === 'number') {
          const numbers = message.match(/\d+/g);
          if (numbers) {
            extracted[field.name] = parseInt(numbers[0]);
          }
        } else if (field.type === 'boolean') {
          const positiveWords = ['yes', 'true', 'correct', 'agree'];
          const negativeWords = ['no', 'false', 'incorrect', 'disagree'];
          
          if (positiveWords.some(word => messageWords.includes(word))) {
            extracted[field.name] = true;
          } else if (negativeWords.some(word => messageWords.includes(word))) {
            extracted[field.name] = false;
          }
        } else {
          // For string type, extract the whole message for now
          extracted[field.name] = message;
        }
      }
    });

    return extracted;
  };

  const determineNextState = (currentState: string, capturedFields: Record<string, any>): string => {
    if (!config.flowConfig?.transitions) return currentState;

    // Find valid transitions from current state
    const validTransitions = config.flowConfig.transitions
      .filter((t: any) => t.from === currentState)
      .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));

    for (const transition of validTransitions) {
      if (!transition.condition) {
        return transition.to;
      }

      // Evaluate condition (simplified)
      try {
        // WARNING: In production, use a safe expression evaluator
        const conditionFunc = new Function('capturedFields', `return ${transition.condition}`);
        if (conditionFunc(capturedFields)) {
          return transition.to;
        }
      } catch (error) {
        console.error('Error evaluating transition condition:', error);
      }
    }

    return currentState;
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getMessageColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-primary/10';
      case 'assistant':
        return 'bg-secondary';
      case 'system':
        return 'bg-muted';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Test Playground</h3>
          <p className="text-sm text-muted-foreground">
            Simulate conversations to test your agent configuration
          </p>
        </div>
        <div className="flex gap-2">
          {!session ? (
            <Button onClick={startNewSession}>
              <Play className="h-4 w-4 mr-2" />
              Start Test Session
            </Button>
          ) : (
            <Button variant="outline" onClick={resetSession}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Session
            </Button>
          )}
        </div>
      </div>

      {session && (
        <div className="grid grid-cols-3 gap-4">
          {/* Chat Interface */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  Test your agent's conversation flow and field extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {session.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 p-3 rounded-lg ${getMessageColor(message.role)}`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getMessageIcon(message.role)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium capitalize">
                              {message.role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.metadata?.state && (
                              <Badge variant="outline" className="text-xs">
                                {message.metadata.state}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          {message.metadata?.extractedFields && (
                            <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono">
                              {JSON.stringify(message.metadata.extractedFields, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      disabled={loading || session.status !== 'running'}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim() || session.status !== 'running'}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Debug Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current State</Label>
                  <div className="mt-1">
                    <Badge variant="default" className="text-sm">
                      {session.currentState}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>Session Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {session.status === 'running' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Running</span>
                      </>
                    )}
                    {session.status === 'completed' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Completed</span>
                      </>
                    )}
                    {session.status === 'error' && (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Error</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Duration</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Math.round((new Date().getTime() - session.startTime.getTime()) / 1000)}s
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Captured Fields</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(session.capturedFields).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No fields captured yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(session.capturedFields).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start">
                        <span className="text-sm font-medium">{key}:</span>
                        <span className="text-sm text-muted-foreground">
                          {JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available States</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {config.flowConfig?.states?.map((state: any) => (
                    <Badge
                      key={state.id}
                      variant={state.id === session.currentState ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {state.name}
                    </Badge>
                  )) || (
                    <p className="text-sm text-muted-foreground">
                      No states defined
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!session && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click "Start Test Session" to begin testing your agent configuration.
            The playground will simulate conversations and show how your agent extracts information and transitions between states.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}