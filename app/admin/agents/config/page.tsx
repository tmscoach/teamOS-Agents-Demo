"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/admin/metric-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Settings, Save, TestTube, GitBranch, RotateCcw, Search, Plus, FlaskConical, History, Shield, Workflow, Edit2, Trash2, X, BookOpen } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { FlowDesignerWrapper } from "@/src/components/admin/flow-designer/FlowDesignerWrapper";
import { FlowConfiguration } from "@/src/lib/agents/graph/types";
import { ENHANCED_ONBOARDING_FLOW } from "@/src/lib/agents/config/enhanced-onboarding-flow";

interface AgentConfig {
  id: string;
  agentName: string;
  version: number;
  systemPrompt: string;
  flowConfig: {
    states?: Array<{
      name: string;
      description: string;
      objectives: string[];
      duration?: string;
      key_outputs: string[];
    }>;
    transitions?: Array<{
      from: string;
      to: string;
      condition: string;
      action: string;
    }>;
    requiredFields?: string[];
  };
  extractionRules: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
    pattern?: string;
    patterns?: string[];
    useLLMFallback?: boolean;
    suggestedValues?: string[];
  }>;
  guardrailConfig?: Record<string, any>;
  knowledgeConfig?: Record<string, any>;
  toolsConfig?: {
    enabledTools?: string[];
  };
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentSummary {
  agentName: string;
  activeVersion: number;
  totalVersions: number;
  lastUpdated: string | null;
  updatedBy: string | null;
  configured?: boolean;
}

const AGENT_NAMES = [
  "OrchestratorAgent",
  "DiscoveryAgent", 
  "OnboardingAgent",
  "AssessmentAgent",
  "DebriefAgent",
  "AlignmentAgent",
  "LearningAgent",
  "NudgeAgent",
  "ProgressMonitor",
  "RecognitionAgent"
];

const TABS = [
  { id: "prompt", label: "System Prompt" },
  { id: "flow", label: "Flow Configuration" },
  { id: "flow-designer", label: "Flow Designer" },
  { id: "extraction", label: "Extraction Rules" },
  { id: "guardrails", label: "Guardrails" },
  { id: "tools", label: "TMS Tools" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "test", label: "Test Playground" },
  { id: "history", label: "Version History" }
];

// Helper function to check if config is a FlowConfiguration
function isFlowConfiguration(config: any): config is FlowConfiguration {
  return config && 
    typeof config === 'object' &&
    'states' in config &&
    'transitions' in config &&
    'settings' in config &&
    typeof config.states === 'object' &&
    Array.isArray(config.transitions);
}

export default function AgentConfigPage() {
  const { } = useAuth();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [currentConfig, setCurrentConfig] = useState<AgentConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<Partial<AgentConfig> | null>(null);
  const [configHistory, setConfigHistory] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("prompt");
  
  // UI states for managing extraction rules
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [variableForm, setVariableForm] = useState({
    name: '',
    type: 'string',
    description: '',
    required: false,
    patterns: [''],
    useLLMFallback: false,
    suggestedValues: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchAgentConfig(selectedAgent);
    }
  }, [selectedAgent]);

  const fetchAgents = async (preserveSelection = false) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/agents/config");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
        // Only set selected agent if none is selected or not preserving selection
        if (!preserveSelection && data.length > 0) {
          if (!selectedAgent) {
            setSelectedAgent(data[0].agentName);
          }
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
          systemPrompt: editedConfig.systemPrompt,
          flowConfig: editedConfig.flowConfig,
          extractionRules: editedConfig.extractionRules,
          guardrailConfig: editedConfig.guardrailConfig,
          knowledgeConfig: editedConfig.knowledgeConfig,
          toolsConfig: editedConfig.toolsConfig,
        }),
      });

      if (res.ok) {
        toast.success("Configuration saved successfully. New conversations will use the updated configuration.");
        await fetchAgentConfig(selectedAgent);
        await fetchAgents(true); // Refresh agent list to update metrics, preserve selection
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Save failed:", errorData);
        toast.error(`Failed to save: ${errorData.error || 'Unknown error'}`);
        if (errorData.details) {
          console.error("Error details:", errorData.details);
        }
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Migrate old multi-prompt format to single system prompt if needed
  useEffect(() => {
    if (currentConfig && 'prompts' in currentConfig && !currentConfig.systemPrompt) {
      // Convert old format: combine all prompts into system prompt
      const oldConfig = currentConfig as AgentConfig & { prompts: { system?: string; [key: string]: string | undefined } };
      const systemPrompt = oldConfig.prompts.system || 
        Object.entries(oldConfig.prompts)
          .map(([key, value]) => `## ${key.replace(/_/g, ' ').toUpperCase()}\n${value}`)
          .join('\n\n');
      
      setCurrentConfig({
        ...currentConfig,
        systemPrompt
      });
      setEditedConfig({
        ...currentConfig,
        systemPrompt
      });
    }
  }, [currentConfig]);

  // Handler functions for variable management
  const handleAddVariable = () => {
    if (!variableForm.name || !editedConfig) return;
    
    const newRules = {
      ...editedConfig.extractionRules,
      [variableForm.name]: {
        type: variableForm.type,
        description: variableForm.description,
        required: variableForm.required,
        patterns: variableForm.patterns.filter(p => p.trim() !== ''),
        useLLMFallback: variableForm.useLLMFallback,
        suggestedValues: variableForm.suggestedValues.filter(v => v.trim() !== '')
      }
    };
    
    setEditedConfig({
      ...editedConfig,
      extractionRules: newRules
    });
    
    // Reset form
    setVariableForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
      patterns: [''],
      useLLMFallback: false,
      suggestedValues: []
    });
    setIsAddingVariable(false);
    
    toast.success(`Variable "${variableForm.name}" added successfully`);
  };

  const handleEditVariable = (fieldName: string) => {
    if (!editedConfig?.extractionRules) return;
    
    const rule = editedConfig.extractionRules[fieldName];
    setVariableForm({
      name: fieldName,
      type: rule.type || 'string',
      description: rule.description || '',
      required: rule.required || false,
      patterns: rule.patterns || (rule.pattern ? [rule.pattern] : ['']),
      useLLMFallback: rule.useLLMFallback || false,
      suggestedValues: rule.suggestedValues || []
    });
    setEditingVariable(fieldName);
  };

  const handleUpdateVariable = () => {
    if (!editingVariable || !editedConfig) return;
    
    // Remove old variable if name changed
    const newRules = { ...editedConfig.extractionRules };
    if (editingVariable !== variableForm.name) {
      delete newRules[editingVariable];
    }
    
    // Add/update variable with new values
    newRules[variableForm.name] = {
      type: variableForm.type,
      description: variableForm.description,
      required: variableForm.required,
      patterns: variableForm.patterns.filter(p => p.trim() !== ''),
      useLLMFallback: variableForm.useLLMFallback,
      suggestedValues: variableForm.suggestedValues.filter(v => v.trim() !== '')
    };
    
    setEditedConfig({
      ...editedConfig,
      extractionRules: newRules
    });
    
    // Reset form
    setVariableForm({
      name: '',
      type: 'string',
      description: '',
      required: false,
      patterns: [''],
      useLLMFallback: false,
      suggestedValues: []
    });
    setEditingVariable(null);
    
    toast.success(`Variable "${variableForm.name}" updated successfully`);
  };

  const handleDeleteVariable = (fieldName: string) => {
    if (!editedConfig) return;
    
    const newRules = { ...editedConfig.extractionRules };
    delete newRules[fieldName];
    
    setEditedConfig({
      ...editedConfig,
      extractionRules: newRules
    });
    
    toast.success(`Variable "${fieldName}" deleted successfully`);
  };

  const handleAddPattern = () => {
    setVariableForm({
      ...variableForm,
      patterns: [...variableForm.patterns, '']
    });
  };

  const handleRemovePattern = (index: number) => {
    setVariableForm({
      ...variableForm,
      patterns: variableForm.patterns.filter((_, i) => i !== index)
    });
  };

  const handlePatternChange = (index: number, value: string) => {
    const newPatterns = [...variableForm.patterns];
    newPatterns[index] = value;
    setVariableForm({
      ...variableForm,
      patterns: newPatterns
    });
  };

  const handleAddSuggestedValue = () => {
    setVariableForm({
      ...variableForm,
      suggestedValues: [...variableForm.suggestedValues, '']
    });
  };

  const handleRemoveSuggestedValue = (index: number) => {
    setVariableForm({
      ...variableForm,
      suggestedValues: variableForm.suggestedValues.filter((_, i) => i !== index)
    });
  };

  const handleSuggestedValueChange = (index: number, value: string) => {
    const newValues = [...variableForm.suggestedValues];
    newValues[index] = value;
    setVariableForm({
      ...variableForm,
      suggestedValues: newValues
    });
  };

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

  // Calculate metrics based on actual data
  const totalAgents = AGENT_NAMES.length; // Total possible agents
  const configuredAgents = agents.filter(a => a.totalVersions > 0).length;
  const totalVersions = agents.reduce((sum, a) => sum + a.totalVersions, 0);
  const recentUpdates = agents.filter(a => {
    if (!a.lastUpdated) return false;
    const updated = new Date(a.lastUpdated);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return updated > dayAgo;
  }).length;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          color: '#111827'
        }}>
          Agent Configuration
        </h2>
        <p style={{ color: '#6b7280' }}>
          Manage agent prompts, flows, and extraction rules
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
          value={selectedAgent ? selectedAgent.replace('Agent', '').trim() : 'None'}
          change={currentConfig ? (currentConfig.version > 0 ? `v${currentConfig.version}` : 'Not configured') : ''}
          changeType={currentConfig && currentConfig.version > 0 ? "neutral" : "negative"}
        />
      </div>

      {/* Agent Selector Card */}
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
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Select Agent to Configure
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#111827',
                  fontSize: '14px',
                  minWidth: '250px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#111827'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <option value="">Select an agent</option>
                {agents.map((agent) => {
                  const isConfigured = agent.totalVersions > 0;
                  return (
                    <option key={agent.agentName} value={agent.agentName}>
                      {agent.agentName} {!isConfigured && '(Not Configured)'}
                    </option>
                  );
                })}
              </select>
              {currentConfig && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {currentConfig.version > 0 ? (
                    <>
                      <StatusBadge status="active" />
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        v{currentConfig.version} • Last updated {formatDistanceToNow(new Date(currentConfig.updatedAt), { addSuffix: true })}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '14px', color: '#ef4444' }}>
                      Not configured - using default prompts
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {selectedAgent && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  // Navigate to chat with this agent, forcing a new conversation
                  if (selectedAgent === 'DebriefAgent') {
                    // Use specialized debrief interface
                    window.open('/chat/debrief?agent=' + selectedAgent + '&reportType=TMP&subscriptionId=21989&new=true', '_blank');
                  } else {
                    window.open('/chat?agent=' + selectedAgent + '&new=true', '_blank');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#111827',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#111827';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <TestTube style={{ width: '16px', height: '16px' }} />
                Test in Chat
              </button>
              <button
                onClick={saveConfiguration}
                disabled={!editedConfig || saving}
                style={{
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
                  gap: '8px',
                  opacity: (!editedConfig || saving) ? 0.5 : 1,
                  pointerEvents: (!editedConfig || saving) ? 'none' : 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!selectedAgent ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <Settings style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 16px',
            color: '#9ca3af'
          }} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Select an agent to view its configuration
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Choose an agent from the dropdown above to manage its prompts, conversation flows, and variable extraction rules
          </p>
        </div>
      ) : !currentConfig ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
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
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '32px',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 0',
                  color: activeTab === tab.id ? '#111827' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? '#111827' : 'transparent'}`,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
                {tab.id === 'prompt' && <Settings style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'flow' && <GitBranch style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'flow-designer' && <Workflow style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'extraction' && <Settings style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'guardrails' && <Shield style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'tools' && <Settings style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'knowledge' && <BookOpen style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'test' && <FlaskConical style={{ width: '14px', height: '14px' }} />}
                {tab.id === 'history' && <History style={{ width: '14px', height: '14px' }} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* System Prompt Tab */}
          {activeTab === "prompt" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    System Prompt
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Define the agent&apos;s complete behavior, approach, and conversation flow in a single prompt
                  </p>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}>
                  {(editedConfig?.systemPrompt || '').length} characters
                </span>
              </div>
              
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <textarea
                  value={editedConfig?.systemPrompt || ''}
                  onChange={(e) => setEditedConfig({
                    ...editedConfig!,
                    systemPrompt: e.target.value
                  })}
                  rows={25}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontSize: '14px',
                    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#111827'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  placeholder={`Example:

You are a friendly Team Development Assistant conducting a quick 5-minute intake conversation...

## Your Approach:
- Be warm, conversational, and efficient
- Ask one question at a time
- Keep it light

## Information to Gather:
1. Manager's name
2. Organization
3. Team size
...

## Conversation Flow:
**Opening (30 seconds):**
"Hi! I'm here to learn a bit about your team..."

**Basic Info (1 minute):**
"First, could you tell me your name..."
...`}
                />
              </div>
            </div>
          )}

          {/* Flow Configuration Tab */}
          {activeTab === "flow" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    Conversation Flow Configuration
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Define conversation states and transitions for the agent&apos;s state machine
                  </p>
                </div>
                <button
                  onClick={() => toast.info("Visual flow editor coming soon")}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <GitBranch style={{ width: '14px', height: '14px' }} />
                  Visual Editor
                </button>
              </div>
              
              {/* Flow Configuration Display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* States Section */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    Conversation States ({editedConfig?.flowConfig?.states?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {editedConfig?.flowConfig?.states?.map((state) => (
                      <span key={state.name} style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {state.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Transitions Section */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    State Transitions
                  </h4>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    {(editedConfig?.flowConfig?.transitions || []).map((transition, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: '500' }}>{transition.from}</span>
                        {' → '}
                        <span style={{ color: '#6b7280' }}>
                          {transition.to || 'END'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>
                          ({transition.condition})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Fields Section */}
                {editedConfig?.flowConfig?.requiredFields && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      Required Fields ({editedConfig.flowConfig.requiredFields.length})
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {editedConfig.flowConfig.requiredFields.map((field) => (
                        <span key={field} style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* JSON Editor */}
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '12px' }}>
                    Raw Configuration (JSON)
                  </h4>
                  <textarea
                    value={JSON.stringify(editedConfig?.flowConfig || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditedConfig({
                          ...editedConfig!,
                          flowConfig: parsed,
                        });
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={12}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      lineHeight: '1.5',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#64748b'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                    placeholder="Enter JSON configuration..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Flow Designer Tab */}
          {activeTab === "flow-designer" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    Visual Flow Designer
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Design and configure your agent&apos;s conversation flow with a visual graph editor
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      // Load the enhanced TMS flow for OnboardingAgent
                      if (selectedAgent === 'Onboarding Agent') {
                        setEditedConfig({
                          ...editedConfig!,
                          flowConfig: ENHANCED_ONBOARDING_FLOW as any
                        });
                        toast.success('Loaded enhanced TMS onboarding flow');
                      } else {
                        toast.info('Enhanced flows coming soon for other agents');
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#111827';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <Plus style={{ width: '14px', height: '14px' }} />
                    Load TMS Template
                  </button>
                </div>
              </div>
              
              {/* Flow Designer Component */}
              {editedConfig?.flowConfig && isFlowConfiguration(editedConfig.flowConfig) ? (
                <FlowDesignerWrapper
                  flowConfig={editedConfig.flowConfig as FlowConfiguration}
                  onConfigChange={(newConfig) => {
                    setEditedConfig({
                      ...editedConfig,
                      flowConfig: newConfig as any
                    });
                  }}
                />
              ) : (
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '48px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb'
                }}>
                  <Workflow style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 16px',
                    color: '#9ca3af'
                  }} />
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    No Graph-Based Flow Configuration
                  </h4>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    marginBottom: '16px'
                  }}>
                    This agent is using a simple flow configuration. Click "Load TMS Template" to use the enhanced graph-based flow system.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Extraction Rules Tab */}
          {activeTab === "extraction" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    Variable Extraction Rules
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Define patterns and rules for extracting information from conversations
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingVariable(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'white',
                    color: '#111827',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  Add Variable
                </button>
              </div>
              
              {/* Variable Form */}
              {(isAddingVariable || editingVariable) && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '2px solid #111827',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      {isAddingVariable ? 'Add New Variable' : 'Edit Variable'}
                    </h4>
                    <button
                      onClick={() => {
                        setIsAddingVariable(false);
                        setEditingVariable(null);
                        setVariableForm({
                          name: '',
                          type: 'string',
                          description: '',
                          required: false,
                          patterns: [''],
                          useLLMFallback: false,
                          suggestedValues: []
                        });
                      }}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      <X style={{ width: '20px', height: '20px' }} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Variable Name
                      </label>
                      <input
                        type="text"
                        value={variableForm.name}
                        onChange={(e) => setVariableForm({ ...variableForm, name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                        placeholder="e.g., team_size"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                        Type
                      </label>
                      <select
                        value={variableForm.type}
                        onChange={(e) => setVariableForm({ ...variableForm, type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={variableForm.description}
                      onChange={(e) => setVariableForm({ ...variableForm, description: e.target.value })}
                      placeholder="Describe what this variable captures"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={variableForm.required}
                        onChange={(e) => setVariableForm({ ...variableForm, required: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Required Field
                    </label>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={variableForm.useLLMFallback}
                        onChange={(e) => setVariableForm({ ...variableForm, useLLMFallback: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                        disabled={!variableForm.required}
                      />
                      Use LLM Fallback
                    </label>
                    {variableForm.required && (
                      <p style={{ fontSize: '12px', color: '#6b7280', marginLeft: '24px', marginTop: '4px' }}>
                        If regex patterns fail, use AI to extract this field
                      </p>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Extraction Patterns (Regex)
                      </label>
                      <button
                        onClick={handleAddPattern}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus style={{ width: '12px', height: '12px' }} />
                        Add Pattern
                      </button>
                    </div>
                    
                    {variableForm.patterns.map((pattern, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          value={pattern}
                          onChange={(e) => handlePatternChange(index, e.target.value)}
                          placeholder="Enter regex pattern"
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            outline: 'none'
                          }}
                        />
                        {variableForm.patterns.length > 1 && (
                          <button
                            onClick={() => handleRemovePattern(index)}
                            style={{
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Suggested Values
                      </label>
                      <button
                        onClick={handleAddSuggestedValue}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus style={{ width: '12px', height: '12px' }} />
                        Add Value
                      </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      These values will be shown to users when they're uncertain about their response
                    </p>
                    
                    {variableForm.suggestedValues.length === 0 ? (
                      <button
                        onClick={handleAddSuggestedValue}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px dashed #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: '#fafafa',
                          color: '#6b7280',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Plus style={{ width: '16px', height: '16px' }} />
                        Add your first suggested value
                      </button>
                    ) : (
                      variableForm.suggestedValues.map((value, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleSuggestedValueChange(index, e.target.value)}
                            placeholder="Enter suggested value"
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                          <button
                            onClick={() => handleRemoveSuggestedValue(index)}
                            style={{
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setIsAddingVariable(false);
                        setEditingVariable(null);
                        setVariableForm({
                          name: '',
                          type: 'string',
                          description: '',
                          required: false,
                          patterns: [''],
                          useLLMFallback: false,
                          suggestedValues: []
                        });
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        color: '#374151',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={isAddingVariable ? handleAddVariable : handleUpdateVariable}
                      disabled={!variableForm.name}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: variableForm.name ? '#111827' : '#e5e7eb',
                        color: variableForm.name ? 'white' : '#9ca3af',
                        fontWeight: '500',
                        cursor: variableForm.name ? 'pointer' : 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      {isAddingVariable ? 'Add Variable' : 'Update Variable'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Extraction Rules Display */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Rules List */}
                {Object.entries(editedConfig?.extractionRules || {}).map(([fieldName, rule]) => (
                  <div key={fieldName} style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                          {fieldName}
                        </h4>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          {rule.description || 'No description'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {rule.type}
                        </span>
                        {rule.required && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            required
                          </span>
                        )}
                        {rule.useLLMFallback && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            LLM
                          </span>
                        )}
                        <button
                          onClick={() => handleEditVariable(fieldName)}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Edit variable"
                        >
                          <Edit2 style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the variable "${fieldName}"?`)) {
                              handleDeleteVariable(fieldName);
                            }
                          }}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Delete variable"
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                    
                    {(rule.pattern || rule.patterns) && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#1e293b',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#e2e8f0',
                        overflowX: 'auto'
                      }}>
                        {rule.pattern ? (
                          <div>{rule.pattern}</div>
                        ) : rule.patterns ? (
                          rule.patterns.map((pattern, idx) => (
                            <div key={idx}>{pattern}</div>
                          ))
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}

                {/* JSON Editor */}
                <div style={{
                  backgroundColor: '#1e293b',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', marginBottom: '12px' }}>
                    Raw Extraction Rules (JSON)
                  </h4>
                  <textarea
                    value={JSON.stringify(editedConfig?.extractionRules || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setEditedConfig({
                          ...editedConfig!,
                          extractionRules: parsed,
                        });
                      } catch {
                        // Invalid JSON, don't update
                      }
                    }}
                    rows={12}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#0f172a',
                      color: '#e2e8f0',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      lineHeight: '1.5',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#64748b'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
                    placeholder="Enter extraction rules..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Guardrails Tab */}
          {activeTab === "guardrails" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    Guardrail Configuration
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Configure conversation guardrails to keep interactions on track and appropriate
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Message Length Settings */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Message Length
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                        Minimum Length
                      </label>
                      <input
                        type="number"
                        value={editedConfig?.guardrailConfig?.minMessageLength || 10}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig!,
                          guardrailConfig: {
                            ...editedConfig?.guardrailConfig,
                            minMessageLength: parseInt(e.target.value) || 10
                          }
                        })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                        Maximum Length
                      </label>
                      <input
                        type="number"
                        value={editedConfig?.guardrailConfig?.maxMessageLength || 1000}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig!,
                          guardrailConfig: {
                            ...editedConfig?.guardrailConfig,
                            maxMessageLength: parseInt(e.target.value) || 1000
                          }
                        })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                      Allowed Greetings (messages shorter than minimum that are still allowed)
                    </label>
                    <textarea
                      value={(editedConfig?.guardrailConfig?.allowedGreetings || []).join(', ')}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig!,
                        guardrailConfig: {
                          ...editedConfig?.guardrailConfig,
                          allowedGreetings: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="hi, hello, hey, good morning, thanks, yes, no, ok..."
                    />
                  </div>
                </div>

                {/* Topic Relevance Settings */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Topic Relevance
                  </h4>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editedConfig?.guardrailConfig?.enableTopicRelevance !== false}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig!,
                          guardrailConfig: {
                            ...editedConfig?.guardrailConfig,
                            enableTopicRelevance: e.target.checked
                          }
                        })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        Enable topic relevance checking
                      </span>
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                      Off-Topic Patterns (regex patterns, one per line)
                    </label>
                    <textarea
                      value={(editedConfig?.guardrailConfig?.offTopicPatterns || []).join('\n')}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig!,
                        guardrailConfig: {
                          ...editedConfig?.guardrailConfig,
                          offTopicPatterns: e.target.value.split('\n').filter(Boolean)
                        }
                      })}
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                      }}
                      placeholder="/\b(michael jackson|celebrity|movie)\b/i&#10;/\b(who is|what is|when was)\b/i"
                    />
                  </div>
                </div>

                {/* Conversation Time Settings */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Time Limits
                  </h4>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                      Maximum Conversation Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={(editedConfig?.guardrailConfig?.maxConversationTime || 2700000) / 60000}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig!,
                        guardrailConfig: {
                          ...editedConfig?.guardrailConfig,
                          maxConversationTime: (parseInt(e.target.value) || 45) * 60000
                        }
                      })}
                      style={{
                        width: '200px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                {/* Content Moderation */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Content Moderation
                  </h4>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editedConfig?.guardrailConfig?.enableProfanityCheck !== false}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig!,
                        guardrailConfig: {
                          ...editedConfig?.guardrailConfig,
                          enableProfanityCheck: e.target.checked
                        }
                      })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>
                      Enable profanity and inappropriate content checking
                    </span>
                  </label>

                  {/* Report Access Check for DebriefAgent */}
                  {editedConfig?.agentName === 'DebriefAgent' && (
                    <>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}>
                        <input
                          type="checkbox"
                          checked={editedConfig?.guardrailConfig?.enableReportAccessCheck !== false}
                          onChange={(e) => setEditedConfig({
                            ...editedConfig!,
                            guardrailConfig: {
                              ...editedConfig?.guardrailConfig,
                              enableReportAccessCheck: e.target.checked
                            }
                          })}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151' }}>
                          Enable report access check (verify user owns the report)
                        </span>
                      </label>
                      
                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                          Max Questions Per Session
                        </label>
                        <input
                          type="number"
                          value={editedConfig?.guardrailConfig?.maxQuestionsPerSession || 30}
                          onChange={(e) => setEditedConfig({
                            ...editedConfig!,
                            guardrailConfig: {
                              ...editedConfig?.guardrailConfig,
                              maxQuestionsPerSession: parseInt(e.target.value) || 30
                            }
                          })}
                          style={{
                            width: '100px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            backgroundColor: '#fff'
                          }}
                          min="1"
                          max="100"
                        />
                        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
                          questions
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TMS Tools Tab */}
          {activeTab === "tools" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    TMS Tools Configuration
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Configure which TMS Global tools this agent can access
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Onboarding Tools */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Onboarding Tools
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'tms_create_org', name: 'Create Organization', desc: 'Create organization and facilitator account in TMS Global' },
                      { id: 'tms_facilitator_login', name: 'Facilitator Login', desc: 'Facilitator/team manager login to TMS Global' },
                      { id: 'tms_create_respondent', name: 'Create Respondent', desc: 'Create respondent account without password (Clerk integration)' },
                      { id: 'tms_create_facilitator', name: 'Create Facilitator', desc: 'Create facilitator account without password (Clerk integration)' },
                      { id: 'tms_token_exchange', name: 'Token Exchange', desc: 'Exchange Clerk user ID for TMS JWT token' }
                    ].map(tool => (
                      <label key={tool.id} style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editedConfig?.toolsConfig?.enabledTools?.includes(tool.id) || false}
                          onChange={(e) => {
                            const currentTools = editedConfig?.toolsConfig?.enabledTools || [];
                            const newTools = e.target.checked
                              ? [...currentTools, tool.id]
                              : currentTools.filter(t => t !== tool.id);
                            
                            setEditedConfig({
                              ...editedConfig!,
                              toolsConfig: {
                                ...editedConfig?.toolsConfig,
                                enabledTools: newTools
                              }
                            });
                          }}
                          style={{ width: '16px', height: '16px', marginTop: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {tool.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assessment Tools */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Assessment Tools
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'tms_assign_subscription', name: 'Assign Subscription', desc: 'Assign a workflow subscription to a user' },
                      { id: 'tms_get_workflow_process', name: 'Get Workflow Process', desc: 'Get current workflow state with questions for an assessment' },
                      { id: 'tms_update_workflow', name: 'Update Workflow', desc: 'Submit answers and update workflow progress' },
                      { id: 'tms_get_question_actions', name: 'Get Question Actions', desc: 'Check conditional logic for questions based on current answers' },
                      { id: 'tms_get_question_ids_with_actions', name: 'Get Question IDs with Actions', desc: 'Get questions that have conditional logic on a specific page' },
                      { id: 'tms_get_dashboard_subscriptions', name: 'Get Dashboard Subscriptions', desc: 'Get user\'s assessment subscriptions' },
                      { id: 'tms_start_workflow', name: 'Start Workflow', desc: 'Start or initialize an assessment workflow' }
                    ].map(tool => (
                      <label key={tool.id} style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editedConfig?.toolsConfig?.enabledTools?.includes(tool.id) || false}
                          onChange={(e) => {
                            const currentTools = editedConfig?.toolsConfig?.enabledTools || [];
                            const newTools = e.target.checked
                              ? [...currentTools, tool.id]
                              : currentTools.filter(t => t !== tool.id);
                            
                            setEditedConfig({
                              ...editedConfig!,
                              toolsConfig: {
                                ...editedConfig?.toolsConfig,
                                enabledTools: newTools
                              }
                            });
                          }}
                          style={{ width: '16px', height: '16px', marginTop: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {tool.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Debrief Tools */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Debrief Tools
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'tms_generate_html_report', name: 'Generate HTML Report', desc: 'Generate HTML report for a completed assessment' },
                      { id: 'tms_generate_graph', name: 'Generate Graph', desc: 'Generate PNG graph/chart for reports' },
                      { id: 'tms_debrief_report', name: 'Debrief Report', desc: 'Interactive debrief of assessment report with Q&A capability' }
                    ].map(tool => (
                      <label key={tool.id} style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editedConfig?.toolsConfig?.enabledTools?.includes(tool.id) || false}
                          onChange={(e) => {
                            const currentTools = editedConfig?.toolsConfig?.enabledTools || [];
                            const newTools = e.target.checked
                              ? [...currentTools, tool.id]
                              : currentTools.filter(t => t !== tool.id);
                            
                            setEditedConfig({
                              ...editedConfig!,
                              toolsConfig: {
                                ...editedConfig?.toolsConfig,
                                enabledTools: newTools
                              }
                            });
                          }}
                          style={{ width: '16px', height: '16px', marginTop: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {tool.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reporting Tools */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                    Reporting Tools
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { id: 'tms_generate_html_report', name: 'Generate HTML Report', desc: 'Generate HTML report for a completed assessment' },
                      { id: 'tms_generate_graph', name: 'Generate Graph', desc: 'Generate PNG graph/chart for reports' },
                      { id: 'tms_generate_team_signals_360', name: 'Team Signals 360', desc: 'Generate Team Signals 360 report (aggregated team view)' }
                    ].map(tool => (
                      <label key={tool.id} style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editedConfig?.toolsConfig?.enabledTools?.includes(tool.id) || false}
                          onChange={(e) => {
                            const currentTools = editedConfig?.toolsConfig?.enabledTools || [];
                            const newTools = e.target.checked
                              ? [...currentTools, tool.id]
                              : currentTools.filter(t => t !== tool.id);
                            
                            setEditedConfig({
                              ...editedConfig!,
                              toolsConfig: {
                                ...editedConfig?.toolsConfig,
                                enabledTools: newTools
                              }
                            });
                          }}
                          style={{ width: '16px', height: '16px', marginTop: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                            {tool.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {tool.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #ffeaa7'
                }}>
                  <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#856404', marginBottom: '8px' }}>
                    Quick Actions
                  </h5>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        // Load default tools for this agent type
                        const agentName = selectedAgent.replace(' ', '');
                        const defaultTools: Record<string, string[]> = {
                          'OnboardingAgent': ['tms_create_org', 'tms_facilitator_login', 'tms_create_respondent', 'tms_create_facilitator', 'tms_token_exchange'],
                          'AssessmentAgent': ['tms_assign_subscription', 'tms_get_workflow_process', 'tms_update_workflow', 'tms_get_question_actions', 'tms_get_question_ids_with_actions', 'tms_get_dashboard_subscriptions', 'tms_start_workflow'],
                          'DebriefAgent': ['tms_generate_html_report', 'tms_generate_graph', 'tms_debrief_report'],
                          'ReportingAgent': ['tms_generate_html_report', 'tms_generate_graph', 'tms_generate_team_signals_360']
                        };
                        
                        const tools = defaultTools[agentName] || [];
                        setEditedConfig({
                          ...editedConfig!,
                          toolsConfig: {
                            ...editedConfig?.toolsConfig,
                            enabledTools: tools
                          }
                        });
                        
                        toast.success(`Loaded ${tools.length} default tools for ${selectedAgent}`);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d4a574',
                        backgroundColor: '#f9e79f',
                        color: '#7d6608',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Load Default Tools
                    </button>
                    <button
                      onClick={() => {
                        setEditedConfig({
                          ...editedConfig!,
                          toolsConfig: {
                            ...editedConfig?.toolsConfig,
                            enabledTools: []
                          }
                        });
                        toast.success('All tools disabled');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #d4a574',
                        backgroundColor: '#f9e79f',
                        color: '#7d6608',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Clear All Tools
                    </button>
                  </div>
                </div>

                {/* Info Note */}
                <div style={{
                  backgroundColor: '#e0f2fe',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #7dd3fc'
                }}>
                  <p style={{ fontSize: '13px', color: '#0369a1', margin: 0 }}>
                    <strong>Note:</strong> These tools connect to TMS Global APIs. The user must have a valid TMS JWT token for authentication. Mock endpoints are currently active for testing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === "knowledge" && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '4px'
                  }}>
                    Knowledge Base Configuration
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Configure TMS knowledge base access for this agent
                  </p>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '24px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      Enable Knowledge Base
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      Allow this agent to search and retrieve information from TMS IP documents
                    </p>
                  </div>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '48px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={editedConfig?.knowledgeConfig?.enabled || false}
                      onChange={(e) => {
                        if (editedConfig) {
                          setEditedConfig({
                            ...editedConfig,
                            knowledgeConfig: {
                              ...editedConfig.knowledgeConfig,
                              enabled: e.target.checked
                            }
                          });
                        }
                      }}
                      style={{
                        opacity: 0,
                        width: 0,
                        height: 0
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: editedConfig?.knowledgeConfig?.enabled ? '#10b981' : '#d1d5db',
                      transition: '0.3s',
                      borderRadius: '9999px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: editedConfig?.knowledgeConfig?.enabled ? '26px' : '2px',
                        top: '2px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        transition: '0.3s',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
                      }} />
                    </span>
                  </label>
                </div>

                {editedConfig?.knowledgeConfig?.enabled && (
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '12px'
                    }}>
                      Available Knowledge Tools
                    </h5>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      {[
                        'search_tms_knowledge',
                        'get_assessment_methodology', 
                        'get_questionnaire_items',
                        'search_intervention_strategies',
                        'get_benchmark_data'
                      ].map(tool => (
                        <span
                          key={tool}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <p style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#6b7280',
                      fontStyle: 'italic'
                    }}>
                      These tools allow the agent to access TMS methodologies, questionnaires, and research documents
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Tab */}
          {activeTab === "test" && (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#6b7280'
            }}>
              <FlaskConical style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                opacity: 0.3
              }} />
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Test Playground Coming Soon
              </h4>
              <p style={{ fontSize: '14px' }}>
                You&apos;ll be able to test your agent configurations with simulated conversations
              </p>
            </div>
          )}

          {/* Version History Tab */}
          {activeTab === "history" && (
            <div>
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
                }}>
                  Version History
                </h3>
                <div style={{ position: 'relative' }}>
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
                    placeholder="Search versions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      paddingLeft: '40px',
                      paddingRight: '16px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      width: '250px',
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
              </div>

              {configHistory.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <GitBranch style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 16px',
                    color: '#9ca3af'
                  }} />
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>
                    No version history yet
                  </h4>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    Version history will appear here after you save changes
                  </p>
                </div>
              ) : (
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
                        }}>Version</th>
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
                        }}>Created</th>
                        <th style={{
                          textAlign: 'left',
                          padding: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>Author</th>
                        <th style={{
                          textAlign: 'left',
                          padding: '12px',
                          fontWeight: '500',
                          color: '#6b7280',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configHistory
                        .filter(config => 
                          searchQuery === '' || 
                          config.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((config) => (
                          <tr
                            key={config.id}
                            style={{
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '16px 12px', fontWeight: '500' }}>
                              v{config.version}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              <StatusBadge 
                                status={config.active ? "active" : "neutral"} 
                              />
                            </td>
                            <td style={{ padding: '16px 12px', color: '#6b7280' }}>
                              {format(new Date(config.createdAt), "MMM d, yyyy HH:mm")}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              {config.createdBy}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={() => toast.info("View diff coming soon")}
                                  style={{
                                    padding: '6px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                                    e.currentTarget.style.color = '#111827';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                  }}
                                >
                                  <GitBranch style={{ width: '16px', height: '16px' }} />
                                </button>
                                {!config.active && (
                                  <button
                                    onClick={() => toast.info("Rollback functionality coming soon")}
                                    style={{
                                      padding: '6px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      color: '#6b7280',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                                      e.currentTarget.style.color = '#111827';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#6b7280';
                                    }}
                                  >
                                    <RotateCcw style={{ width: '16px', height: '16px' }} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}