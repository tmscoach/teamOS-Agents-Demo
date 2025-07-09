"use client";

import { useState, useEffect } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { Settings } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface AgentSummary {
  agentName: string;
  activeVersion: number;
  totalVersions: number;
  lastUpdated: string;
  updatedBy: string;
}

export default function AgentConfigPage() {
  const { userId } = useAuth();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

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
          Agent Configuration
        </h2>
        <p className="text-[var(--teams-text-secondary)] mt-2">
          Manage agent prompts, flows, and extraction rules
        </p>
      </div>

      {/* Main Content */}
      <div className="teams-card">
        <div className="mb-6">
          <h3 className="text-[18px] font-semibold text-[var(--teams-text-primary)] mb-4">
            Select an agent to configure
          </h3>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-4 py-2 min-w-[200px] border border-[var(--teams-ui-border)] rounded-[var(--teams-radius-md)] bg-[var(--teams-surface)] text-[var(--teams-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--teams-primary)]/20 focus:border-[var(--teams-primary)]"
          >
            <option value="">Select an agent</option>
            {[
              "Orchestrator Agent",
              "Discovery Agent", 
              "Onboarding Agent",
              "Assessment Agent",
              "Alignment Agent",
              "Learning Agent",
              "Nudge Agent",
              "Progress Monitor",
              "Recognition Agent"
            ].map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </div>

        <EmptyState
          icon={Settings}
          title="Select an agent to view its configuration"
          description="You can manage prompts, conversation flows, and variable extraction rules"
        />
      </div>
    </div>
  );
}