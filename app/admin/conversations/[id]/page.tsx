"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import {
  User,
  Bot,
  Clock,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowRight,
  Activity,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { JourneyDetails } from "@/components/admin/journey-details";
import { UserRole } from "@/lib/orchestrator/journey-phases";

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
  metadata?: {
    onboarding?: {
      state: string;
      startTime: Date;
      capturedFields: Record<string, unknown>;
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
    content?: unknown;
    data?: unknown;
  }>;
  // Journey tracking data
  journeyStatus: 'ONBOARDING' | 'ACTIVE' | 'DORMANT';
  userRole?: UserRole;
  completedSteps: string[];
  currentStep: {
    id: string;
    name: string;
    order: number;
  } | null;
  lastActivity: Date;
  onboardingData: Record<string, any>;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'captured' | 'required'>('captured');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}`);
      if (!response.ok) {
        console.error('Failed to fetch conversation:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        return;
      }
      const data = await response.json();
      console.log('Fetched conversation data:', data);
      console.log('Messages:', data.messages);
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
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#111827',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px',
        color: '#6b7280'
      }}>
        <AlertCircle style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 16px',
          opacity: 0.3
        }} />
        <p style={{ marginBottom: '8px', fontWeight: '500' }}>Conversation not found</p>
        <Link 
          href="/admin/conversations"
          style={{
            color: '#111827',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          ← Back to conversations
        </Link>
      </div>
    );
  }

  const onboardingData = conversation.metadata?.onboarding;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif' }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <button
            onClick={() => router.push('/admin/conversations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              marginBottom: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#111827';
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Conversations
          </button>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px'
          }}>{conversation.managerName}</h1>
          <p style={{ color: '#6b7280' }}>Team: {conversation.teamName}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onboardingData && (
            <>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                color: '#6b7280',
                textTransform: 'capitalize'
              }}>
                {onboardingData.state.replace(/_/g, ' ').toLowerCase()}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 
                  onboardingData.qualityMetrics.managerConfidence === 'high' ? '#d1fae5' :
                  onboardingData.qualityMetrics.managerConfidence === 'medium' ? '#dbeafe' :
                  '#fee2e2',
                color: 
                  onboardingData.qualityMetrics.managerConfidence === 'high' ? '#065f46' :
                  onboardingData.qualityMetrics.managerConfidence === 'medium' ? '#1e40af' :
                  '#991b1b'
              }}>
                {onboardingData.qualityMetrics.managerConfidence} confidence
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '24px'
      }}>
        {/* Conversation Panel */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827'
            }}>Conversation</h2>
          </div>
          <div style={{
            height: '600px',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {conversation.messages && conversation.messages.length > 0 ? (
                conversation.messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      maxWidth: '80%',
                      flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: message.role === 'user' ? '#3b82f6' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {message.role === 'user' ? (
                          <User style={{ width: '16px', height: '16px', color: 'white' }} />
                        ) : (
                          <Bot style={{ width: '16px', height: '16px', color: 'white' }} />
                        )}
                      </div>
                      <div>
                        <div style={{
                          borderRadius: '12px',
                          padding: '12px 16px',
                          backgroundColor: message.role === 'user' ? '#3b82f6' : '#f3f4f6',
                          color: message.role === 'user' ? 'white' : '#111827'
                        }}>
                          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{message.content}</p>
                        </div>
                        <p style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px',
                          textAlign: message.role === 'user' ? 'right' : 'left'
                        }}>
                          {format(new Date(message.timestamp), 'HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#6b7280'
                }}>
                  <MessageSquare style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 16px',
                    opacity: 0.3
                  }} />
                  <p>No messages in this conversation yet</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Journey Details */}
          <JourneyDetails
            journeyStatus={conversation.journeyStatus}
            completedSteps={conversation.completedSteps}
            currentStep={conversation.currentStep}
            lastActivity={conversation.lastActivity}
            onboardingData={conversation.onboardingData}
            userRole={conversation.userRole}
            stateTransitions={onboardingData?.stateTransitions}
          />

          {/* Captured Variables */}
          {onboardingData && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>Captured Variables</h3>
              </div>
              <div style={{ padding: '24px' }}>
                {/* Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  borderBottom: '1px solid #e5e7eb',
                  marginBottom: '24px'
                }}>
                  <button
                    onClick={() => setActiveTab('captured')}
                    style={{
                      padding: '12px 0',
                      color: activeTab === 'captured' ? '#111827' : '#6b7280',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      background: 'none',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderBottom: `2px solid ${activeTab === 'captured' ? '#111827' : 'transparent'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Captured
                  </button>
                  <button
                    onClick={() => setActiveTab('required')}
                    style={{
                      padding: '12px 0',
                      color: activeTab === 'required' ? '#111827' : '#6b7280',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      background: 'none',
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderBottom: `2px solid ${activeTab === 'required' ? '#111827' : 'transparent'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Required
                  </button>
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'captured' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(onboardingData.capturedFields || {}).length > 0 ? (
                        Object.entries(onboardingData.capturedFields).map(([key, value]) => (
                          <div key={key} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                              {key}:
                            </span>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>
                              {String(value)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>No variables captured yet</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(onboardingData.requiredFieldsStatus || {}).length > 0 ? (
                        Object.entries(onboardingData.requiredFieldsStatus).map(([field, captured]) => (
                          <div key={field} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 0'
                          }}>
                            <span style={{ fontSize: '14px', color: '#111827' }}>{field}</span>
                            {captured ? (
                              <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                            ) : (
                              <AlertCircle style={{ width: '16px', height: '16px', color: '#e5e7eb' }} />
                            )}
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>No required fields defined</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quality Metrics */}
          {onboardingData && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>Quality Metrics</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      Completion
                    </span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {onboardingData.qualityMetrics.completionPercentage}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${onboardingData.qualityMetrics.completionPercentage}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      Rapport Score
                    </span>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      {onboardingData.qualityMetrics.rapportScore}/100
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${onboardingData.qualityMetrics.rapportScore}%`,
                      height: '100%',
                      backgroundColor: '#10b981',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* State Transitions */}
          {onboardingData && onboardingData.stateTransitions && onboardingData.stateTransitions.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>State Transitions</h3>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {onboardingData.stateTransitions.map((transition, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}>
                      <Clock style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span style={{ color: '#6b7280' }}>
                        {format(new Date(transition.timestamp), 'HH:mm:ss')}
                      </span>
                      <ArrowRight style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span style={{ fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>
                        {transition.to.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Timeline */}
      {conversation.events && conversation.events.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginTop: '24px'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827'
            }}>Event Timeline</h3>
          </div>
          <div style={{ 
            padding: '24px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {conversation.events.map((event) => {
                // Parse the event content to get more details
                let eventDetails = null;
                try {
                  eventDetails = typeof event.content === 'string' ? JSON.parse(event.content) : event.content;
                } catch {
                  // If parsing fails, use the raw content
                }

                // Determine event icon and color based on type
                const getEventStyle = (type: string) => {
                  switch (type) {
                    case 'guardrail':
                      return { color: '#f59e0b', icon: AlertCircle };
                    case 'handoff':
                      return { color: '#3b82f6', icon: ArrowRight };
                    case 'tool_call':
                      return { color: '#10b981', icon: Database };
                    default:
                      return { color: '#6b7280', icon: Activity };
                  }
                };

                const eventStyle = getEventStyle(event.type);
                const EventIcon = eventStyle.icon;

                // Format event message based on type
                const getEventMessage = () => {
                  if (event.type === 'guardrail' && eventDetails) {
                    const passed = eventDetails.result?.passed;
                    const guardrailName = eventDetails.guardrailName || 'Unknown';
                    return (
                      <span>
                        Guardrail <strong>{guardrailName}</strong>: {' '}
                        <span style={{ color: passed ? '#10b981' : '#ef4444' }}>
                          {passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </span>
                    );
                  }
                  return <span>{event.type} by {event.agent || 'System'}</span>;
                };

                return (
                  <div key={event.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <EventIcon style={{ 
                      width: '16px', 
                      height: '16px', 
                      color: eventStyle.color,
                      marginTop: '2px',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '14px'
                      }}>
                        {getEventMessage()}
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                          {format(new Date(event.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                      {eventDetails?.result?.reason && event.type === 'guardrail' && (
                        <p style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px',
                          marginLeft: '28px'
                        }}>
                          {eventDetails.result.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}