"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AdminCard, AdminCardContent } from "@/components/admin";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
import { Search, MessageSquare, Clock, TrendingUp, Users, User } from "lucide-react";
import { ConversationState } from "@/src/lib/agents/implementations/onboarding-agent";

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
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchConversations();
    
    // Set up WebSocket for real-time updates
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'conversation_update') {
        fetchConversations();
      }
    };

    return () => ws.close();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations');
      if (!response.ok) {
        console.error('Failed to fetch conversations:', response.status);
        setConversations([]);
        return;
      }
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = (conversations || []).filter(conv => {
    const matchesSearch = 
      conv.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      active: { label: 'Active', type: 'success' as const },
      completed: { label: 'Completed', type: 'info' as const },
      abandoned: { label: 'Abandoned', type: 'error' as const }
    };
    const config = statusMap[status as keyof typeof statusMap] || { label: status, type: 'neutral' as const };
    return <StatusBadge status={config.type}>{config.label}</StatusBadge>;
  };

  const getConfidenceDisplay = (confidence: string) => {
    const confidenceMap = {
      high: { label: 'High', type: 'success' as const },
      medium: { label: 'Medium', type: 'warning' as const },
      low: { label: 'Low', type: 'error' as const }
    };
    const config = confidenceMap[confidence as keyof typeof confidenceMap] || { label: confidence, type: 'neutral' as const };
    return <StatusBadge status={config.type} size="sm">{config.label}</StatusBadge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teams-primary"></div>
      </div>
    );
  }

  const activeCount = conversations.filter(c => c.status === 'active').length;
  const avgCompletion = Math.round(
    conversations.reduce((acc, c) => acc + c.completionPercentage, 0) / 
    conversations.length || 0
  );
  const highConfidenceCount = conversations.filter(c => c.managerConfidence === 'high').length;

  return (
    <div className="space-y-teams-xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-teams-text-primary">Onboarding Conversations</h1>
          <p className="text-teams-text-secondary mt-2">Monitor and manage active onboarding sessions</p>
        </div>
        <div className="flex gap-teams-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teams-text-secondary h-4 w-4" />
            <Input
              placeholder="Search managers or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64 border-teams-ui-border focus:border-teams-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            className="px-teams-md py-2 border border-teams-ui-border rounded-teams-sm bg-teams-bg text-teams-text-primary focus:border-teams-primary focus:outline-none focus:ring-2 focus:ring-teams-primary/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-teams-lg">
        <MetricCard
          title="Total Conversations"
          value={conversations.length}
          icon={MessageSquare}
          color="blue"
        />
        
        <MetricCard
          title="Active Now"
          value={activeCount}
          icon={Clock}
          color="green"
          subtitle={`${Math.round((activeCount / conversations.length) * 100)}% of total`}
        />

        <MetricCard
          title="Avg Completion"
          value={`${avgCompletion}%`}
          icon={TrendingUp}
          color="purple"
        />

        <MetricCard
          title="High Confidence"
          value={highConfidenceCount}
          icon={Users}
          color="orange"
          subtitle="Managers engaged"
        />
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-teams-ui-sidebar-bg border-b border-teams-ui-border">
              <tr>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Manager</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Team</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">State</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Status</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Progress</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Confidence</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Messages</th>
                <th className="px-teams-md py-teams-sm text-left text-sm font-semibold text-teams-text-primary">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((conversation, index) => (
                <tr key={conversation.id} className={`border-b border-teams-ui-border hover:bg-teams-ui-hover-bg transition-colors ${
                  index % 2 === 0 ? 'bg-teams-bg' : 'bg-teams-ui-sidebar-bg/30'
                }`}>
                  <td className="px-teams-md py-teams-md">
                    <Link
                      href={`/admin/conversations/${conversation.id}`}
                      className="flex items-center gap-teams-sm group"
                    >
                      <div className="w-8 h-8 rounded-full bg-teams-accent-blue/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-teams-accent-blue" />
                      </div>
                      <span className="font-medium text-teams-text-primary group-hover:text-teams-primary transition-colors">
                        {conversation.managerName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-teams-md py-teams-md text-teams-text-secondary">
                    {conversation.teamName}
                  </td>
                  <td className="px-teams-md py-teams-md text-sm text-teams-text-secondary capitalize">
                    {conversation.state.replace(/_/g, ' ')}
                  </td>
                  <td className="px-teams-md py-teams-md">
                    {getStatusDisplay(conversation.status)}
                  </td>
                  <td className="px-teams-md py-teams-md">
                    <div className="flex items-center gap-teams-sm">
                      <div className="w-24 bg-teams-ui-hover-bg rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${conversation.completionPercentage}%`,
                            backgroundColor: conversation.completionPercentage > 75 ? '#84CC16' : 
                                           conversation.completionPercentage > 50 ? '#60A5FA' : '#FB923C'
                          }}
                        />
                      </div>
                      <span className="text-sm text-teams-text-secondary font-medium">
                        {conversation.completionPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-teams-md py-teams-md">
                    {getConfidenceDisplay(conversation.managerConfidence)}
                  </td>
                  <td className="px-teams-md py-teams-md">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-teams-sm bg-teams-ui-hover-bg text-sm font-medium text-teams-text-primary">
                      {conversation.messageCount}
                    </span>
                  </td>
                  <td className="px-teams-md py-teams-md text-sm text-teams-text-secondary">
                    {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredConversations.length === 0 && (
            <div className="text-center py-teams-2xl">
              <MessageSquare className="h-12 w-12 text-teams-text-secondary/30 mx-auto mb-teams-md" />
              <p className="text-teams-text-secondary">No conversations found</p>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}