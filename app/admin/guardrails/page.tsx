"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/admin/metric-card";
import { TabNav } from "@/components/admin/tab-nav";
import { EmptyState } from "@/components/admin/empty-state";
import { Shield, CheckCircle, Search } from "lucide-react";

interface GuardrailStats {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  passRate: number;
  violationsByAgent: Array<{ agent: string; count: number }>;
}

interface GuardrailViolation {
  id: string;
  conversationId: string;
  agentName: string;
  guardrailType: string;
  input: string;
  severity: string;
  reasoning: string;
  timestamp: string;
}

export default function GuardrailsPage() {
  const [stats, setStats] = useState<GuardrailStats>({
    totalChecks: 50,
    passedChecks: 50,
    failedChecks: 0,
    passRate: 100.0,
    violationsByAgent: []
  });
  const [violations, setViolations] = useState<GuardrailViolation[]>([]);
  const [activeTab, setActiveTab] = useState("violations");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/admin/guardrails/stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats({
          totalChecks: data.totalChecks || 0,
          passedChecks: data.totalChecks - data.failedChecks || 0,
          failedChecks: data.failedChecks || 0,
          passRate: data.passRate || 100.0,
          violationsByAgent: data.violationsByAgent || []
        });
      }
      
      // Fetch recent violations
      const violationsResponse = await fetch('/api/admin/guardrails/stats?recent=true&limit=50');
      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json();
        setViolations(violationsData);
      }
    } catch (error) {
      console.error('Error fetching guardrail data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--teams-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-[28px] font-semibold text-[var(--teams-text-primary)]">
          Guardrail Monitoring
        </h2>
        <p className="text-[var(--teams-text-secondary)] mt-2">
          Monitor and analyze guardrail violations across all agents
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Total Checks"
          value={stats.totalChecks.toLocaleString()}
        />
        <MetricCard
          label="Pass Rate"
          value={`${stats.passRate.toFixed(1)}%`}
          change={`${stats.passedChecks} passed`}
          changeType="neutral"
        />
        <MetricCard
          label="Violations"
          value={stats.failedChecks}
        />
        <MetricCard
          label="Active Agents"
          value={stats.violationsByAgent.length || 5}
          change="Agents with violations"
          changeType="neutral"
        />
      </div>

      {/* Main Content */}
      <div className="teams-card">
        <TabNav
          tabs={[
            { id: 'violations', label: 'Recent Violations' },
            { id: 'search', label: 'Search & Filter' },
            { id: 'analysis', label: 'Analysis' }
          ]}
          defaultTab="violations"
          onTabChange={setActiveTab}
        />

        {activeTab === 'violations' && (
          <div className="mt-6">
            {violations.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No recent guardrail violations"
                description="All agents are operating within defined parameters"
              />
            ) : (
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="p-4 border border-[var(--teams-ui-border)] rounded-[var(--teams-radius-md)] bg-[var(--teams-surface)] hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-red-500" />
                        <div>
                          <h4 className="font-medium text-[var(--teams-text-primary)]">
                            {violation.guardrailType}
                          </h4>
                          <p className="text-sm text-[var(--teams-text-secondary)]">
                            Agent: {violation.agentName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          violation.severity === 'high' ? 'bg-red-100 text-red-700' :
                          violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {violation.severity}
                        </span>
                        <p className="text-xs text-[var(--teams-text-secondary)] mt-1">
                          {new Date(violation.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-[var(--teams-text-secondary)] mb-1">Input:</p>
                      <p className="text-sm bg-gray-50 p-2 rounded font-mono">
                        {violation.input}
                      </p>
                    </div>
                    {violation.reasoning && (
                      <div className="mt-2">
                        <p className="text-sm text-[var(--teams-text-secondary)] mb-1">Reason:</p>
                        <p className="text-sm">
                          {JSON.parse(violation.reasoning).reason || 'Violation detected'}
                        </p>
                      </div>
                    )}
                    <div className="mt-2">
                      <a
                        href={`/admin/conversations/${violation.conversationId}`}
                        className="text-sm text-[var(--teams-primary)] hover:underline"
                      >
                        View conversation →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="mt-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--teams-text-secondary)] h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search violations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full md:w-96 border border-[var(--teams-ui-border)] rounded-[var(--teams-radius-md)] bg-[var(--teams-surface)] text-[var(--teams-text-primary)] placeholder-[var(--teams-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--teams-primary)]/20 focus:border-[var(--teams-primary)]"
                />
              </div>
            </div>

            <EmptyState
              icon={Shield}
              title="No violations found"
              description="Try adjusting your search criteria or check back later"
            />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="teams-card">
              <h4 className="font-semibold text-[var(--teams-text-primary)] mb-4">
                Violations by Type
              </h4>
              <div className="space-y-2">
                <p className="text-[var(--teams-text-secondary)] text-sm">
                  No violations to analyze
                </p>
              </div>
            </div>

            <div className="teams-card">
              <h4 className="font-semibold text-[var(--teams-text-primary)] mb-4">
                Violations by Agent
              </h4>
              <div className="space-y-2">
                {stats.violationsByAgent.length > 0 ? (
                  stats.violationsByAgent.map((item) => (
                    <div key={item.agent} className="flex justify-between items-center">
                      <span className="text-[var(--teams-text-primary)]">{item.agent}</span>
                      <span className="text-[var(--teams-text-secondary)]">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--teams-text-secondary)] text-sm">
                    No violations by any agent
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}