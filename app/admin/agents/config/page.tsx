"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cog, History, Copy, RotateCcw, Save, TestTube, GitBranch, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

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

interface ConfigComparison {
  version1: { version: number; createdAt: string; createdBy: string };
  version2: { version: number; createdAt: string; createdBy: string };
  differences: {
    prompts: Record<string, { old: any; new: any }>;
    flowConfig: Record<string, { old: any; new: any }>;
    extractionRules: Record<string, { old: any; new: any }>;
  };
}

export default function AgentConfigPage() {
  const { userId } = useAuth();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [currentConfig, setCurrentConfig] = useState<AgentConfig | null>(null);
  const [configHistory, setConfigHistory] = useState<AgentConfig[]>([]);
  const [editedConfig, setEditedConfig] = useState<Partial<AgentConfig> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{ v1: string; v2: string }>({ v1: "", v2: "" });
  const [comparison, setComparison] = useState<ConfigComparison | null>(null);

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

  const testConfiguration = async () => {
    if (!editedConfig || !selectedAgent) return;

    try {
      setTesting(true);
      const res = await fetch("/api/admin/agents/config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: selectedAgent,
          prompts: editedConfig.prompts,
          flowConfig: editedConfig.flowConfig,
          extractionRules: editedConfig.extractionRules,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.valid) {
          toast.success("Configuration test passed");
        } else {
          toast.error("Configuration test failed", {
            description: result.errors.join(", "),
          });
        }
      }
    } catch (error) {
      console.error("Error testing configuration:", error);
      toast.error("Failed to test configuration");
    } finally {
      setTesting(false);
    }
  };

  const rollbackConfiguration = async () => {
    if (!rollbackVersion || !selectedAgent) return;

    try {
      const res = await fetch("/api/admin/agents/config?action=rollback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: selectedAgent,
          targetVersion: rollbackVersion,
        }),
      });

      if (res.ok) {
        toast.success(`Rolled back to version ${rollbackVersion}`);
        setShowRollbackDialog(false);
        await fetchAgentConfig(selectedAgent);
      } else {
        toast.error("Failed to rollback configuration");
      }
    } catch (error) {
      console.error("Error rolling back configuration:", error);
      toast.error("Failed to rollback configuration");
    }
  };

  const performCompareVersions = async () => {
    if (!compareVersions.v1 || !compareVersions.v2 || !selectedAgent) return;

    try {
      const res = await fetch(
        `/api/admin/agents/config?agentName=${selectedAgent}&compare=true&version1=${compareVersions.v1}&version2=${compareVersions.v2}`
      );

      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (error) {
      console.error("Error comparing versions:", error);
      toast.error("Failed to compare versions");
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
        <p className="text-muted-foreground">Manage agent prompts, flows, and extraction rules</p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.agentName} value={agent.agentName}>
                {agent.agentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentConfig && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">v{currentConfig.version}</Badge>
            <span>Last updated {format(new Date(currentConfig.updatedAt), "MMM d, yyyy")}</span>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCompareDialog(true)}
            disabled={!configHistory || configHistory.length < 2}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Compare
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRollbackDialog(true)}
            disabled={!configHistory || configHistory.length < 2}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Rollback
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={testConfiguration}
            disabled={!editedConfig || testing}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? "Testing..." : "Test"}
          </Button>
          <Button
            onClick={saveConfiguration}
            disabled={!editedConfig || saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {currentConfig && editedConfig && (
        <Tabs defaultValue="prompts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="flow">Flow Configuration</TabsTrigger>
            <TabsTrigger value="extraction">Extraction Rules</TabsTrigger>
            <TabsTrigger value="history">Version History</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Prompts</CardTitle>
                <CardDescription>
                  Edit the prompts used by the agent for different states
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(editedConfig.prompts || {}).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>{key}</Label>
                    <Textarea
                      id={key}
                      value={value as string}
                      onChange={(e) => updatePrompt(key, e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flow Configuration</CardTitle>
                <CardDescription>
                  Define the conversation flow and state transitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editedConfig.flowConfig, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditedConfig({
                        ...editedConfig,
                        flowConfig: parsed,
                      });
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extraction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variable Extraction Rules</CardTitle>
                <CardDescription>
                  Configure rules for extracting variables from conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editedConfig.extractionRules, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setEditedConfig({
                        ...editedConfig,
                        extractionRules: parsed,
                      });
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
                <CardDescription>
                  View and manage previous configuration versions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {configHistory.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant={config.active ? "default" : "secondary"}>
                          v{config.version}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(config.createdAt), "MMM d, yyyy HH:mm")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {config.createdBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!config.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRollbackVersion(config.version);
                              setShowRollbackDialog(true);
                            }}
                          >
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Rollback Dialog */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to rollback to version {rollbackVersion}? This will make it the active configuration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRollbackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={rollbackConfiguration}>
              Rollback to v{rollbackVersion}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>
              Select two versions to compare their configurations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select value={compareVersions.v1} onValueChange={(v) => setCompareVersions({ ...compareVersions, v1: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version 1" />
                </SelectTrigger>
                <SelectContent>
                  {configHistory.map((config) => (
                    <SelectItem key={config.version} value={config.version.toString()}>
                      v{config.version} - {format(new Date(config.createdAt), "MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={compareVersions.v2} onValueChange={(v) => setCompareVersions({ ...compareVersions, v2: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version 2" />
                </SelectTrigger>
                <SelectContent>
                  {configHistory.map((config) => (
                    <SelectItem key={config.version} value={config.version.toString()}>
                      v{config.version} - {format(new Date(config.createdAt), "MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={performCompareVersions}>Compare</Button>
            </div>

            {comparison && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Showing differences between v{comparison.version1.version} and v{comparison.version2.version}
                  </AlertDescription>
                </Alert>
                
                {Object.keys(comparison.differences.prompts).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Prompt Changes</h4>
                    <div className="space-y-2">
                      {Object.entries(comparison.differences.prompts).map(([key, diff]) => (
                        <div key={key} className="p-2 border rounded">
                          <p className="font-mono text-sm mb-1">{key}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-red-50 p-2 rounded">
                              <p className="font-medium text-red-900">Version {comparison.version1.version}</p>
                              <pre className="whitespace-pre-wrap">{diff.old}</pre>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <p className="font-medium text-green-900">Version {comparison.version2.version}</p>
                              <pre className="whitespace-pre-wrap">{diff.new}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}