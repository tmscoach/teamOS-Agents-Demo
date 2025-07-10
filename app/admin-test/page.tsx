"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data for demonstration
const mockConversations = [
  {
    id: "conv-001",
    managerId: "mgr-001",
    managerName: "Sarah Johnson",
    teamId: "team-001",
    teamName: "Engineering Team",
    currentAgent: "OnboardingAgent",
    state: "challenge_exploration",
    startTime: new Date("2025-01-08T14:00:00"),
    lastMessageTime: new Date("2025-01-08T14:15:00"),
    messageCount: 8,
    completionPercentage: 40,
    rapportScore: 75,
    managerConfidence: "high" as const,
    status: "active" as const
  },
  {
    id: "conv-002",
    managerId: "mgr-002", 
    managerName: "Mike Chen",
    teamId: "team-002",
    teamName: "Product Team",
    currentAgent: "OnboardingAgent",
    state: "recap_and_handoff",
    startTime: new Date("2025-01-08T10:00:00"),
    lastMessageTime: new Date("2025-01-08T10:45:00"),
    messageCount: 24,
    completionPercentage: 95,
    rapportScore: 90,
    managerConfidence: "high" as const,
    status: "completed" as const
  },
  {
    id: "conv-003",
    managerId: "mgr-003",
    managerName: "Lisa Thompson",
    teamId: "team-003",
    teamName: "Marketing Team",
    currentAgent: "OnboardingAgent",
    state: "greeting",
    startTime: new Date("2025-01-08T13:30:00"),
    lastMessageTime: new Date("2025-01-08T13:32:00"),
    messageCount: 2,
    completionPercentage: 10,
    rapportScore: 50,
    managerConfidence: "low" as const,
    status: "active" as const
  }
];

export default function AdminTestPage() {
  const [conversations] = useState(mockConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'abandoned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch(confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Onboarding Conversations</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Conversations</p>
            <p className="text-2xl font-bold">{conversations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Active Now</p>
            <p className="text-2xl font-bold">{conversations.filter(c => c.status === 'active').length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Avg Completion</p>
            <p className="text-2xl font-bold">
              {Math.round(conversations.reduce((acc, c) => acc + c.completionPercentage, 0) / conversations.length)}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">High Confidence</p>
            <p className="text-2xl font-bold">{conversations.filter(c => c.managerConfidence === 'high').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search managers or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-md"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
        </div>

        {/* Conversations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/admin-test/${conv.id}`} className="text-blue-600 hover:underline">
                      {conv.managerName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conv.teamName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conv.state.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conv.status)}`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${conv.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{conv.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getConfidenceColor(conv.managerConfidence)}`}>
                      {conv.managerConfidence}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conv.messageCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(conv.lastMessageTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a test version with mock data. The real admin dashboard requires authentication and database setup.
          </p>
        </div>
      </div>
    </div>
  );
}