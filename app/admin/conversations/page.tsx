"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MetricCard } from "@/components/admin/metric-card";
import { Search, MessageSquare, FileDown } from "lucide-react";
import { ConversationState } from "@/src/lib/agents/types/conversation-state";

interface ConversationListItem {
  id: string;
  managerId: string;
  managerName: string;
  teamId: string;
  teamName: string;
  currentAgent: string;
  state: ConversationState;
  startTime: Date;
  lastMessageTime: Date;
  messageCount: number;
  completionPercentage: number;
  rapportScore: number;
  managerConfidence: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned';
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Mock data for demo
  const mockConversations: ConversationListItem[] = [
    {
      id: "1",
      managerId: "user_1",
      managerName: "Demo User",
      teamId: "team_1",
      teamName: "Demo User's Team",
      currentAgent: "OnboardingAgent",
      state: ConversationState.GREETING,
      startTime: new Date(Date.now() - 7 * 60 * 1000),
      lastMessageTime: new Date(Date.now() - 7 * 60 * 1000),
      messageCount: 0,
      completionPercentage: 0,
      rapportScore: 0,
      managerConfidence: 'medium',
      status: 'active'
    },
    {
      id: "2",
      managerId: "user_2",
      managerName: "Test User",
      teamId: "team_2",
      teamName: "Test Team",
      currentAgent: "OnboardingAgent",
      state: ConversationState.CONTEXT_DISCOVERY,
      startTime: new Date(Date.now() - 13 * 60 * 60 * 1000),
      lastMessageTime: new Date(Date.now() - 13 * 60 * 60 * 1000),
      messageCount: 0,
      completionPercentage: 25,
      rapportScore: 30,
      managerConfidence: 'low',
      status: 'abandoned'
    }
  ];

  useEffect(() => {
    const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations');
      if (!response.ok) {
        console.error('Failed to fetch conversations:', response.status);
        // Use mock data if API fails
        setConversations(mockConversations);
        return;
      }
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // Use mock data if API fails
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };
    
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && conv.status === 'active') ||
      (activeTab === 'completed' && conv.status === 'completed') ||
      (activeTab === 'abandoned' && conv.status === 'abandoned');
    
    return matchesSearch && matchesTab;
  });

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

  const activeCount = conversations.filter(c => c.status === 'active').length;
  const avgCompletion = Math.round(
    conversations.reduce((acc, c) => acc + c.completionPercentage, 0) / 
    (conversations.length || 1)
  );
  const highConfidenceCount = conversations.filter(c => c.managerConfidence === 'high').length;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>Onboarding Conversations</h2>
        <p style={{ color: '#6b7280' }}>
          Monitor and manage active onboarding sessions
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <MetricCard
          label="Total Conversations"
          value={conversations.length}
        />
        <MetricCard
          label="Active Now"
          value={activeCount}
          change={`${conversations.length > 0 ? Math.round((activeCount / conversations.length) * 100) : 0}% of total`}
          changeType="neutral"
        />
        <MetricCard
          label="Avg Completion"
          value={`${avgCompletion}%`}
        />
        <MetricCard
          label="High Confidence"
          value={highConfidenceCount}
          change="Managers engaged"
          changeType="neutral"
        />
      </div>

      {/* Conversations Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>Conversation Details</h3>
          <button style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#111827',
            color: 'white',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
          >
            <FileDown style={{ width: '16px', height: '16px' }} />
            Export Data
          </button>
        </div>

        {/* Search and Tabs */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280',
              width: '16px',
              height: '16px'
            }} />
            <input
              type="text"
              placeholder="Search managers or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                width: '100%',
                maxWidth: '400px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#111827',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#111827'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '24px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            {[
              { id: 'all', label: 'All Conversations' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'abandoned', label: 'Abandoned' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 0',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#111827' : 'transparent'}`,
                  color: activeTab === tab.id ? '#111827' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#111827' : 'transparent'}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#111827';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredConversations.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Manager</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Team</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>State</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Status</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Progress</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Confidence</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Messages</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontWeight: '500',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '14px'
                  }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.map((conversation) => (
                  <tr 
                    key={conversation.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 12px' }}>
                      <Link
                        href={`/admin/conversations/${conversation.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textDecoration: 'none',
                          color: '#111827'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}>
                          {conversation.managerName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{
                          fontWeight: '500',
                          color: '#111827'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {conversation.managerName}
                        </span>
                      </Link>
                    </td>
                    <td style={{ padding: '16px 12px' }}>{conversation.teamName}</td>
                    <td style={{ 
                      padding: '16px 12px',
                      color: '#6b7280',
                      textTransform: 'capitalize'
                    }}>
                      {conversation.state.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: 
                          conversation.status === 'active' ? '#d1fae5' : 
                          conversation.status === 'completed' ? '#dbeafe' :
                          '#fee2e2',
                        color: 
                          conversation.status === 'active' ? '#065f46' : 
                          conversation.status === 'completed' ? '#1e40af' :
                          '#991b1b'
                      }}>
                        {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ color: '#111827' }}>
                        {conversation.completionPercentage}%
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: 
                          conversation.managerConfidence === 'high' ? '#d1fae5' :
                          conversation.managerConfidence === 'medium' ? '#dbeafe' :
                          '#fee2e2',
                        color: 
                          conversation.managerConfidence === 'high' ? '#065f46' :
                          conversation.managerConfidence === 'medium' ? '#1e40af' :
                          '#991b1b'
                      }}>
                        {conversation.managerConfidence.charAt(0).toUpperCase() + conversation.managerConfidence.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ color: '#111827' }}>
                        {conversation.messageCount}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '16px 12px',
                      color: '#6b7280'
                    }}>
                      {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <p style={{ marginBottom: '8px', fontWeight: '500' }}>No conversations found</p>
            <p style={{ fontSize: '14px' }}>
              {searchQuery ? "Try adjusting your search criteria" : "Start engaging with managers to see conversations here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}