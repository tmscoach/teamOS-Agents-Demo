"use client";

import { useState, useEffect } from "react";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin";
import { StatusBadge, SeverityBadge } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

interface GuardrailCheck {
  id: string;
  conversationId: string;
  agentName: string;
  guardrailType: string;
  input: string;
  passed: boolean;
  severity: string | null;
  reasoning: string;
  timestamp: string;
  conversation?: {
    id: string;
    teamId: string;
    managerId: string;
  };
}

interface GuardrailStats {
  totalChecks: number;
  failedChecks: number;
  passRate: number;
  severityBreakdown: Record<string, number>;
  violationsByType: Array<{ type: string; count: number }>;
  violationsByAgent: Array<{ agent: string; count: number }>;
}

export default function GuardrailsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<GuardrailStats | null>(null);
  const [recentViolations, setRecentViolations] = useState<GuardrailCheck[]>([]);
  const [searchResults, setSearchResults] = useState<{ results: GuardrailCheck[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, violationsRes] = await Promise.all([
        fetch("/api/admin/guardrails/stats"),
        fetch("/api/admin/guardrails/stats?recent=true&limit=10"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (violationsRes.ok) {
        const violationsData = await violationsRes.json();
        setRecentViolations(violationsData);
      }
    } catch (error) {
      console.error("Error fetching guardrail data:", error);
      toast.error("Failed to load guardrail data");
    } finally {
      setLoading(false);
    }
  };

  const searchGuardrails = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (filterAgent) params.append("agentName", filterAgent);
      if (filterType) params.append("guardrailType", filterType);
      if (filterSeverity) params.append("severity", filterSeverity);
      params.append("passed", "false");

      const res = await fetch(`/api/admin/guardrails?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Error searching guardrails:", error);
      toast.error("Failed to search guardrails");
    }
  };


  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM d, yyyy HH:mm:ss");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teams-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-teams-lg">
      <div>
        <h1 className="text-4xl font-bold text-teams-text-primary">Guardrail Monitoring</h1>
        <p className="text-teams-text-secondary mt-teams-xs">Monitor and analyze guardrail violations across all agents</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-teams-md md:grid-cols-4">
          <AdminCard padding="sm">
            <div className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teams-text-secondary">Total Checks</p>
                <div className="text-2xl font-bold text-teams-text-primary mt-teams-xs">{stats.totalChecks.toLocaleString()}</div>
              </div>
              <Shield className="h-4 w-4 text-teams-text-secondary" />
            </div>
          </AdminCard>

          <AdminCard padding="sm">
            <div className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teams-text-secondary">Pass Rate</p>
                <div className="text-2xl font-bold text-teams-text-primary mt-teams-xs">{stats.passRate.toFixed(1)}%</div>
                <p className="text-xs text-teams-text-tertiary mt-teams-xs">
                  {stats.totalChecks - stats.failedChecks} passed
                </p>
              </div>
              {stats.passRate >= 90 ? (
                <TrendingUp className="h-4 w-4 text-teams-accent-green" />
              ) : (
                <TrendingDown className="h-4 w-4 text-teams-accent-pink" />
              )}
            </div>
          </AdminCard>

          <AdminCard padding="sm">
            <div className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teams-text-secondary">Violations</p>
                <div className="text-2xl font-bold text-teams-text-primary mt-teams-xs">{stats.failedChecks.toLocaleString()}</div>
                <div className="flex gap-teams-xs mt-teams-sm">
                  {Object.entries(stats.severityBreakdown).map(([severity, count]) => (
                    severity ? (
                      <SeverityBadge key={severity} severity={severity as "high" | "medium" | "low"} />
                    ) : (
                      <StatusBadge key="unknown" status="neutral" size="sm">
                        unknown: {count}
                      </StatusBadge>
                    )
                  ))}
                </div>
              </div>
              <AlertTriangle className="h-4 w-4 text-teams-accent-orange" />
            </div>
          </AdminCard>

          <AdminCard padding="sm">
            <div className="flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teams-text-secondary">Active Agents</p>
                <div className="text-2xl font-bold text-teams-text-primary mt-teams-xs">{stats.violationsByAgent.length}</div>
                <p className="text-xs text-teams-text-tertiary mt-teams-xs">
                  Agents with violations
                </p>
              </div>
              <Shield className="h-4 w-4 text-teams-text-secondary" />
            </div>
          </AdminCard>
        </div>
      )}

      <Tabs defaultValue="violations" className="space-y-teams-md">
        <TabsList className="bg-teams-ui-bg border border-teams-ui-border">
          <TabsTrigger value="violations" className="data-[state=active]:bg-teams-bg data-[state=active]:text-teams-text-primary">Recent Violations</TabsTrigger>
          <TabsTrigger value="search" className="data-[state=active]:bg-teams-bg data-[state=active]:text-teams-text-primary">Search & Filter</TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-teams-bg data-[state=active]:text-teams-text-primary">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-teams-md">
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Recent Guardrail Violations</AdminCardTitle>
              <p className="text-sm text-teams-text-secondary mt-teams-xs">
                Latest 10 guardrail violations across all agents
              </p>
            </AdminCardHeader>
            <AdminCardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-teams-ui-border">
                    <TableHead className="text-teams-text-secondary">Timestamp</TableHead>
                    <TableHead className="text-teams-text-secondary">Agent</TableHead>
                    <TableHead className="text-teams-text-secondary">Guardrail</TableHead>
                    <TableHead className="text-teams-text-secondary">Severity</TableHead>
                    <TableHead className="text-teams-text-secondary">Input</TableHead>
                    <TableHead className="text-teams-text-secondary">Reasoning</TableHead>
                    <TableHead className="text-teams-text-secondary">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentViolations.map((violation, index) => (
                    <TableRow 
                      key={violation.id} 
                      className={`border-teams-ui-border ${index % 2 === 0 ? 'bg-teams-bg' : 'bg-teams-ui-bg'}`}
                    >
                      <TableCell className="text-sm text-teams-text-secondary">{formatTimestamp(violation.timestamp)}</TableCell>
                      <TableCell className="font-medium text-teams-text-primary">{violation.agentName}</TableCell>
                      <TableCell className="text-teams-text-secondary">{violation.guardrailType}</TableCell>
                      <TableCell>
                        {violation.severity ? (
                          <SeverityBadge severity={violation.severity as "high" | "medium" | "low"} />
                        ) : (
                          <StatusBadge status="neutral" size="sm">low</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-teams-text-secondary">{violation.input}</TableCell>
                      <TableCell className="max-w-xs truncate text-teams-text-secondary">{violation.reasoning}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-teams-primary hover:text-teams-primary-dark hover:bg-teams-ui-hover-bg"
                          onClick={() => router.push(`/admin/conversations/${violation.conversationId}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AdminCardContent>
          </AdminCard>
        </TabsContent>

        <TabsContent value="search" className="space-y-teams-md">
          <AdminCard>
            <AdminCardHeader>
              <AdminCardTitle>Search Guardrail Violations</AdminCardTitle>
              <p className="text-sm text-teams-text-secondary mt-teams-xs">
                Search and filter through all guardrail check history
              </p>
            </AdminCardHeader>
            <AdminCardContent className="space-y-teams-md">
              <div className="flex gap-teams-sm">
                <div className="flex-1">
                  <Input
                    placeholder="Search by input or reasoning..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchGuardrails()}
                    className="border-teams-ui-border focus:border-teams-primary bg-teams-bg"
                  />
                </div>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[180px] border-teams-ui-border focus:border-teams-primary bg-teams-bg">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent className="bg-teams-bg border-teams-ui-border">
                    <SelectItem value="">All Agents</SelectItem>
                    <SelectItem value="OnboardingAgent">Onboarding Agent</SelectItem>
                    <SelectItem value="AssessmentAgent">Assessment Agent</SelectItem>
                    <SelectItem value="AnalysisAgent">Analysis Agent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[140px] border-teams-ui-border focus:border-teams-primary bg-teams-bg">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent className="bg-teams-bg border-teams-ui-border">
                    <SelectItem value="">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={searchGuardrails}
                  className="bg-teams-primary hover:bg-teams-primary-dark text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults && (
                <div className="space-y-teams-md">
                  <p className="text-sm text-teams-text-secondary">
                    Found {searchResults.total} violations
                  </p>
                  <div className="-mx-teams-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-teams-ui-border">
                          <TableHead className="text-teams-text-secondary">Timestamp</TableHead>
                          <TableHead className="text-teams-text-secondary">Agent</TableHead>
                          <TableHead className="text-teams-text-secondary">Guardrail</TableHead>
                          <TableHead className="text-teams-text-secondary">Severity</TableHead>
                          <TableHead className="text-teams-text-secondary">Status</TableHead>
                          <TableHead className="text-teams-text-secondary">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.results.map((result, index) => (
                          <TableRow 
                            key={result.id}
                            className={`border-teams-ui-border ${index % 2 === 0 ? 'bg-teams-bg' : 'bg-teams-ui-bg'}`}
                          >
                            <TableCell className="text-teams-text-secondary">{formatTimestamp(result.timestamp)}</TableCell>
                            <TableCell className="text-teams-text-primary">{result.agentName}</TableCell>
                            <TableCell className="text-teams-text-secondary">{result.guardrailType}</TableCell>
                            <TableCell>
                              {result.severity ? (
                                <SeverityBadge severity={result.severity as "high" | "medium" | "low"} />
                              ) : (
                                <StatusBadge status="neutral" size="sm">low</StatusBadge>
                              )}
                            </TableCell>
                            <TableCell>
                              {result.passed ? (
                                <CheckCircle className="h-4 w-4 text-teams-accent-green" />
                              ) : (
                                <XCircle className="h-4 w-4 text-teams-accent-pink" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-teams-primary hover:text-teams-primary-dark hover:bg-teams-ui-hover-bg"
                                onClick={() => router.push(`/admin/conversations/${result.conversationId}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </AdminCardContent>
          </AdminCard>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-teams-md">
          <div className="grid gap-teams-md md:grid-cols-2">
            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Violations by Type</AdminCardTitle>
                <p className="text-sm text-teams-text-secondary mt-teams-xs">
                  Distribution of guardrail violations by type
                </p>
              </AdminCardHeader>
              <AdminCardContent>
                <div className="space-y-teams-sm">
                  {stats?.violationsByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between py-teams-xs">
                      <span className="text-sm font-medium text-teams-text-primary">{item.type}</span>
                      <StatusBadge status="neutral" size="sm">{item.count}</StatusBadge>
                    </div>
                  ))}
                </div>
              </AdminCardContent>
            </AdminCard>

            <AdminCard>
              <AdminCardHeader>
                <AdminCardTitle>Violations by Agent</AdminCardTitle>
                <p className="text-sm text-teams-text-secondary mt-teams-xs">
                  Agent-wise distribution of violations
                </p>
              </AdminCardHeader>
              <AdminCardContent>
                <div className="space-y-teams-sm">
                  {stats?.violationsByAgent.map((item) => (
                    <div key={item.agent} className="flex items-center justify-between py-teams-xs">
                      <span className="text-sm font-medium text-teams-text-primary">{item.agent}</span>
                      <StatusBadge status="neutral" size="sm">{item.count}</StatusBadge>
                    </div>
                  ))}
                </div>
              </AdminCardContent>
            </AdminCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}