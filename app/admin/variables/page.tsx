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
import { ProgressBar } from "@/components/admin/progress-bar";
import { Database, BarChart, Search, FileText } from "lucide-react";

interface ExtractionStats {
  totalExtractions: number;
  successfulExtractions: number;
  successRate: number;
  fields: Array<{
    fieldName: string;
    attempts: number;
    successful: number;
    successRate: number;
  }>;
}

export default function VariablesPage() {
  const [stats, setStats] = useState<ExtractionStats>({
    totalExtractions: 0,
    successfulExtractions: 0,
    successRate: 0,
    fields: []
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/variables/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalExtractions: data.totalExtractions || 0,
          successfulExtractions: data.successfulExtractions || 0,
          successRate: data.successRate || 0,
          fields: data.fields || []
        });
      }
    } catch (error) {
      console.error('Error fetching variable stats:', error);
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

  const uniqueFields = stats.fields.length;
  const problemFields = stats.fields.filter(f => f.successRate < 70).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-[28px] font-semibold text-[var(--teams-text-primary)]">
          Variable Extraction Analytics
        </h2>
        <p className="text-[var(--teams-text-secondary)] mt-2">
          Monitor and analyze variable extraction success rates
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Total Attempts"
          value={stats.totalExtractions.toLocaleString()}
        />
        <MetricCard
          label="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          change={`${stats.successfulExtractions} successful`}
          changeType="neutral"
        />
        <MetricCard
          label="Fields Tracked"
          value={uniqueFields}
          change="Unique fields"
          changeType="neutral"
        />
        <MetricCard
          label="Problem Fields"
          value={problemFields}
          change="Below 70% success rate"
          changeType={problemFields > 0 ? "negative" : "neutral"}
        />
      </div>

      {/* Main Content */}
      <div className="teams-card">
        <TabNav
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'fields', label: 'Field Analysis' },
            { id: 'trends', label: 'Trends' },
            { id: 'search', label: 'Search' }
          ]}
          defaultTab="overview"
          onTabChange={setActiveTab}
        />

        {activeTab === 'overview' && (
          <div className="mt-6">
            {stats.totalExtractions === 0 ? (
              <EmptyState
                icon={FileText}
                title="No extraction data available"
                description="Variable extraction analytics will appear here once agents start processing"
              />
            ) : (
              <div>
                <h4 className="font-semibold text-[var(--teams-text-primary)] mb-4">
                  Field Performance Overview
                </h4>
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableHead>Field Name</AdminTableHead>
                    <AdminTableHead>Attempts</AdminTableHead>
                    <AdminTableHead>Successful</AdminTableHead>
                    <AdminTableHead>Success Rate</AdminTableHead>
                    <AdminTableHead>Performance</AdminTableHead>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {stats.fields.slice(0, 10).map((field) => (
                      <AdminTableRow key={field.fieldName}>
                        <AdminTableCell className="font-medium">
                          {field.fieldName}
                        </AdminTableCell>
                        <AdminTableCell>{field.attempts}</AdminTableCell>
                        <AdminTableCell>{field.successful}</AdminTableCell>
                        <AdminTableCell>
                          <span className={field.successRate >= 70 ? "text-[var(--teams-success)]" : "text-[var(--teams-error)]"}>
                            {field.successRate.toFixed(1)}%
                          </span>
                        </AdminTableCell>
                        <AdminTableCell>
                          <ProgressBar 
                            value={field.successRate} 
                            showLabel={false}
                            barClassName={field.successRate >= 70 ? "" : "bg-[var(--teams-error)]"}
                          />
                        </AdminTableCell>
                      </AdminTableRow>
                    ))}
                  </AdminTableBody>
                </AdminTable>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="mt-6">
            <div className="grid gap-4">
              {stats.fields.map(field => (
                <div key={field.fieldName} className="teams-card">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium text-[var(--teams-text-primary)]">
                      {field.fieldName}
                    </h5>
                    <span className={`text-sm font-medium ${
                      field.successRate >= 70 
                        ? "text-[var(--teams-success)]" 
                        : "text-[var(--teams-error)]"
                    }`}>
                      {field.successRate.toFixed(1)}% success
                    </span>
                  </div>
                  <ProgressBar 
                    value={field.successRate} 
                    showLabel={false}
                    barClassName={field.successRate >= 70 ? "" : "bg-[var(--teams-error)]"}
                  />
                  <div className="flex justify-between mt-2 text-sm text-[var(--teams-text-secondary)]">
                    <span>{field.attempts} attempts</span>
                    <span>{field.successful} successful</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="mt-6">
            <EmptyState
              icon={BarChart}
              title="Trend analysis coming soon"
              description="Historical extraction performance will be displayed here"
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
                  placeholder="Search extractions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full md:w-96 border border-[var(--teams-ui-border)] rounded-[var(--teams-radius-md)] bg-[var(--teams-surface)] text-[var(--teams-text-primary)] placeholder-[var(--teams-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--teams-primary)]/20 focus:border-[var(--teams-primary)]"
                />
              </div>
            </div>

            <EmptyState
              icon={Database}
              title="Search for specific extractions"
              description="Enter a search query to find extraction records"
            />
          </div>
        )}
      </div>
    </div>
  );
}