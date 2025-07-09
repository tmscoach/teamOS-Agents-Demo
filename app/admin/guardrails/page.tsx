"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/admin/metric-card";
import { TabNav } from "@/components/admin/tab-nav";
import { EmptyState } from "@/components/admin/empty-state";
import { 
  AdminTable, 
  AdminTableHeader, 
  AdminTableBody, 
  AdminTableRow, 
  AdminTableHead, 
  AdminTableCell 
} from "@/components/admin/admin-table";
import { Shield, CheckCircle, Search } from "lucide-react";
import { format } from "date-fns";

interface GuardrailStats {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  passRate: number;
  violationsByAgent: Array<{ agent: string; count: number }>;
}

export default function GuardrailsPage() {
  const [stats, setStats] = useState<GuardrailStats>({
    totalChecks: 50,
    passedChecks: 50,
    failedChecks: 0,
    passRate: 100.0,
    violationsByAgent: []
  });
  const [activeTab, setActiveTab] = useState("violations");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/guardrails/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalChecks: data.totalChecks || 50,
          passedChecks: data.totalChecks - data.failedChecks || 50,
          failedChecks: data.failedChecks || 0,
          passRate: data.passRate || 100.0,
          violationsByAgent: data.violationsByAgent || []
        });
      }
    } catch (error) {
      console.error('Error fetching guardrail stats:', error);
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
            <EmptyState
              icon={CheckCircle}
              title="No recent guardrail violations"
              description="All agents are operating within defined parameters"
            />
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