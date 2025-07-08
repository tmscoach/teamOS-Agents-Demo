"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "MMM d, yyyy HH:mm:ss");
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
        <h1 className="text-3xl font-bold tracking-tight">Guardrail Monitoring</h1>
        <p className="text-muted-foreground">Monitor and analyze guardrail violations across all agents</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChecks.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              {stats.passRate >= 90 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalChecks - stats.failedChecks} passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedChecks.toLocaleString()}</div>
              <div className="flex gap-2 mt-2">
                {Object.entries(stats.severityBreakdown).map(([severity, count]) => (
                  <Badge key={severity} variant="secondary" className={getSeverityColor(severity)}>
                    {severity}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.violationsByAgent.length}</div>
              <p className="text-xs text-muted-foreground">
                Agents with violations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="violations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">Recent Violations</TabsTrigger>
          <TabsTrigger value="search">Search & Filter</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Guardrail Violations</CardTitle>
              <CardDescription>
                Latest 10 guardrail violations across all agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Guardrail</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Input</TableHead>
                    <TableHead>Reasoning</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentViolations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="text-sm">{formatTimestamp(violation.timestamp)}</TableCell>
                      <TableCell className="font-medium">{violation.agentName}</TableCell>
                      <TableCell>{violation.guardrailType}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity || "low"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{violation.input}</TableCell>
                      <TableCell className="max-w-xs truncate">{violation.reasoning}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/conversations/${violation.conversationId}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Guardrail Violations</CardTitle>
              <CardDescription>
                Search and filter through all guardrail check history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by input or reasoning..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchGuardrails()}
                  />
                </div>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Agents</SelectItem>
                    <SelectItem value="OnboardingAgent">Onboarding Agent</SelectItem>
                    <SelectItem value="AssessmentAgent">Assessment Agent</SelectItem>
                    <SelectItem value="AnalysisAgent">Analysis Agent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={searchGuardrails}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Found {searchResults.total} violations
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Guardrail</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>{formatTimestamp(result.timestamp)}</TableCell>
                          <TableCell>{result.agentName}</TableCell>
                          <TableCell>{result.guardrailType}</TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(result.severity)}>
                              {result.severity || "low"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Violations by Type</CardTitle>
                <CardDescription>
                  Distribution of guardrail violations by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.violationsByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.type}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Violations by Agent</CardTitle>
                <CardDescription>
                  Agent-wise distribution of violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.violationsByAgent.map((item) => (
                    <div key={item.agent} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.agent}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}