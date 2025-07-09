"use client";

import { useState, useEffect } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/components/admin/admin-card";
import { TabNav } from "@/components/admin/tab-nav";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { 
  AdminTable, 
  AdminTableHeader, 
  AdminTableBody, 
  AdminTableRow, 
  AdminTableHead, 
  AdminTableCell 
} from "@/components/admin/admin-table";
import { Settings, Save, TestTube, GitBranch, RotateCcw, Search, Plus, Edit2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface AgentConfig {
  id: string;
  agentName: string;
  version: number;
  prompts: Record<string, string>;
  flowConfig: Record<string, any>;
  extractionRules: Record<string, any>;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentSummary {
  agentName: string;
  activeVersion: number;
  totalVersions: number;
  lastUpdated: string;
  updatedBy: string;
}

const AGENT_NAMES = [
  "Orchestrator Agent",
  "Discovery Agent", 
  "Onboarding Agent",
  "Assessment Agent",
  "Alignment Agent",
  "Learning Agent",
  "Nudge Agent",
  "Progress Monitor",
  "Recognition Agent"
];

const TABS = [
  { id: "prompts", label: "Prompts" },
  { id: "flow", label: "Flow Configuration" },
  { id: "extraction", label: "Extraction Rules" },
  { id: "test", label: "Test Playground" },
  { id: "history", label: "Version History" }
];

export default function AgentConfigPage() {
  const { userId } = useAuth();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [currentConfig, setCurrentConfig] = useState<AgentConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<Partial<AgentConfig> | null>(null);
  const [configHistory, setConfigHistory] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("prompts");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentConfig(selectedAgent);
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/agents/config");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
        if (data.length > 0) {
          setSelectedAgent(data[0].agentName);
        }
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agent configurations");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentConfig = async (agentName: string) => {
    try {
      const [configRes, historyRes] = await Promise.all([
        fetch(`/api/admin/agents/config?agentName=${agentName}`),
        fetch(`/api/admin/agents/config?agentName=${agentName}&history=true`),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        setCurrentConfig(configData);
        setEditedConfig(configData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setConfigHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching agent config:", error);
      toast.error("Failed to load agent configuration");
    }
  };

  const saveConfiguration = async () => {
    if (!editedConfig || !selectedAgent) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/agents/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: selectedAgent,
          prompts: editedConfig.prompts,
          flowConfig: editedConfig.flowConfig,
          extractionRules: editedConfig.extractionRules,
        }),
      });

      if (res.ok) {
        toast.success("Configuration saved successfully");
        await fetchAgentConfig(selectedAgent);
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const updatePrompt = (key: string, value: string) => {
    if (!editedConfig) return;
    setEditedConfig({
      ...editedConfig,
      prompts: {
        ...editedConfig.prompts,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--teams-primary)]"></div>
      </div>
    );
  }

  // Calculate metrics
  const totalAgents = agents.length;
  const configuredAgents = agents.filter(a => a.totalVersions > 0).length;
  const totalVersions = agents.reduce((sum, a) => sum + a.totalVersions, 0);
  const recentUpdates = agents.filter(a => {
    const updated = new Date(a.lastUpdated);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return updated > dayAgo;
  }).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-[28px] font-semibold text-[var(--teams-text-primary)]">
          Agent Configuration
        </h2>
        <p className="text-[var(--teams-text-secondary)] mt-2">
          Manage agent prompts, flows, and extraction rules
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Total Agents"
          value={totalAgents}
          change={`${configuredAgents} configured`}
          changeType="neutral"
        />
        <MetricCard
          label="Active Versions"
          value={totalVersions}
          change="Total configurations"
          changeType="neutral"
        />
        <MetricCard
          label="Recent Updates"
          value={recentUpdates}
          change="Last 24 hours"
          changeType={recentUpdates > 0 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Current Agent"
          value={selectedAgent ? selectedAgent.split(' ')[0] : 'None'}
          change={currentConfig ? `v${currentConfig.version}` : ''}
          changeType="neutral"
        />
      </div>

      {/* Agent Selector */}
      <div className="teams-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 max-w-md">
              <Label htmlFor="agent-select" className="block text-sm font-medium text-[var(--teams-text-secondary)] mb-2">
                Select Agent to Configure
              </Label>
              <select
                id="agent-select"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--teams-ui-border)] rounded-[var(--teams-radius-md)] bg-[var(--teams-surface)] text-[var(--teams-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teams-primary)]/20 focus:border-[var(--teams-primary)] transition-all"
              >
                <option value="">Select an agent</option>
                {AGENT_NAMES.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
            {currentConfig && (
              <div className="flex items-center gap-3">
                <StatusBadge status="active" />
                <span className="text-sm text-[var(--teams-text-secondary)]">
                  Last updated {formatDistanceToNow(new Date(currentConfig.updatedAt), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
          
          {currentConfig && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={() => toast.info("Test functionality coming soon")}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Config
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={!editedConfig || saving}
                size="default"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!selectedAgent ? (
        <div className="teams-card">
          <EmptyState
            icon={Settings}
            title="Select an agent to view its configuration"
            description="Choose an agent from the dropdown above to manage its prompts, conversation flows, and variable extraction rules"
          />
        </div>
      ) : !currentConfig ? (
        <div className="teams-card">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--teams-primary)]"></div>
          </div>
        </div>
      ) : (
        <div className="teams-card">
          <TabNav 
            tabs={TABS} 
            defaultTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          {/* Prompts Tab */}
          {activeTab === "prompts" && (
            <div className="mt-6 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--teams-text-primary)]">
                  Agent Prompts
                </h3>
                <Badge variant="secondary">
                  {Object.keys(editedConfig?.prompts || {}).length} prompts
                </Badge>
              </div>
              
              <div className="space-y-6">
                {Object.entries(editedConfig?.prompts || {}).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-sm font-medium text-[var(--teams-text-primary)]">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')} Prompt
                      </Label>
                      <span className="text-xs text-[var(--teams-text-secondary)]">
                        {(value as string).length} characters
                      </span>
                    </div>
                    <Textarea
                      id={key}
                      value={value as string}
                      onChange={(e) => updatePrompt(key, e.target.value)}
                      rows={6}
                      className="w-full font-mono text-sm p-3"
                      placeholder="Enter prompt text..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flow Configuration Tab */}
          {activeTab === "flow" && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--teams-text-primary)]">
                    Flow Configuration
                  </h3>
                  <p className="text-sm text-[var(--teams-text-secondary)] mt-1">
                    Define the conversation flow and state transitions in JSON format
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Visual Editor
                </Button>
              </div>
              
              <Textarea
                value={JSON.stringify(editedConfig?.flowConfig || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditedConfig({
                      ...editedConfig!,
                      flowConfig: parsed,
                    });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                rows={20}
                className="w-full font-mono text-sm p-4 bg-[var(--teams-surface-secondary)]"
                placeholder="Enter JSON configuration..."
              />
            </div>
          )}

          {/* Extraction Rules Tab */}
          {activeTab === "extraction" && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--teams-text-primary)]">
                    Variable Extraction Rules
                  </h3>
                  <p className="text-sm text-[var(--teams-text-secondary)] mt-1">
                    Configure rules for extracting variables from conversations
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
              
              <Textarea
                value={JSON.stringify(editedConfig?.extractionRules || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditedConfig({
                      ...editedConfig!,
                      extractionRules: parsed,
                    });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                rows={20}
                className="w-full font-mono text-sm p-4 bg-[var(--teams-surface-secondary)]"
                placeholder="Enter extraction rules..."
              />
            </div>
          )}

          {/* Test Tab */}
          {activeTab === "test" && (
            <div className="mt-6">
              <EmptyState
                icon={TestTube}
                title="Test Playground Coming Soon"
                description="You'll be able to test your agent configurations with simulated conversations"
              />
            </div>
          )}

          {/* Version History Tab */}
          {activeTab === "history" && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--teams-text-primary)]">
                  Version History
                </h3>
                <div className="flex items-center gap-4">
                  <Input
                    type="text"
                    placeholder="Search versions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
              </div>

              {configHistory.length === 0 ? (
                <EmptyState
                  icon={GitBranch}
                  title="No version history yet"
                  description="Version history will appear here after you save changes"
                />
              ) : (
                <AdminTable>
                  <AdminTableHeader>
                    <AdminTableHead>Version</AdminTableHead>
                    <AdminTableHead>Status</AdminTableHead>
                    <AdminTableHead>Created</AdminTableHead>
                    <AdminTableHead>Author</AdminTableHead>
                    <AdminTableHead>Actions</AdminTableHead>
                  </AdminTableHeader>
                  <AdminTableBody>
                    {configHistory
                      .filter(config => 
                        searchQuery === '' || 
                        config.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((config) => (
                        <AdminTableRow key={config.id}>
                          <AdminTableCell className="font-medium">
                            v{config.version}
                          </AdminTableCell>
                          <AdminTableCell>
                            <StatusBadge 
                              status={config.active ? "active" : "inactive"} 
                            />
                          </AdminTableCell>
                          <AdminTableCell>
                            {format(new Date(config.createdAt), "MMM d, yyyy HH:mm")}
                          </AdminTableCell>
                          <AdminTableCell>
                            {config.createdBy}
                          </AdminTableCell>
                          <AdminTableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toast.info("View diff coming soon")}
                              >
                                <GitBranch className="h-4 w-4" />
                              </Button>
                              {!config.active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toast.info("Rollback functionality coming soon")}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </AdminTableCell>
                        </AdminTableRow>
                      ))}
                  </AdminTableBody>
                </AdminTable>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}