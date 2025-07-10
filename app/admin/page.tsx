"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/admin/metric-card";
import { 
  Plus,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Shield,
  Database,
  Settings
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalConversations: number;
  activeConversations: number;
  guardrailViolations: number;
  variableExtractions: number;
  successRate: number;
}

interface ActiveSession {
  id: string;
  manager: string;
  team: string;
  status: 'active' | 'pending' | 'abandoned';
  progress: number;
  lastActivity: Date;
}

interface RecentActivity {
  id: string;
  type: 'conversation_started' | 'guardrail_violation' | 'variable_extracted';
  title: string;
  meta: string;
  timestamp: Date;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    activeConversations: 0,
    guardrailViolations: 0,
    variableExtractions: 0,
    successRate: 0
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [conversationsRes, guardrailRes, variableRes] = await Promise.all([
        fetch('/api/admin/conversations'),
        fetch('/api/admin/guardrails/stats'),
        fetch('/api/admin/variables/stats')
      ]);

      // Process conversations data
      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json();
        const conversations = conversationsData.conversations || [];
        
        // Calculate stats from conversations
        const totalConversations = conversations.length;
        const activeConversations = conversations.filter((c: { status: string }) => c.status === 'active').length;
        
        // Transform conversations to active sessions
        const sessions = conversations
          .filter((c: { status: string }) => c.status === 'active' || c.status === 'pending')
          .map((c: { id: string; managerName: string; teamName: string; status: string; completionPercentage?: number; lastMessageTime: string }) => ({
            id: c.id,
            manager: c.managerName,
            team: c.teamName,
            status: c.status,
            progress: c.completionPercentage || 0,
            lastActivity: new Date(c.lastMessageTime)
          }))
          .slice(0, 5); // Show top 5
        
        setActiveSessions(sessions);
        setStats(prev => ({
          ...prev,
          totalConversations,
          activeConversations
        }));
        
        // Generate recent activity from conversations
        const activities: RecentActivity[] = conversations
          .slice(0, 3)
          .map((c: { managerName: string; startTime: string }, index: number) => ({
            id: `conv-${index}`,
            type: 'conversation_started' as const,
            title: 'New conversation started',
            meta: `${c.managerName} • ${formatDistanceToNow(new Date(c.startTime), { addSuffix: true })}`,
            timestamp: new Date(c.startTime)
          }));
        
        setRecentActivity(activities);
      }

      // Process guardrail stats
      if (guardrailRes.ok) {
        const guardrailData = await guardrailRes.json();
        setStats(prev => ({
          ...prev,
          guardrailViolations: guardrailData.failedChecks || 0
        }));
        
        // Add guardrail violations to recent activity if any
        if (guardrailData.recentViolations && guardrailData.recentViolations.length > 0) {
          const violation = guardrailData.recentViolations[0];
          setRecentActivity(prev => [...prev, {
            id: 'guardrail-1',
            type: 'guardrail_violation' as const,
            title: 'Guardrail violation detected',
            meta: `${violation.agentName} • ${formatDistanceToNow(new Date(violation.timestamp), { addSuffix: true })}`,
            timestamp: new Date(violation.timestamp)
          }]);
        }
      }

      // Process variable extraction stats
      if (variableRes.ok) {
        const variableData = await variableRes.json();
        setStats(prev => ({
          ...prev,
          variableExtractions: variableData.totalExtractions || 0,
          successRate: variableData.successRate || 0
        }));
        
        // Add variable extraction to recent activity if any
        if (variableData.totalExtractions > 0) {
          setRecentActivity(prev => [...prev, {
            id: 'var-1',
            type: 'variable_extracted' as const,
            title: 'Variable extraction completed',
            meta: `System • 1 hour ago`,
            timestamp: new Date(Date.now() - 60 * 60 * 1000)
          }]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>Dashboard</h2>
        <p style={{ color: '#6b7280' }}>
          Here&apos;s an overview of your TMS transformation system
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
          value={stats.totalConversations}
          change={stats.totalConversations > 0 ? "12% from last period" : undefined}
          changeType="positive"
        />
        <MetricCard
          label="Active Sessions"
          value={stats.activeConversations}
          change="Currently in progress"
          changeType="neutral"
        />
        <MetricCard
          label="Guardrail Violations"
          value={stats.guardrailViolations}
          change={stats.guardrailViolations > 0 ? "8% from last period" : "No violations"}
          changeType={stats.guardrailViolations > 0 ? "negative" : "positive"}
        />
        <MetricCard
          label="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          change="Variable extraction"
          changeType="neutral"
        />
      </div>

      {/* Active Sessions Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
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
          }}>Active Sessions</h3>
          <Link 
            href="/admin/conversations" 
            style={{
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#111827'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
          >
            View All →
          </Link>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            Loading sessions...
          </div>
        ) : activeSessions.length > 0 ? (
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
                  }}>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((session) => (
                  <tr key={session.id} style={{
                    borderBottom: '1px solid #f3f4f6',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 12px' }}>
                      <Link 
                        href={`/admin/conversations/${session.id}`}
                        style={{ 
                          color: '#111827', 
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {session.manager}
                      </Link>
                    </td>
                    <td style={{ padding: '16px 12px' }}>{session.team}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: session.status === 'active' ? '#d1fae5' : 
                                       session.status === 'pending' ? '#fef3c7' : 
                                       '#fee2e2',
                        color: session.status === 'active' ? '#065f46' : 
                               session.status === 'pending' ? '#92400e' : 
                               '#991b1b'
                      }}>
                        {session.status === 'active' ? 'Active' : 
                         session.status === 'pending' ? 'Pending' : 
                         'Abandoned'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div>{session.progress}%</div>
                      <div style={{
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginTop: '8px'
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: '#10b981',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                          width: `${session.progress}%`
                        }}></div>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px 12px',
                      color: '#6b7280'
                    }}>
                      {formatDistanceToNow(session.lastActivity, { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            No active sessions at the moment
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827'
          }}>Recent Activity</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            Loading activity...
          </div>
        ) : recentActivity.length > 0 ? (
          <div>
            {recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((activity, index) => {
              const isLast = index === recentActivity.length - 1;
              const iconConfig = {
                conversation_started: { Icon: Plus, bgColor: '#f3f4f6', iconColor: '#6b7280' },
                guardrail_violation: { Icon: AlertTriangle, bgColor: '#fef3c7', iconColor: '#92400e' },
                variable_extracted: { Icon: CheckCircle, bgColor: '#d1fae5', iconColor: '#065f46' }
              };
              
              const { Icon, bgColor, iconColor } = iconConfig[activity.type];
              
              return (
                <div 
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px 0',
                    borderBottom: !isLast ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon style={{ width: '20px', height: '20px', color: iconColor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px', color: '#111827' }}>
                      {activity.title}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      {activity.meta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            No recent activity
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }}>
        <Link href="/admin/conversations" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
              }}>
                <MessageSquare style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  Conversations
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Monitor active onboarding sessions
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/guardrails" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(251, 146, 60, 0.1)'
              }}>
                <Shield style={{ width: '24px', height: '24px', color: '#fb923c' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  Guardrails
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Track violations and security
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/variables" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
              }}>
                <Database style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  Variables
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Analyze extracted data quality
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/agents/config" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            height: '100%'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)'
              }}>
                <Settings style={{ width: '24px', height: '24px', color: '#22c55e' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  Agent Config
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Manage prompts and flows
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}