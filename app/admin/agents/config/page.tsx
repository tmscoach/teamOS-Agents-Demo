"use client";

import { useState, useEffect } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { AdminCard, AdminCardHeader, AdminCardTitle, AdminCardContent } from "@/components/admin/admin-card";
import { TabNav } from "@/components/admin/tab-nav";
import { Settings, Save, TestTube, GitBranch, RotateCcw } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

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
  { id: "test", label: "Test" },
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

      {/* Agent Selector and Actions */}
      <AdminCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="agent-select" className="text-sm font-medium text-[var(--teams-text-secondary)] mb-1">
                Select Agent
              </Label>
              <select
                id="agent-select"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="px-4 py-2 min-w-[250px] border border-[var(--teams-ui-border)] rounded-[var(--teams-radius-md)] bg-[var(--teams-surface)] text-[var(--teams-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teams-primary)]/20 focus:border-[var(--teams-primary)]"
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
              <div className="flex items-center gap-2">
                <Badge variant="secondary">v{currentConfig.version}</Badge>
                <span className="text-sm text-[var(--teams-text-secondary)]">
                  Last updated {format(new Date(currentConfig.updatedAt), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
          
          {currentConfig && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Test functionality coming soon")}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={!editedConfig || saving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Main Content */}
      {!currentConfig ? (
        <AdminCard>
          <EmptyState
            icon={Settings}
            title="Select an agent to view its configuration"
            description="You can manage prompts, conversation flows, and variable extraction rules"
          />
        </AdminCard>
      ) : (
        <>
          <TabNav 
            tabs={TABS} 
            defaultTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          {/* Prompts Tab */}
          {activeTab === "prompts" && (
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Agent Prompts</AdminCardTitle>
                <p className="text-[var(--teams-text-secondary)] mt-1">
                  Edit the prompts used by the agent for different states
                </p>
              </AdminCardHeader>
              <AdminCardContent>
                <div className="space-y-6">
                  {Object.entries(editedConfig?.prompts || {}).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-sm font-medium text-[var(--teams-text-primary)]">
                        {key.charAt(0).toUpperCase() + key.slice(1)} Prompt
                      </Label>
                      <Textarea
                        id={key}
                        value={value as string}
                        onChange={(e) => updatePrompt(key, e.target.value)}
                        rows={4}
                        className="w-full font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </AdminCardContent>
            </AdminCard>
          )}

          {/* Flow Configuration Tab */}
          {activeTab === "flow" && (
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Flow Configuration</AdminCardTitle>
                <p className="text-[var(--teams-text-secondary)] mt-1">
                  Define the conversation flow and state transitions
                </p>
              </AdminCardHeader>
              <AdminCardContent>
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
                  className="w-full font-mono text-sm"
                />
              </AdminCardContent>
            </AdminCard>
          )}

          {/* Extraction Rules Tab */}
          {activeTab === "extraction" && (
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Variable Extraction Rules</AdminCardTitle>
                <p className="text-[var(--teams-text-secondary)] mt-1">
                  Configure rules for extracting variables from conversations
                </p>
              </AdminCardHeader>
              <AdminCardContent>
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
                  className="w-full font-mono text-sm"
                />
              </AdminCardContent>
            </AdminCard>
          )}

          {/* Test Tab */}
          {activeTab === "test" && (
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Test Configuration</AdminCardTitle>
                <p className="text-[var(--teams-text-secondary)] mt-1">
                  Test your agent configuration with simulated conversations
                </p>
              </AdminCardHeader>
              <AdminCardContent>
                <EmptyState
                  icon={TestTube}
                  title="Test playground coming soon"
                  description="You'll be able to test your agent configurations here"
                />
              </AdminCardContent>
            </AdminCard>
          )}

          {/* Version History Tab */}
          {activeTab === "history" && (
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Version History</AdminCardTitle>
                <p className="text-[var(--teams-text-secondary)] mt-1">
                  View and manage previous configuration versions
                </p>
              </AdminCardHeader>
              <AdminCardContent>
                <div className="space-y-3">
                  {configHistory.length === 0 ? (
                    <EmptyState
                      icon={GitBranch}
                      title="No version history yet"
                      description="Version history will appear here after you save changes"
                    />
                  ) : (
                    configHistory.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-[var(--teams-ui-border)] hover:bg-[var(--teams-surface-hover)]"
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={config.active ? "default" : "secondary"}>
                            v{config.version}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-[var(--teams-text-primary)]">
                              {format(new Date(config.createdAt), "MMM d, yyyy HH:mm")}
                            </p>
                            <p className="text-xs text-[var(--teams-text-secondary)]">
                              by {config.createdBy}
                            </p>
                          </div>
                        </div>
                        {!config.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info("Rollback functionality coming soon")}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </AdminCardContent>
            </AdminCard>
          )}
        </>
      )}
    </div>
  );
}